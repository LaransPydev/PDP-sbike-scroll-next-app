import React, { useRef, useEffect, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import {
  Environment,
  PerspectiveCamera,
} from "@react-three/drei";
import gsap from "gsap";
import { Sbike } from "./Sbike";
import * as THREE from "three";

type SceneProps = {
  progress: number;
};

type CameraKeyframe = {
  position: [number, number, number];
  target: [number, number, number];
  fov?: number;
};

const Scene: React.FC<SceneProps> = ({ progress }) => {
  const cameraRef = useRef<THREE.PerspectiveCamera>(null);
  const targetRef = useRef(new THREE.Vector3(0, 0, 0));
  
  const [debugMode] = useState(false);
  const [debugTarget, setDebugTarget] = useState<[number, number, number]>([0, 0, 0]);
  const { raycaster, mouse, scene } = useThree();

  useFrame(() => {
    if (!cameraRef.current) return;
    
    if (!debugMode) {
      cameraRef.current.lookAt(targetRef.current);
    }
    cameraRef.current.updateProjectionMatrix();
  });

  // Click handler for debug mode
  useEffect(() => {
    if (!debugMode) return;

    const handleClick = (event: MouseEvent) => {
      if (!cameraRef.current) return;
      
      const canvas = event.target as HTMLCanvasElement;
      const rect = canvas.getBoundingClientRect();
      
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, cameraRef.current);
      const intersects = raycaster.intersectObjects(scene.children, true);

      if (intersects.length > 0) {
        const point = intersects[0].point;
        const coords: [number, number, number] = [
          Number(point.x.toFixed(2)),
          Number(point.y.toFixed(2)),
          Number(point.z.toFixed(2)),
        ];
        setDebugTarget(coords);
        console.log("Clicked target:", coords);
        console.log("Camera position:", [
          Number(cameraRef.current.position.x.toFixed(2)),
          Number(cameraRef.current.position.y.toFixed(2)),
          Number(cameraRef.current.position.z.toFixed(2)),
        ]);
        console.log("Current progress:", progress);
      }
    };

    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, [debugMode, raycaster, mouse, scene]);

  // Camera animation effect
  useEffect(() => {
    if (debugMode) return;
    if (!cameraRef.current) return;

    // 5 keyframes for 5 scroll sections (520vh / ~100vh each)
    const keyframes: CameraKeyframe[] = [
      // Section 1: Initial wide view - hero shot
      { 
        position: [0, 1, 5], 
        target: [0, 0, 0],
        fov: 45, 
      },
      // Section 2: Zoom to body/frame - LED lights section
      { 
        position: [2, 0.5, 2], 
        target: [0, 0.3, 0],
        fov: 35, 
      },
      // Section 3: Front angle view
      { 
        position: [-2, 0.5, 2], 
        target: [0, 0.3, -0.5],
        fov: 40, 
      },
      // Section 4: Low angle dramatic shot
      { 
        position: [3, 0.2, 2], 
        target: [0, 0.2, 0],
        fov: 30, 
      },
      // Section 5: Final wide shot
      { 
        position: [4, 2, 5], 
        target: [0, 0, 0],
        fov: 40, 
      },
    ];

    // Handle edge cases
    if (keyframes.length < 2) return;

    const segmentProgress = 1 / (keyframes.length - 1);
    const clampedProgress = Math.min(Math.max(progress, 0), 0.9999);
    const segmentIndex = Math.floor(clampedProgress / segmentProgress);
    const percentage = (clampedProgress % segmentProgress) / segmentProgress;

    const start = keyframes[segmentIndex];
    const end = keyframes[Math.min(segmentIndex + 1, keyframes.length - 1)];

    if (!start || !end) return;

    const [sx, sy, sz] = start.position;
    const [ex, ey, ez] = end.position;

    const [tsx, tsy, tsz] = start.target;
    const [tex, tey, tez] = end.target;

    const startFov = start.fov ?? 35;
    const endFov = end.fov ?? 35;
    const currentFov = startFov + (endFov - startFov) * percentage;

    gsap.to(cameraRef.current.position, {
      x: sx + (ex - sx) * percentage,
      y: sy + (ey - sy) * percentage,
      z: sz + (ez - sz) * percentage,
      duration: 0.3,
      ease: "power2.out",
    });

    gsap.to(targetRef.current, {
      x: tsx + (tex - tsx) * percentage,
      y: tsy + (tey - tsy) * percentage,
      z: tsz + (tez - tsz) * percentage,
      duration: 0.3,
      ease: "power2.out",
    });

    gsap.to(cameraRef.current, {
      fov: currentFov,
      duration: 0.3,
      ease: "power2.out",
    });
  }, [progress, debugMode]);

  return (
    <>
      <PerspectiveCamera
        ref={cameraRef}
        makeDefault
        fov={45}
        near={0.1}
        far={10000}
        position={[0, 1, 5]}
      />
      <Environment preset="warehouse" />
      <Sbike />

      {debugMode && (
        <>
          <axesHelper args={[5]} />
          <mesh position={debugTarget}>
            <sphereGeometry args={[0.1, 16, 16]} />
            <meshBasicMaterial color="red" />
          </mesh>
        </>
      )}
    </>
  );
};

export default Scene;