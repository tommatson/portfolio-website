'use client';

import { useRef, useState, forwardRef, useImperativeHandle, useEffect } from 'react';
import { OrbitControls } from '@react-three/drei';
import { useThree, useFrame } from '@react-three/fiber';
import { Vector3, Box3, Spherical } from 'three';
import { Model } from './Model';

// --- Constants for camera states ---
const REFERENCE_WIDTH = 1920;
const REFERENCE_HEIGHT = 1080;
const ANIMATION_DURATION = 1.2;
const ROTATION_DURATION = 0.8;

// Helper function to calculate responsive camera distance
const calculateResponsiveCameraDistance = (viewportWidth, viewportHeight) => {
  const aspectRatio = viewportWidth / viewportHeight;
  
  // Base distance calculation using viewport height as primary factor
  // The model should take up roughly 50-60% of the viewport height
  let baseDistance = 5.0;
  
  // Scale based on viewport dimensions
  if (viewportHeight < 600) {
    // Very small screens (mobile landscape, small phones)
    baseDistance = 6.5;
  } else if (viewportHeight < 800) {
    // Medium screens (tablets, smaller laptops)
    baseDistance = 5.5;
  } else if (viewportHeight < 1000) {
    // Standard screens
    baseDistance = 5.0;
  } else {
    // Large screens
    baseDistance = 4.5;
  }
  
  // Adjust for aspect ratio
  if (aspectRatio < 0.75) {
    // Very portrait (narrow phones)
    baseDistance *= 1.4;
  } else if (aspectRatio < 1) {
    // Portrait tablets
    baseDistance *= 1.2;
  } else if (aspectRatio > 2.5) {
    // Ultra-wide monitors
    baseDistance *= 0.95;
  } else if (aspectRatio > 2) {
    // Wide monitors
    baseDistance *= 1.0;
  }
  
  // Additional adjustment for very small widths (portrait phones)
  if (viewportWidth < 400) {
    baseDistance *= 1.3;
  } else if (viewportWidth < 768) {
    baseDistance *= 1.15;
  }
  
  // Clamp to reasonable bounds
  const minDistance = 3.5;
  const maxDistance = 8.0;
  
  return Math.max(minDistance, Math.min(maxDistance, baseDistance));
};

// Helper function to calculate zoom padding based on screen size
const calculateZoomPadding = (viewportWidth, viewportHeight) => {
  const aspectRatio = viewportWidth / viewportHeight;
  const screenArea = viewportWidth * viewportHeight;
  const referenceArea = REFERENCE_WIDTH * REFERENCE_HEIGHT;
  
  // Base padding
  let padding = 1.05;
  
  // Increase padding on smaller screens
  if (screenArea < referenceArea * 0.5) {
    padding = 1.15;
  } else if (screenArea < referenceArea * 0.75) {
    padding = 1.10;
  }
  
  // Adjust for extreme aspect ratios
  if (aspectRatio < 0.75) {
    // Very portrait
    padding *= 1.1;
  } else if (aspectRatio > 2.5) {
    // Very wide
    padding *= 1.05;
  }
  
  return padding;
};

// Helper function to normalize angle to 0-360 range
const normalizeAngle = (angle) => {
  let normalized = angle % 360;
  if (normalized < 0) normalized += 360;
  return normalized;
};

// Helper function to get the shortest rotation direction and target angle
const getRotationCorrection = (currentAngle) => {
  
  const normalized = normalizeAngle(currentAngle);
  console.log(normalized);
  const safeAngle1 = 95;
  const safeAngle2 = 275;

  // Check if we're in the problematic range (95-265 degrees)
  if (normalized >= safeAngle1 && normalized <= safeAngle2 ) {

    console.log('rotating');
    // Determine which boundary is closer
    const distTo135 = Math.abs(normalized - safeAngle1);
    const distTo225 = Math.abs(normalized - safeAngle2);
    console.log(distTo135, distTo225);
    
    const targetAngle = distTo135 <= distTo225 ? safeAngle1 : safeAngle2;
    return { needsCorrection: true, targetAngle };
  }
  
  return { needsCorrection: false, targetAngle: normalized };
};

