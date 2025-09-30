'use client';

import { Suspense, useRef, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { Scene } from './Scene';
import { ZoomedUI } from './ZoomedUI';
import styles from './page.module.css';
import { Github, Linkedin, ChevronDown } from 'lucide-react';

export default function Home() {
  const sceneRef = useRef();
  const [isUIDisplayed, setIsUIDisplayed] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [screenCorners, setScreenCorners] = useState(null);

  const handleZoomIn = () => {
    setIsZoomed(true);
    sceneRef.current?.zoomIn();
  };
  
  const handleGoBack = () => {
    setIsUIDisplayed(false);
    setIsZoomed(false);
    setScreenCorners(null);
    sceneRef.current?.zoomOut();
  };

  useEffect(() => {
    // Only attach scroll listener when not zoomed
    if (isZoomed) return;

    const handleScroll = (e) => {
      e.preventDefault();
      handleZoomIn();
    };

    const handleWheel = (e) => {
      e.preventDefault();
      handleZoomIn();
    };

    // Add both scroll and wheel event listeners
    window.addEventListener('scroll', handleScroll, { passive: false });
    window.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('wheel', handleWheel);
    };
  }, [isZoomed]);

  const canvasContainerClasses = isZoomed
    ? `${styles.canvasContainer} ${styles.zoomed}`
    : styles.canvasContainer;

  const heroClasses = isZoomed
    ? `${styles.hero} ${styles.heroFaded}`
    : styles.hero;

  return (
    <main className={styles.page}>
      {isUIDisplayed && <ZoomedUI onBack={handleGoBack} screenCorners={screenCorners} />}

      <div className={heroClasses}>
        <h1>Hello, I&apos;m Tom Matson!</h1>
        <div className={styles.socials}>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub"
          >
            <Github size={32} />
          </a>
          <a
            href="https://linkedin.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="LinkedIn"
          >
            <Linkedin size={32} />
          </a>
        </div>
        <div className={styles.scrollIndicator}>
          <span>Scroll</span>
          <ChevronDown size={24} className={styles.scrollArrow} />
        </div>
      </div>

      <div className={canvasContainerClasses}>
        <Canvas>
          <Suspense fallback={null}>
            <Scene
              ref={sceneRef}
              onZoomInComplete={() => setIsUIDisplayed(true)}
              onScreenTransform={setScreenCorners}
            />
          </Suspense>
        </Canvas>
      </div>
    </main>
  );
}