"use client";
import { useRef, useState, Suspense, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, useGLTF, Html } from "@react-three/drei";
import * as THREE from "three";

type Position = [number, number, number];

useGLTF.preload("/N 4 (1).glb");
useGLTF.preload("/E glb 1.glb");
useGLTF.preload("/Oglb.glb");

interface Particle3D {
  id: number;
  mesh: THREE.Sprite;
  velocity: THREE.Vector3;
  rotation: THREE.Euler;
  rotationSpeed: THREE.Vector3;
  life: number;
  maxLife: number;
  initialOpacity: number;
  originalPosition: THREE.Vector3;
  cursorPosition: THREE.Vector3;
  returning: boolean;
  returnStartTime: number;
  gridKey: string;
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center w-full h-full">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
    </div>
  );
}

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

function FloatingParticles({ particles, onParticleReturned }: {
  particles: Particle3D[];
  onParticleReturned?: (gridKey: string) => void;
}) {
  useFrame(() => {
    particles.forEach((particle) => {
      particle.life += 0.016;

      if (particle.life < 3) {
        particle.mesh.position.add(particle.velocity);

        particle.mesh.rotation.x += particle.rotationSpeed.x;
        particle.mesh.rotation.y += particle.rotationSpeed.y;
        particle.mesh.rotation.z += particle.rotationSpeed.z;

        particle.mesh.material.opacity = 1;
        particle.mesh.visible = true;
      } else {
        if (!particle.returning) {
          particle.returning = true;
          particle.returnStartTime = particle.life;

          if (onParticleReturned) {
            onParticleReturned(particle.gridKey);
          }
        }

        particle.mesh.material.opacity = 0;
        particle.mesh.visible = false;
      }
    });
  });

  return (
    <>
      {particles.map((particle) => (
        <primitive key={particle.id} object={particle.mesh} />
      ))}
    </>
  );
}

