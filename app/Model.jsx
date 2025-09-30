import React, { forwardRef } from 'react'
import { useGLTF } from '@react-three/drei'

export const Model = forwardRef((props, ref) => {
  const { nodes, materials } = useGLTF('/mac-model.glb')
  const screenRef = React.useRef()
  const groupRef = React.useRef()
  
  // Expose both the group and the screen ref to parent
  React.useImperativeHandle(ref, () => ({
    group: groupRef.current,
    screen: screenRef.current
  }))
  
  return (
    <group ref={groupRef} {...props} dispose={null}>
      <group rotation={[Math.PI / 2, 0, 0]} scale={0.05}>
        <mesh geometry={nodes.Cube003.geometry} material={materials['Computer.001']} />
        <mesh geometry={nodes.Cube003_1.geometry} material={materials['Metal.001']} />
        <mesh geometry={nodes.Cube003_2.geometry} material={materials['Blackplastic.001']} />
        <mesh geometry={nodes.Cube003_3.geometry} material={materials['Whiteplastic.001']} />
        {/* This is the screen mesh - add ref here */}
        <mesh 
          ref={screenRef}
          geometry={nodes.Cube003_4.geometry} 
          material={materials['Screen.001']} 
        />
        <mesh geometry={nodes.Cube003_5.geometry} material={materials['Material.001']} />
        <mesh geometry={nodes.Brightness.geometry} material={materials.Computer} position={[-9.388, 12.701, 10.355]} />
        <mesh geometry={nodes.Brightness001.geometry} material={materials['Computer.001']} position={[-9.388, 12.701, 10.355]} />
        <mesh geometry={nodes.Text.geometry} material={materials['Apple Orange']} position={[-4.364, 14.275, 7.626]} rotation={[-0.133, 0, 0]} scale={[1.341, 1.37, 1.426]} />
        <mesh geometry={nodes.Text001.geometry} material={materials['Apple Yellow']} position={[-5.072, 14.284, 7.698]} rotation={[-0.133, 0, 0]} scale={[1.341, 1.37, 1.426]} />
        <mesh geometry={nodes.Text002.geometry} material={materials['Apple Red']} position={[-5.704, 14.285, 7.701]} rotation={[-0.133, 0, 0]} scale={[1.341, 1.37, 1.426]} />
        <mesh geometry={nodes.Text003.geometry} material={materials['Apple Blue']} position={[-6.172, 14.287, 7.715]} rotation={[-0.133, 0, 0]} scale={[1.341, 1.37, 1.426]} />
        <mesh geometry={nodes.Text004.geometry} material={materials['Apple Purple']} position={[-6.692, 14.29, 7.737]} rotation={[-0.133, 0, 0]} scale={[1.341, 1.37, 1.426]} />
        <mesh geometry={nodes.Text005.geometry} material={materials['Apple Red']} position={[-7.493, 14.274, 7.616]} rotation={[-0.133, 0, 0]} scale={[1.341, 1.37, 1.426]} />
        <mesh geometry={nodes.Text006.geometry} material={materials['Apple Orange']} position={[-8.527, 14.274, 7.616]} rotation={[-0.133, 0, 0]} scale={[1.341, 1.37, 1.426]} />
        <mesh geometry={nodes.Text007.geometry} material={materials['Apple Yellow']} position={[-9.416, 14.284, 7.698]} rotation={[-0.133, 0, 0]} scale={[1.341, 1.37, 1.426]} />
        <mesh geometry={nodes.Text008.geometry} material={materials['Apple Green']} position={[-9.999, 14.287, 7.715]} rotation={[-0.133, 0, 0]} scale={[1.341, 1.37, 1.426]} />
        <mesh geometry={nodes.Text009.geometry} material={nodes.Text009.material} position={[-4.364, 14.112, 7.647]} rotation={[-0.133, 0, 0]} scale={[1.341, 1.37, 1.426]} />
        <mesh geometry={nodes.Text010.geometry} material={nodes.Text010.material} position={[-5.072, 14.122, 7.719]} rotation={[-0.133, 0, 0]} scale={[1.341, 1.37, 1.426]} />
        <mesh geometry={nodes.Text011.geometry} material={nodes.Text011.material} position={[-5.704, 14.122, 7.723]} rotation={[-0.133, 0, 0]} scale={[1.341, 1.37, 1.426]} />
        <mesh geometry={nodes.Text012.geometry} material={nodes.Text012.material} position={[-6.172, 14.124, 7.737]} rotation={[-0.133, 0, 0]} scale={[1.341, 1.37, 1.426]} />
        <mesh geometry={nodes.Text013.geometry} material={nodes.Text013.material} position={[-6.692, 14.127, 7.759]} rotation={[-0.133, 0, 0]} scale={[1.341, 1.37, 1.426]} />
        <mesh geometry={nodes.Text014.geometry} material={nodes.Text014.material} position={[-7.493, 14.111, 7.638]} rotation={[-0.133, 0, 0]} scale={[1.341, 1.37, 1.426]} />
        <mesh geometry={nodes.Text015.geometry} material={nodes.Text015.material} position={[-8.527, 14.111, 7.638]} rotation={[-0.133, 0, 0]} scale={[1.341, 1.37, 1.426]} />
        <mesh geometry={nodes.Text016.geometry} material={nodes.Text016.material} position={[-9.416, 14.122, 7.719]} rotation={[-0.133, 0, 0]} scale={[1.341, 1.37, 1.426]} />
        <mesh geometry={nodes.Text017.geometry} material={nodes.Text017.material} position={[-9.999, 14.124, 7.737]} rotation={[-0.133, 0, 0]} scale={[1.341, 1.37, 1.426]} />
        <mesh geometry={nodes.Text018.geometry} material={nodes.Text018.material} position={[-10.021, 14.194, 7.645]} rotation={[-0.133, 0, 0]} scale={[1.341, 1.37, 1.426]} />
        <mesh geometry={nodes.Text019.geometry} material={nodes.Text019.material} position={[-9.415, 14.203, 7.709]} rotation={[-0.133, 0, 0]} scale={[1.341, 1.37, 1.426]} />
        <mesh geometry={nodes.Text020.geometry} material={nodes.Text020.material} position={[-9.416, 14.203, 7.709]} rotation={[-0.133, 0, 0]} scale={[1.341, 1.37, 1.426]} />
        <mesh geometry={nodes.Text021.geometry} material={nodes.Text021.material} position={[-8.541, 14.2, 7.69]} rotation={[-0.133, 0, 0]} scale={[1.341, 1.37, 1.426]} />
        <mesh geometry={nodes.Text022.geometry} material={nodes.Text022.material} position={[-7.507, 14.2, 7.69]} rotation={[-0.133, 0, 0]} scale={[1.341, 1.37, 1.426]} />
        <mesh geometry={nodes.Text023.geometry} material={nodes.Text023.material} position={[-6.7, 14.208, 7.745]} rotation={[-0.133, 0, 0]} scale={[1.341, 1.37, 1.426]} />
        <mesh geometry={nodes.Text024.geometry} material={nodes.Text024.material} position={[-6.715, 14.22, 7.839]} rotation={[-0.133, 0, 0]} scale={[1.341, 1.37, 1.426]} />
        <mesh geometry={nodes.Text025.geometry} material={nodes.Text025.material} position={[-6.194, 14.194, 7.645]} rotation={[-0.133, 0, 0]} scale={[1.341, 1.37, 1.426]} />
        <mesh geometry={nodes.Text026.geometry} material={nodes.Text026.material} position={[-5.705, 14.204, 7.716]} rotation={[-0.133, 0, 0]} scale={[1.341, 1.37, 1.426]} />
        <mesh geometry={nodes.Text027.geometry} material={nodes.Text027.material} position={[-5.072, 14.203, 7.709]} rotation={[-0.133, 0, 0]} scale={[1.341, 1.37, 1.426]} />
        <mesh geometry={nodes.Text028.geometry} material={nodes.Text028.material} position={[-5.073, 14.203, 7.709]} rotation={[-0.133, 0, 0]} scale={[1.341, 1.37, 1.426]} />
        <mesh geometry={nodes.Text029.geometry} material={nodes.Text029.material} position={[-4.379, 14.202, 7.699]} rotation={[-0.133, 0, 0]} scale={[1.341, 1.37, 1.426]} />
      </group>
    </group>
  )
})

Model.displayName = 'Model'

useGLTF.preload('/mac-model.glb')