export const Scene = forwardRef(({ onZoomInComplete, onScreenTransform }, ref) => {
  const controlsRef = useRef();
  const modelRef = useRef();
  const { camera, clock, size } = useThree();

  const [initialCameraPosition, setInitialCameraPosition] = useState(() => {
    const distance = calculateResponsiveCameraDistance(size.width, size.height);
    return new Vector3(0, 0, distance);
  });
  const INITIAL_CONTROLS_TARGET = new Vector3(0, 0, 0);

  const [animationPhase, setAnimationPhase] = useState('IDLE');

  const animationState = useRef({
    startPos: new Vector3(),
    startTarget: new Vector3(),
    endPos: new Vector3(),
    endTarget: new Vector3(),
    duration: 1,
    startTime: 0,
    onComplete: null,
  });

  const rotationState = useRef({
    startAngle: 0,
    endAngle: 0,
    startTime: 0,
    duration: ROTATION_DURATION,
    radius: 0,
    phi: 0,
    onComplete: null,
  });

  useEffect(() => {
    camera.position.copy(initialCameraPosition);
    if (controlsRef.current) {
      controlsRef.current.target.copy(INITIAL_CONTROLS_TARGET);
      controlsRef.current.update();
    }
  }, [camera, initialCameraPosition]);

  useEffect(() => {
    if (animationPhase === 'IDLE') {
      const newDistance = calculateResponsiveCameraDistance(size.width, size.height);
      const newPosition = new Vector3(0, 0, newDistance);
      setInitialCameraPosition(newPosition);
      camera.position.copy(newPosition);
      if (controlsRef.current) {
        controlsRef.current.update();
      }
    }
  }, [size.width, size.height, camera, animationPhase]);

  const performZoomIn = () => {
    const controls = controlsRef.current;
    if (!controls || !modelRef.current) return;
    const screenMesh = modelRef.current.screen;
    if (!screenMesh) {
      console.error('Screen mesh not found');
      return;
    }

    screenMesh.updateWorldMatrix(true, false);

    const box = new Box3().setFromObject(screenMesh);
    const boxSize = box.getSize(new Vector3());
    const boxCenter = box.getCenter(new Vector3());

    // Dynamic vertical offset based on screen size
    const aspectRatio = size.width / size.height;
    let verticalOffset = boxSize.y * 0.04;
    
    // Adjust offset for different aspect ratios
    if (aspectRatio < 1) {
      // Portrait - less offset
      verticalOffset *= 0.7;
    } else if (aspectRatio > 2) {
      // Ultra-wide - slightly more offset
      verticalOffset *= 1.2;
    }

    const adjustedCenter = new Vector3(
      boxCenter.x,
      boxCenter.y - verticalOffset,
      boxCenter.z
    );

    const fov = camera.fov * (Math.PI / 180);
    const aspect = camera.aspect;

    // Calculate distance to fit both dimensions
    const distToFitY = (boxSize.y / 2) / Math.tan(fov / 2);
    const distToFitX = (boxSize.x / 2) / Math.tan(fov / 2) / aspect;
    
    // Get dynamic padding based on screen size
    const padding = calculateZoomPadding(size.width, size.height);
    const cameraDistance = Math.max(distToFitX, distToFitY) * padding;

    const zoomedInPosition = new Vector3(
      adjustedCenter.x,
      adjustedCenter.y,
      adjustedCenter.z + cameraDistance
    );

    animationState.current = {
      startPos: camera.position.clone(),
      startTarget: controls.target.clone(),
      endPos: zoomedInPosition,
      endTarget: adjustedCenter,
      duration: ANIMATION_DURATION,
      startTime: clock.getElapsedTime(),
      onComplete: () => {
        camera.position.copy(zoomedInPosition);
        controls.target.copy(adjustedCenter);

        setAnimationPhase('ZOOMED');
        if (onZoomInComplete) onZoomInComplete();
      },
    };
    setAnimationPhase('ZOOMING_IN');
  };

  useImperativeHandle(ref, () => ({
    zoomIn: () => {
      const controls = controlsRef.current;
      if (!controls || !modelRef.current || animationPhase !== 'IDLE') return;

      // Get current camera angle around Y axis
      const cameraPos = camera.position.clone();
      const target = controls.target.clone();
      const relativePos = cameraPos.sub(target);
      
      // Convert to spherical coordinates to get the azimuthal angle (theta)
      const spherical = new Spherical().setFromVector3(relativePos);
      const currentAngleDeg = (spherical.theta * 180 / Math.PI);
      
      // Check if rotation correction is needed
      const { needsCorrection, targetAngle } = getRotationCorrection(currentAngleDeg);
      
      if (needsCorrection) {
        // Need to rotate first before zooming
        const targetAngleRad = targetAngle * Math.PI / 180;
        const startAngle = spherical.theta;
        
        // Calculate the shortest rotation path
        let angleDiff = targetAngleRad - startAngle;
        
        // Normalize the difference to be between -π and π
        while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
        while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
        
        // The end angle should be start + shortest difference
        const endAngle = startAngle + angleDiff;
        
        rotationState.current = {
          startAngle: startAngle,
          endAngle: endAngle,
          startTime: clock.getElapsedTime(),
          duration: ROTATION_DURATION,
          radius: spherical.radius,
          phi: spherical.phi,
          onComplete: performZoomIn,
        };
        
        setAnimationPhase('ROTATING');
      } else {
        // No rotation needed, zoom directly
        performZoomIn();
      }
    },
    zoomOut: () => {
      const controls = controlsRef.current;
      if (!controls || animationPhase !== 'ZOOMED') return;

      animationState.current = {
        startPos: camera.position.clone(),
        startTarget: controls.target.clone(),
        endPos: initialCameraPosition,
        endTarget: INITIAL_CONTROLS_TARGET,
        duration: ANIMATION_DURATION,
        startTime: clock.getElapsedTime(),
        onComplete: () => {
          camera.position.copy(initialCameraPosition);
          controls.target.copy(INITIAL_CONTROLS_TARGET);
          setAnimationPhase('IDLE');
        },
      };
      setAnimationPhase('ZOOMING_OUT');
    },
  }));

  useFrame(() => {
    const controls = controlsRef.current;
    if (!controls) return;

    if (animationPhase === 'IDLE' && controls.enabled) {
      controls.update();
      return;
    }

    if (animationPhase === 'ROTATING') {
      const elapsedTime = clock.getElapsedTime() - rotationState.current.startTime;
      const progress = Math.min(elapsedTime / rotationState.current.duration, 1);
      const easedProgress = 0.5 * (1 - Math.cos(Math.PI * progress)); // easeInOutSine

      // Interpolate the angle
      const currentTheta = rotationState.current.startAngle + 
        (rotationState.current.endAngle - rotationState.current.startAngle) * easedProgress;
      
      // Convert back to Cartesian coordinates
      const spherical = new Spherical(
        rotationState.current.radius,
        rotationState.current.phi,
        currentTheta
      );
      
      const newPos = new Vector3().setFromSpherical(spherical);
      newPos.add(controls.target);
      camera.position.copy(newPos);
      controls.update();

      if (progress >= 1 && rotationState.current.onComplete) {
        const callback = rotationState.current.onComplete;
        rotationState.current.onComplete = null;
        callback();
      }
    }

    if (['ZOOMING_IN', 'ZOOMING_OUT'].includes(animationPhase)) {
      const elapsedTime = clock.getElapsedTime() - animationState.current.startTime;
      const progress = Math.min(elapsedTime / animationState.current.duration, 1);
      const easedProgress = 0.5 * (1 - Math.cos(Math.PI * progress)); // easeInOutSine

      camera.position.lerpVectors(
        animationState.current.startPos,
        animationState.current.endPos,
        easedProgress
      );
      controls.target.lerpVectors(
        animationState.current.startTarget,
        animationState.current.endTarget,
        easedProgress
      );
      controls.update();

      if (progress >= 1 && animationState.current.onComplete) {
        const callback = animationState.current.onComplete;
        animationState.current.onComplete = null;
        callback();
      }
    }

    // Calculate screen transform for overlay positioning
    if (animationPhase === 'ZOOMED' && modelRef.current?.screen && onScreenTransform) {
      const screenMesh = modelRef.current.screen;
      screenMesh.updateWorldMatrix(true, false);

      const geometry = screenMesh.geometry;
      const position = geometry.attributes.position;
      
      // Get all unique vertices
      const vertexMap = new Map();
      const vertices = [];
      
      for (let i = 0; i < position.count; i++) {
        const vertex = new Vector3(
          position.getX(i),
          position.getY(i),
          position.getZ(i)
        );
        
        // Create a key for deduplication
        const key = `${vertex.x.toFixed(6)},${vertex.y.toFixed(6)},${vertex.z.toFixed(6)}`;
        
        if (!vertexMap.has(key)) {
          vertexMap.set(key, vertex);
          vertices.push(vertex);
        }
      }
      
      // Transform vertices to world space then to screen space
      const screenPoints = vertices.map(vertex => {
        const worldVertex = vertex.clone().applyMatrix4(screenMesh.matrixWorld);
        worldVertex.project(camera);
        
        return {
          x: (worldVertex.x * 0.5 + 0.5) * size.width,
          y: (-(worldVertex.y * 0.5) + 0.5) * size.height,
          z: worldVertex.z
        };
      });
      
      // Compute convex hull using Graham scan algorithm
      const convexHull = (points) => {
        if (points.length < 3) return points;
        
        // Find the bottom-most point (or left-most in case of tie)
        let start = 0;
        for (let i = 1; i < points.length; i++) {
          if (points[i].y > points[start].y || 
              (points[i].y === points[start].y && points[i].x < points[start].x)) {
            start = i;
          }
        }
        
        const startPoint = points[start];
        
        // Sort points by polar angle with respect to start point
        const sortedPoints = points
          .filter((_, i) => i !== start)
          .sort((a, b) => {
            const angleA = Math.atan2(a.y - startPoint.y, a.x - startPoint.x);
            const angleB = Math.atan2(b.y - startPoint.y, b.x - startPoint.x);
            if (angleA === angleB) {
              const distA = Math.hypot(a.x - startPoint.x, a.y - startPoint.y);
              const distB = Math.hypot(b.x - startPoint.x, b.y - startPoint.y);
              return distA - distB;
            }
            return angleA - angleB;
          });
        
        const hull = [startPoint];
        
        for (const point of sortedPoints) {
          while (hull.length > 1) {
            const p2 = hull[hull.length - 1];
            const p1 = hull[hull.length - 2];
            const cross = (p2.x - p1.x) * (point.y - p1.y) - (p2.y - p1.y) * (point.x - p1.x);
            if (cross > 0) break;
            hull.pop();
          }
          hull.push(point);
        }
        
        return hull;
      };
      
      const hullPoints = convexHull(screenPoints);
      onScreenTransform(hullPoints);
    }
  });

  const isInteractive = animationPhase === 'IDLE';

  return (
    <>
      <OrbitControls
        ref={controlsRef}
        enabled={isInteractive}
        enableZoom={false}
        autoRotate={isInteractive}
        autoRotateSpeed={0.5}
        enableDamping={true}
      />

      <ambientLight intensity={0.7} />
      <directionalLight position={[10, 10, 5]} intensity={1.5} />

      <Model ref={modelRef} />
    </>
  );
});

Scene.displayName = 'Scene';