function LetterInstance({
  modelPath,
  position,
  imagePath,
}: {
  modelPath: string;
  position: Position;
  imagePath: string;
}) {
  const modelRef = useRef<THREE.Group>(null);
  const clonedScene = useRef<THREE.Group | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textureRef = useRef<THREE.Texture | null>(null);

  const [particles, setParticles] = useState<Particle3D[]>([]);
  const [brokenAreas, setBrokenAreas] = useState<Set<string>>(new Set());
  const [imageLoaded, setImageLoaded] = useState(false);
  const [hovering, setHovering] = useState(false);

  const particlesRef = useRef<Particle3D[]>([]);
  const brokenAreasRef = useRef<Set<string>>(new Set());
  const lastMousePos = useRef({ x: 0, y: 0 });
  const imageElementRef = useRef<HTMLImageElement | null>(null);

  const { scene } = useGLTF(modelPath);
  const { camera, gl } = useThree();

  if (!clonedScene.current) {
    clonedScene.current = scene.clone();
  }

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imageElementRef.current = img;

      const canvas = document.createElement('canvas');
      canvas.width = 110;
      canvas.height = 110;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, 110, 110);
        canvasRef.current = canvas;
      }

      setImageLoaded(true);
    };
    img.src = imagePath;
  }, [imagePath]);

  const createFragments = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!imageLoaded || !canvasRef.current) return;

    const container = event.currentTarget;
    const rect = container.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    const dx = mouseX - lastMousePos.current.x;
    const dy = mouseY - lastMousePos.current.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < 10) return;

    lastMousePos.current = { x: mouseX, y: mouseY };

    const breakRadius = 25;
    const fragmentSize = 8;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const newParticles: Particle3D[] = [];
    const newBrokenAreas = new Set(brokenAreasRef.current);

    // Calculate cursor position in 3D space for velocity calculation
    const cursorXPos = position[0] + (mouseX - 55) * 0.02;
    const cursorYPos = position[1] + (55 - mouseY) * 0.02;
    const cursorZPos = position[2] + 1;

    for (let offsetX = -breakRadius; offsetX <= breakRadius; offsetX += fragmentSize) {
      for (let offsetY = -breakRadius; offsetY <= breakRadius; offsetY += fragmentSize) {
        const x = mouseX + offsetX;
        const y = mouseY + offsetY;

        if (x < 0 || x > 110 || y < 0 || y > 110) continue;

        const distToMouse = Math.sqrt(offsetX * offsetX + offsetY * offsetY);
        if (distToMouse > breakRadius) continue;

        const gridX = Math.floor(x / fragmentSize);
        const gridY = Math.floor(y / fragmentSize);
        const key = `${gridX}-${gridY}`;

        if (newBrokenAreas.has(key)) continue;
        newBrokenAreas.add(key);

        const fragmentCanvas = document.createElement('canvas');
        fragmentCanvas.width = fragmentSize;
        fragmentCanvas.height = fragmentSize;
        const fragmentCtx = fragmentCanvas.getContext('2d');

        if (fragmentCtx && imageElementRef.current) {
          const actualX = gridX * fragmentSize;
          const actualY = gridY * fragmentSize;

          fragmentCtx.drawImage(
            imageElementRef.current,
            actualX, actualY, fragmentSize, fragmentSize,
            0, 0, fragmentSize, fragmentSize
          );

          const fragmentTexture = new THREE.CanvasTexture(fragmentCanvas);
          fragmentTexture.needsUpdate = true;

          const spriteMaterial = new THREE.SpriteMaterial({
            map: fragmentTexture,
            transparent: true,
            opacity: 1,
          });

          const sprite = new THREE.Sprite(spriteMaterial);
          const scale = 0.15;
          sprite.scale.set(scale, scale, 1);

          // Calculate the original position (where fragment belongs - for cleanup later)
          const originalXPos = position[0] + (actualX - 55) * 0.02;
          const originalYPos = position[1] + (55 - actualY) * 0.02;
          const originalZPos = position[2] + 1;

          // START all particles at CURSOR position (same point)
          sprite.position.set(cursorXPos, cursorYPos, cursorZPos);

          const force = 1 - (distToMouse / breakRadius);
          const angle = Math.atan2(offsetY, offsetX) + (Math.random() - 0.5) * 1.2;
          const speed = 0.02 + force * 0.035;

          const velocity = new THREE.Vector3(
            Math.cos(angle) * speed * 0.7,
            Math.sin(angle) * speed,
            (Math.random() - 0.5) * 0.06
          );

          const particle: Particle3D = {
            id: Math.random(),
            mesh: sprite,
            velocity,
            rotation: new THREE.Euler(
              Math.random() * Math.PI * 2,
              Math.random() * Math.PI * 2,
              Math.random() * Math.PI * 2
            ),
            rotationSpeed: new THREE.Vector3(
              (Math.random() - 0.5) * 0.1,
              (Math.random() - 0.5) * 0.1,
              (Math.random() - 0.5) * 0.15
            ),
            life: 0,
            maxLife: 0.5,
            initialOpacity: 1,
            originalPosition: new THREE.Vector3(originalXPos, originalYPos, originalZPos),
            cursorPosition: new THREE.Vector3(cursorXPos, cursorYPos, cursorZPos),
            returning: false,
            returnStartTime: 0,
            gridKey: key,
          };

          newParticles.push(particle);
        }
      }
    }

    if (newParticles.length === 0) return;

    const allParticles = [...particlesRef.current, ...newParticles];
    particlesRef.current = allParticles;
    setParticles(allParticles);
    brokenAreasRef.current = newBrokenAreas;
    setBrokenAreas(newBrokenAreas);

    setTimeout(() => {
      newParticles.forEach(p => {
        brokenAreasRef.current.delete(p.gridKey);
      });
      setBrokenAreas(new Set(brokenAreasRef.current));

      const updatedParticles = particlesRef.current.filter(p => {
        if (newParticles.includes(p)) {
          p.mesh.material.dispose();
          if (p.mesh.material.map) p.mesh.material.map.dispose();
          return false;
        }
        return true;
      });
      particlesRef.current = updatedParticles;
      setParticles(updatedParticles);
    }, 2100);
  };

  return (
    <group position={position}>
      <primitive
        ref={modelRef}
        object={clonedScene.current}
        scale={2.5}
        rotation={[0, -Math.PI / 2, 0]}
      />

      <FloatingParticles
        particles={particles}
        onParticleReturned={(gridKey) => {
          // Particle has returned to its position
        }}
      />

      <Html
        position={[0, 0, 1]}
        center
        transform
        zIndexRange={[100, 0]}
        style={{
          pointerEvents: 'auto',
          userSelect: 'none',
        }}
      >
        <div
          onMouseMove={createFragments}
          onMouseEnter={() => setHovering(true)}
          onMouseLeave={() => setHovering(false)}
          style={{
            width: '110px',
            height: '110px',
            position: 'relative',
            cursor: 'pointer',
          }}
        >
          <svg width="110" height="110" style={{ display: 'block' }}>
            <defs>
              <mask id={`mask-${position[0]}`}>
                <rect width="110" height="110" fill="white" />
                {Array.from(brokenAreas).map((key) => {
                  const [i, j] = key.split('-').map(Number);
                  const fragmentSize = 8;
                  return (
                    <rect
                      key={key}
                      x={i * fragmentSize}
                      y={j * fragmentSize}
                      width={fragmentSize}
                      height={fragmentSize}
                      fill="black"
                    />
                  );
                })}
              </mask>
            </defs>
            <image
              href={imagePath}
              width="110"
              height="110"
              mask={`url(#mask-${position[0]})`}
            />
          </svg>
        </div>
      </Html>
    </group>
  );
}

function ThreeLetters() {
  return (
    <>
      <LetterInstance
        modelPath="/N 4 (1).glb"
        position={[-3, 0, 0]}
        imagePath="/N (1).png"
      />
      <LetterInstance
        modelPath="/E glb 1.glb"
        position={[0, 0, 0]}
        imagePath="/E (1).png"
      />
      <LetterInstance
        modelPath="/Oglb.glb"
        position={[3, 0, 0]}
        imagePath="/O (1).png"
      />
    </>
  );
}

const Neo = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
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
      <div
        style={{
          width: "880px",
          height: "400px",
        }}
      >
        <Canvas
          camera={{ position: [0, 0, 15], fov: 35 }}
          style={{ width: "100%", height: "100%" }}
          gl={{
            antialias: true,
            alpha: false,
            powerPreference: "high-performance",
          }}
          shadows={false}
        >
          <Suspense fallback={<LoadingBox />}>
            <Environment
              files="/test.hdr"
              blur={1.5}
              environmentIntensity={0.8}
            />
            <ambientLight intensity={0.5} />
            <directionalLight position={[5, 5, 5]} intensity={1} />
            <ThreeLetters />
          </Suspense>
        </Canvas>
      </div>
    </div>
  );
};

export default Neo;