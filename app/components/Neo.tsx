"use client";

import { useRef, useState, Suspense, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, useGLTF } from "@react-three/drei";
import * as THREE from "three";

type Rotation = { x: number; y: number };
type Position = [number, number, number];

// Preload models outside component to load them immediately
useGLTF.preload("/N 4 (1).glb");

// Loading spinner component
function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center w-[140px] h-[140px]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
    </div>
  );
}

// Simple loading fallback for 3D scene
function LoadingBox() {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.getElapsedTime();
      meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.5;
    }
  });

  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#444444" wireframe />
    </mesh>
  );
}

// Individual letter instance using shared model
function LetterInstance({
  scene,
  targetRotation,
  position,
}: {
  scene: THREE.Group;
  targetRotation: Rotation;
  position: Position;
}) {
  const modelRef = useRef<THREE.Group>(null);
  const currentRotation = useRef<Rotation>({ x: 0, y: 0 });
  const clonedScene = useRef<THREE.Group | null>(null);
2
  // Clone scene only once
  if (!clonedScene.current) {
    clonedScene.current = scene.clone();
  }

  useFrame(() => {
    if (!modelRef.current) return;

    currentRotation.current.x = THREE.MathUtils.lerp(
      currentRotation.current.x,
      targetRotation.x,
      0.05
    );
    currentRotation.current.y = THREE.MathUtils.lerp(
      currentRotation.current.y,
      targetRotation.y,
      0.05
    );

    modelRef.current.rotation.x = currentRotation.current.x;
    modelRef.current.rotation.y = currentRotation.current.y - Math.PI / 2;
  });

  return (
    <primitive
      ref={modelRef}
      object={clonedScene.current}
      scale={2.5}
      position={position}
    />
  );
}

// Shared model loader component
function SharedLetterModels({
  rotations,
}: {
  rotations: [Rotation, Rotation, Rotation];
}) {
  const { scene } = useGLTF("/N 4 (1).glb");

  return (
    <>
      <LetterInstance
        scene={scene}
        targetRotation={rotations[0]}
        position={[0, 0, 0]}
      />
    </>
  );
}

type LetterProps = {
  rotation: Rotation;
  setRotation: React.Dispatch<React.SetStateAction<Rotation>>;
  index: number;
};

function LetterCanvas({ rotation, setRotation, index }: LetterProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const entryPos = useRef({ x: 0, y: 0 });
  const currentPos = useRef({ x: 0, y: 0 });

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    entryPos.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    currentPos.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handleMouseLeave = () => {
    if (!containerRef.current) return;

    const deltaX = currentPos.current.x - entryPos.current.x;
    const deltaY = currentPos.current.y - entryPos.current.y;

    setRotation((prev) => {
      let newRotationY = prev.y;
      let newRotationX = prev.x;

      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        newRotationY = prev.y + (deltaX > 0 ? Math.PI * 2 : -Math.PI * 2);
      } else {
        newRotationX = prev.x + (deltaY > 0 ? Math.PI * 2 : -Math.PI * 2);
      }

      return { x: newRotationX, y: newRotationY };
    });
  };

  return (
    <div
      ref={containerRef}
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        width: "140px",
        height: "140px",
        perspective: "800px",
        cursor: "pointer",
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 4.5], fov: 50 }}
        style={{ width: "160px", height: "160px" }}
      
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: "high-performance",
          // Enable hardware acceleration
          
        }}
        // Disable unnecessary features for performance
        shadows={false}
      >
        <Suspense fallback={<LoadingBox />}>
          <Environment
            files="/test.hdr"
          
            blur={0.5}
            environmentIntensity={0.8}
          />
          <SharedLetterModels rotations={[rotation, rotation, rotation]} />
        </Suspense>
      </Canvas>
    </div>
  );
}

const Neo = () => {
  const [rotation1, setRotation1] = useState<Rotation>({ x: 0, y: 0 });
  const [rotation2, setRotation2] = useState<Rotation>({ x: 0, y: 0 });
  const [rotation3, setRotation3] = useState<Rotation>({ x: 0, y: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading time - remove this in production
    // The models will load via preload
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-white"></div>
          <p className="text-white text-sm">Loading 3D Models...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-black">
      <div className="flex items-center gap-4">
        <LetterCanvas
          rotation={rotation1}
          setRotation={setRotation1}
          index={0}
        />
        <LetterCanvas
          rotation={rotation2}
          setRotation={setRotation2}
          index={1}
        />
        <LetterCanvas
          rotation={rotation3}
          setRotation={setRotation3}
          index={2}
        />
      </div>
    </div>
  );
};

export default Neo;