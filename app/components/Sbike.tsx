import React, { useRef } from 'react'
import * as THREE from 'three'
import { Group } from 'three'
import { useGLTF, useAnimations } from '@react-three/drei'
import { GLTF } from 'three-stdlib'

type GLTFResult = GLTF & {
  nodes: {
    Root: THREE.Object3D
    main_machine005: THREE.Mesh
    main_machine006: THREE.Mesh
    main_machine008: THREE.Mesh
    main_machine009: THREE.Mesh
    main_machine007: THREE.Mesh
    main_machine004: THREE.Mesh
    main_machine012: THREE.Mesh
    main_machine015: THREE.Mesh
    main_machine013: THREE.Mesh
    main_machine011: THREE.Mesh
    screen: THREE.Mesh
    Body1025: THREE.Mesh
    Body1025_1: THREE.Mesh
    Body1025_2: THREE.Mesh
    Body1020: THREE.Mesh
    Body1020_1: THREE.Mesh
    Body1020_2: THREE.Mesh
  }
  materials: {
    real: THREE.Material
    'Material.014': THREE.Material
    'Material.020': THREE.Material
    'Material.022': THREE.Material
    'Material.012': THREE.Material
    'Material.024': THREE.Material
    'Material.021': THREE.Material
    'Material.018': THREE.Material
  }
}

export function Sbike(props: Partial<THREE.Group>) {
  const group = useRef<Group>(null!)
  
  const { nodes, materials, animations } =
    useGLTF('/Sbike19.glb') as unknown as GLTFResult

  useAnimations(animations, group)

  return (
    <group ref={group} {...(props as any)} dispose={null} scale={[2, 2, 2]}>
      <group name="Scene">
        <group name="Dolly_Rig" position={[0, 0.072, 5.341]}>
          <primitive object={nodes.Root} />
        </group>

        <mesh geometry={nodes.main_machine005.geometry} material={materials.real} position={[0.133, 0.351, 0.003]} />
        <mesh geometry={nodes.main_machine006.geometry} material={materials.real} position={[0.063, 0.288, 0.065]}>
          <mesh geometry={nodes.main_machine008.geometry} material={materials.real} position={[-0.011, -0.171, 0.029]} />
        </mesh>

        <mesh geometry={nodes.main_machine009.geometry} material={materials.real} position={[0.062, 0.289, -0.055]}>
          <mesh geometry={nodes.main_machine007.geometry} material={materials.real} position={[0.009, 0.171, -0.026]} rotation={[0, 0, 0.024]} />
        </mesh>

        <mesh geometry={nodes.main_machine004.geometry} material={materials['Material.014']} position={[-0.423, 0.387, 0.002]} />
        <mesh geometry={nodes.main_machine012.geometry} material={materials['Material.020']} />
        <mesh geometry={nodes.main_machine015.geometry} material={materials['Material.022']} position={[-0.339, 0.359, 0.002]} />

        <group position={[-0.102, 0.579, -0.012]} rotation={[-0.005, 0, 0.257]} scale={0.286}>
          <group position={[-0.299, 0.91, 0.06]} rotation={[0.005, -0.001, -0.257]} scale={3.497}>
            <mesh geometry={nodes.Body1025.geometry} material={materials.real} />
            <mesh geometry={nodes.Body1025_1.geometry} material={materials['Material.012']} />
            <mesh geometry={nodes.Body1025_2.geometry} material={materials['Material.024']} />
          </group>
        </group>

        <group position={[0.39, 0.791, 0.015]} rotation={[0, 0, -0.437]} scale={0.111}>
          <group position={[2.956, 4.631, -0.105]} rotation={[0, 0, 0.437]} scale={1.48}>
            <group position={[-5.615, -7.037, -0.022]} scale={6.068}>
              <mesh geometry={nodes.Body1020.geometry} material={materials.real} />
              <mesh geometry={nodes.Body1020_1.geometry} material={materials['Material.021']} />
              <mesh geometry={nodes.Body1020_2.geometry} material={materials['Material.018']} />
            </group>

            <mesh geometry={nodes.main_machine013.geometry} material={materials['Material.021']} position={[-5.615, -7.037, -0.022]} scale={6.068} />
            {/* Fixed: Using a fallback material instead of potentially broken texture */}
            <mesh geometry={nodes.screen.geometry} position={[-5.615, -7.037, -0.022]} scale={6.068}>
              <meshStandardMaterial color="#1a1a1a" metalness={0.8} roughness={0.2} />
            </mesh>
          </group>

          <mesh geometry={nodes.main_machine011.geometry} material={materials.real} position={[0.647, 1.7, -0.154]} rotation={[0, 0, 0.437]} scale={8.978} />
        </group>
      </group>
    </group>
  )
}

useGLTF.preload('/Sbike19.glb')