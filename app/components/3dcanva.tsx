"use client";

import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Register GSAP plugins
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

/* ==================== CONFIG ==================== */
const CONFIG = {
  TOTAL_FRAMES: 120,
  MODEL: {
    PATH: "https://s3.us-east-1.amazonaws.com/sportstech.team/dev_assets/Sbike51.glb",
    POSITION_Y_OFFSET: -1,
    SCALE: {
      sm: 0.04,
      md: 0.06,
      lg: 0.4,
      xl: 1.0,
    },
    MOBILE_POSITION: { y: -1.5, x: 0, z: 0 },
    TABLET_POSITION: { y: -1.8, x: 0, z: 0 },
    LAPTOP_POSITION: { y: -1.0, x: 0, z: 0 },
    DESKTOP_POSITION: { y: 1, x: 0, z: 0 },
  },
  HDR: {
    PATH: "https://360-product-view.s3.eu-north-1.amazonaws.com/Product-360-View/models/hdr/lightroom-4.hdr",
  },
  VIDEOS: [
    { id: 1, name: "Workout", path: "https://s3.us-east-1.amazonaws.com/sportstech.team/dev_assets/sBike-Trainer.mp4", description: "First Display" },
    { id: 2, name: "Landscape video", path: "https://s3.us-east-1.amazonaws.com/sportstech.team/dev_assets/sBike-Landscape.mp4", description: "Second Display" },
    { id: 3, name: "Gaming", path: "https://s3.us-east-1.amazonaws.com/sportstech.team/dev_assets/sBike-Gaming.mp4", description: "Third Display" },
  ],
  SCREEN: {
    MESH_NAME: "Screen",
    MATERIAL_NAME: "screen",
  },
  WHEEL: {
    MESH_NAMES: ["wheel", "LOGO"],
    ACTIVE_COLOR: 0xdc2626,
    TRANSITION_DURATION: 0.5,
  },
  RENDERER: {
    MAX_PIXEL_RATIO: 2,
    TONE_MAPPING_EXPOSURE: 0.8,
  },
  BACKGROUND: {
    MODE: "color",
    COLOR: 0xffffff,
    IMAGE: {
      PATH: "https://s3.us-east-1.amazonaws.com/sportstech.team/dev_assets/bg.png",
      FIT: "cover",
    },
  },
  CAMERA: {
    sm: { fov: 50, position: { x: 0, y: 0, z: 8 } },
    md: { fov: 50, position: { x: 0, y: 0, z: 7 } },
    lg: { fov: 60, position: { x: 0, y: 0, z: 6 } },
    xl: { fov: 1000, position: { x: 1, y: 0, z: 5 } },
  },
  ANIMATION_COMPLETE_THRESHOLD: 100,
  ANIMATION: {
    // FIX: Increased LERP factor for faster 3D model response (was 0.25)
    LERP_FACTOR: 0.4,
    // FIX: Reduced scrub for more immediate scroll response (was 0.1)
    SCRUB: 0.05,
    SCROLL_MULTIPLIER: 10,
    USE_EASING: true,
    // FIX: Snap threshold to eliminate micro-lag at end of interpolation
    SNAP_THRESHOLD: 0.05,
  },
  TEXT_ANNOTATIONS: [
    {
      id: 1,
      frameStart: 20,
      frameEnd: 30,
      position: {
        sm: { top: 100, left: 15 },
        md: { top: 180, left: 40 },
        lg: { top: 350, left: 800 },
        xl: { top: 450, left: 1000 },
      },
      title: "LED lights",
      text: "The LED lights adapt to your performance and give you motivating feedback.",
      src: "https://s3.us-east-1.amazonaws.com/sportstech.team/dev_assets/Frame3.svg",
      triggerWheelColorChange: true,
    },
    {
      id: 2,
      frameStart: 40,
      frameEnd: 50,
      position: {
        sm: { top: 150, left: 15 },
        md: { top: 240, left: 40 },
        lg: { top: 320, left: 890 },
        xl: { top: 400, left: 1155 },
      },
      title: "Seat Adjustment",
      text: "Customize your ride with our fully adjustable seat that moves vertically and horizontally, ensuring optimal positioning for riders of all heights and body types.",
      src: "https://s3.us-east-1.amazonaws.com/sportstech.team/dev_assets/Frame3(4).svg",
    },
    {
      id: 3,
      frameStart: 64,
      frameEnd: 74,
      position: {
        sm: { top: 200, left: 15 },
        md: { top: 300, left: 40 },
        lg: { top: 330, left: 350 },
        xl: { top: 400, left: 520 },
      },
      title: "Auto-resistance: Your coach controls it",
      text: "The resistance adjusts automatically, or you can control it yourself.",
      src: "https://s3.us-east-1.amazonaws.com/sportstech.team/dev_assets/Frame3(1).svg",
    },
    {
      id: 4,
      frameStart: 85,
      frameEnd: 95,
      position: {
        sm: { top: 250, left: 15 },
        md: { top: 360, left: 40 },
        lg: { top: 240, left: 350 },
        xl: { top: 280, left: 455 },
      },
      title: "21.5 Display",
      text: "With the 360-degree swiveling touch display, your workouts are more flexible than ever!",
      src: "https://s3.us-east-1.amazonaws.com/sportstech.team/dev_assets/Frame3(3).svg",
    },
  ],
};

/* ==================== HELPERS ==================== */
// FIX: Improved lerp with snap threshold to prevent endless micro-adjustments
const lerp = (start: number, end: number, factor: number): number => {
  const result = start + (end - start) * factor;
  // Snap to target when very close
  if (Math.abs(end - result) < CONFIG.ANIMATION.SNAP_THRESHOLD) {
    return end;
  }
  return result;
};

type DeviceType = "sm" | "md" | "lg" | "xl";

const getDeviceType = (): DeviceType => {
  if (typeof window === "undefined") return "xl";
  const width = window.innerWidth;
  if (width < 1024) return "sm";
  if (width < 1280) return "md";
  if (width < 1600) return "lg";
  return "xl";
};

const centerModel = (model: THREE.Group, deviceType: DeviceType) => {
  const box = new THREE.Box3().setFromObject(model);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());

  const devicePosition =
    deviceType === "sm" ? CONFIG.MODEL.MOBILE_POSITION :
    deviceType === "md" ? CONFIG.MODEL.TABLET_POSITION :
    deviceType === "lg" ? CONFIG.MODEL.LAPTOP_POSITION :
    CONFIG.MODEL.DESKTOP_POSITION;

  model.position.x = devicePosition.x - center.x;
  model.position.z = devicePosition.z - center.z;
  model.position.y = devicePosition.y - size.y / 2;

  return { box, size };
};

const createImageBackground = (scene: THREE.Scene, imagePath: string, fitMode: string = "cover") => {
  const textureLoader = new THREE.TextureLoader();
  textureLoader.load(
    imagePath,
    (texture) => {
      const imageAspect = texture.image.width / texture.image.height;
      const windowAspect = window.innerWidth / window.innerHeight;
      if (fitMode === "cover") {
        if (windowAspect > imageAspect) {
          texture.repeat.set(1, imageAspect / windowAspect);
          texture.offset.set(0, (1 - imageAspect / windowAspect) / 2);
        } else {
          texture.repeat.set(windowAspect / imageAspect, 1);
          texture.offset.set((1 - windowAspect / imageAspect) / 2, 0);
        }
      }
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.needsUpdate = true;
      scene.background = texture;
    },
    undefined,
    () => { scene.background = new THREE.Color(0x1a1a2e); }
  );
};

const optimizeTexture = (texture: THREE.Texture, renderer: THREE.WebGLRenderer) => {
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = true;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
};

const optimizeMaterial = (material: THREE.Material, renderer: THREE.WebGLRenderer, isVideoMaterial = false) => {
  if (!material) return;
  const mat = material as any;
  if (!isVideoMaterial && mat.map) optimizeTexture(mat.map, renderer);
  if (mat.isMeshStandardMaterial || mat.isMeshPhysicalMaterial) {
    mat.envMapIntensity = isVideoMaterial ? 0 : 1.5;
    mat.roughness = mat.roughness ?? 0.4;
    mat.metalness = mat.metalness ?? 0.5;
  }
  mat.side = THREE.FrontSide;
  mat.needsUpdate = true;
};

const createVideoTexture = (videoPath: string): { video: HTMLVideoElement; texture: THREE.VideoTexture } | null => {
  try {
    const video = document.createElement("video");
    video.src = videoPath;
    video.crossOrigin = "anonymous";
    video.loop = true;
    video.muted = true;
    video.playsInline = true;
    video.autoplay = false;
    video.preload = "auto";

    const texture = new THREE.VideoTexture(video);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.format = THREE.RGBAFormat;
    texture.flipY = false;
    texture.needsUpdate = true;

    return { video, texture };
  } catch (err) {
    console.error("Failed to create video texture:", err);
    return null;
  }
};

/* ==================== TEXT ANNOTATION COMPONENT ==================== */
// FIX: Memoized component to prevent unnecessary re-renders
interface TextAnnotationProps {
  annotation: (typeof CONFIG.TEXT_ANNOTATIONS)[0];
  isVisible: boolean;
  deviceType: DeviceType;
}

const TextAnnotation: React.FC<TextAnnotationProps> = React.memo(({ annotation, isVisible, deviceType }) => {
  const position = annotation.position[deviceType];

  return (
    <div
      className="fixed pointer-events-none z-50"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        // FIX: Use CSS transforms for GPU-accelerated animations (no lag)
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(10px)',
        transition: 'opacity 0.2s ease-out, transform 0.2s ease-out',
        willChange: 'opacity, transform',
        pointerEvents: 'none',
      }}
    >
      <div className="rounded-xl p-3 md:p-4 lg:p-5 w-56 sm:w-64 md:w-72 lg:w-80">
        <img src={annotation.src} alt={annotation.title} className="mb-2 rounded-lg w-10" />
        <h3 className="text-sm sm:text-base md:text-lg font-bold font-mono text-gray-900 mb-2">{annotation.title}</h3>
        <p className="text-gray-700 text-xs md:text-sm font-mono leading-relaxed">{annotation.text}</p>
      </div>
    </div>
  );
});

TextAnnotation.displayName = 'TextAnnotation';

/* ==================== STORED ORIGINAL COLORS TYPE ==================== */
interface StoredMaterialColors {
  color: THREE.Color;
  emissive?: THREE.Color;
  emissiveIntensity?: number;
}

/* ==================== MAIN COMPONENT ==================== */
export default function Scroll3DCanva() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const groundRef = useRef<THREE.Mesh | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const actionRef = useRef<THREE.AnimationAction | null>(null);
  const modelRef = useRef<THREE.Group | null>(null);
  const currentDeviceTypeRef = useRef<DeviceType>("xl");
  const originalCameraPositionRef = useRef<THREE.Vector3 | null>(null);

  const wheelMeshesRef = useRef<THREE.Mesh[]>([]);
  const wheelOriginalColorsRef = useRef<Map<THREE.Material, StoredMaterialColors>>(new Map());
  const isWheelRedRef = useRef(false);

  const videosRef = useRef<{ video: HTMLVideoElement; texture: THREE.VideoTexture }[]>([]);
  const screenMeshRef = useRef<THREE.Mesh | null>(null);
  const targetFrame = useRef(0);
  const currentFrame = useRef(0);
  const scrollTriggerRef = useRef<ScrollTrigger | null>(null);
  
  // FIX: Track last visible annotations to avoid unnecessary state updates
  const lastVisibleAnnotationsRef = useRef<string>("");

  const [loading, setLoading] = useState(true);
  const [showButtons, setShowButtons] = useState(false);
  const [activeVideo, setActiveVideo] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [deviceType, setDeviceType] = useState<DeviceType>("xl");
  const [visibleAnnotations, setVisibleAnnotations] = useState<number[]>([]);

  useEffect(() => {
    const initialDeviceType = getDeviceType();
    setDeviceType(initialDeviceType);
    currentDeviceTypeRef.current = initialDeviceType;
  }, []);

  /* ==================== WHEEL COLOR CHANGE ==================== */
  const updateWheelColor = useCallback((toRed: boolean) => {
    if (wheelMeshesRef.current.length === 0) return;

    wheelMeshesRef.current.forEach((mesh) => {
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];

      materials.forEach((mat) => {
        const material = mat as THREE.MeshStandardMaterial;
        const originalColors = wheelOriginalColorsRef.current.get(mat);

        if (!originalColors) return;

        if (toRed) {
          const redColor = new THREE.Color(CONFIG.WHEEL.ACTIVE_COLOR);

          if (material.color) {
            gsap.to(material.color, {
              r: redColor.r,
              g: redColor.g,
              b: redColor.b,
              duration: CONFIG.WHEEL.TRANSITION_DURATION,
              ease: "power2.inOut",
              onUpdate: () => { material.needsUpdate = true; },
            });
          }

          if (material.emissive) {
            gsap.to(material.emissive, {
              r: redColor.r * 0.5,
              g: redColor.g * 0.5,
              b: redColor.b * 0.5,
              duration: CONFIG.WHEEL.TRANSITION_DURATION,
              ease: "power2.inOut",
            });
          }

          if (material.emissiveIntensity !== undefined) {
            gsap.to(material, {
              emissiveIntensity: 1.0,
              duration: CONFIG.WHEEL.TRANSITION_DURATION,
              ease: "power2.inOut",
            });
          }
        } else {
          if (material.color && originalColors.color) {
            gsap.to(material.color, {
              r: originalColors.color.r,
              g: originalColors.color.g,
              b: originalColors.color.b,
              duration: CONFIG.WHEEL.TRANSITION_DURATION,
              ease: "power2.inOut",
              onUpdate: () => { material.needsUpdate = true; },
            });
          }

          if (material.emissive && originalColors.emissive) {
            gsap.to(material.emissive, {
              r: originalColors.emissive.r,
              g: originalColors.emissive.g,
              b: originalColors.emissive.b,
              duration: CONFIG.WHEEL.TRANSITION_DURATION,
              ease: "power2.inOut",
            });
          }

          if (material.emissiveIntensity !== undefined && originalColors.emissiveIntensity !== undefined) {
            gsap.to(material, {
              emissiveIntensity: originalColors.emissiveIntensity,
              duration: CONFIG.WHEEL.TRANSITION_DURATION,
              ease: "power2.inOut",
            });
          }
        }
      });
    });
  }, []);

  const updateModelScaleAndPosition = useCallback(() => {
    if (!modelRef.current) return;

    const newDeviceType = getDeviceType();
    if (currentDeviceTypeRef.current !== newDeviceType) {
      currentDeviceTypeRef.current = newDeviceType;
      setDeviceType(newDeviceType);
    }

    const targetScale = CONFIG.MODEL.SCALE[newDeviceType];
    modelRef.current.scale.set(targetScale, targetScale, targetScale);
    centerModel(modelRef.current, newDeviceType);

    const finalBox = new THREE.Box3().setFromObject(modelRef.current);
    if (groundRef.current) groundRef.current.position.y = finalBox.min.y;

    const size = finalBox.getSize(new THREE.Vector3());
    const padding = Math.max(size.x, size.z) * 1.5;

    const shadowLight = sceneRef.current?.children.find(
      (c) => c instanceof THREE.DirectionalLight && c.castShadow
    ) as THREE.DirectionalLight;

    if (shadowLight?.shadow.camera instanceof THREE.OrthographicCamera) {
      const cam = shadowLight.shadow.camera;
      cam.left = -padding;
      cam.right = padding;
      cam.top = padding;
      cam.bottom = -padding;
      cam.updateProjectionMatrix();
    }

    if (cameraRef.current && originalCameraPositionRef.current) {
      let zoomMultiplier = newDeviceType === "sm" ? 5.0 : newDeviceType === "md" ? 4.0 : newDeviceType === "lg" ? 2.0 : 1.0;
      cameraRef.current.position.z = originalCameraPositionRef.current.z * zoomMultiplier;
      cameraRef.current.aspect = window.innerWidth / window.innerHeight;
      cameraRef.current.updateProjectionMatrix();
    }
  }, []);

  const initScene = useCallback(() => {
    const scene = new THREE.Scene();

    if (CONFIG.BACKGROUND.MODE === "image") {
      createImageBackground(scene, CONFIG.BACKGROUND.IMAGE.PATH, CONFIG.BACKGROUND.IMAGE.FIT);
    } else if (CONFIG.BACKGROUND.MODE === "color") {
      scene.background = new THREE.Color(CONFIG.BACKGROUND.COLOR);
    }

    const shadowLight = new THREE.DirectionalLight(0xffffff, 1.5);
    shadowLight.position.set(1, 10, 0);
    shadowLight.castShadow = true;
    shadowLight.shadow.mapSize.width = 2048;
    shadowLight.shadow.mapSize.height = 2048;
    shadowLight.shadow.camera.near = 0.5;
    shadowLight.shadow.camera.far = 50;
    shadowLight.shadow.bias = -0.0001;
    shadowLight.shadow.normalBias = 0.02;
    const d = 15;
    shadowLight.shadow.camera.left = -d;
    shadowLight.shadow.camera.right = d;
    shadowLight.shadow.camera.top = d;
    shadowLight.shadow.camera.bottom = -d;
    scene.add(shadowLight);

    scene.add(new THREE.AmbientLight(0xffffff, 0.8));

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(100, 100),
      new THREE.ShadowMaterial({ opacity: 0.4 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -100;
    ground.receiveShadow = true;
    groundRef.current = ground;
    scene.add(ground);

    sceneRef.current = scene;
  }, []);

  const initRenderer = useCallback(() => {
    if (!canvasRef.current) return;

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
    });

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, CONFIG.RENDERER.MAX_PIXEL_RATIO));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = CONFIG.RENDERER.TONE_MAPPING_EXPOSURE;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    rendererRef.current = renderer;
  }, []);

  const loadEnvironment = useCallback(() => {
    if (!sceneRef.current || !rendererRef.current) return;

    const pmremGenerator = new THREE.PMREMGenerator(rendererRef.current);
    pmremGenerator.compileEquirectangularShader();

    new RGBELoader().load(
      CONFIG.HDR.PATH,
      (hdr) => {
        const envMap = pmremGenerator.fromEquirectangular(hdr).texture;
        sceneRef.current!.environment = envMap;
        if (CONFIG.BACKGROUND.MODE === "hdr") sceneRef.current!.background = envMap;
        hdr.dispose();
        pmremGenerator.dispose();
      },
      undefined,
      (error) => console.warn("HDR loading failed:", error)
    );
  }, []);

  const applyVideoToScreen = useCallback((videoIndex: number) => {
    const videoData = videosRef.current[videoIndex - 1];
    const screenMesh = screenMeshRef.current;
    if (!videoData || !screenMesh) return;

    videosRef.current.forEach((v, idx) => {
      if (idx !== videoIndex - 1) {
        v.video.pause();
        v.video.currentTime = 0;
      }
    });

    screenMesh.material = new THREE.MeshStandardMaterial({
      map: videoData.texture,
      emissive: new THREE.Color(0xffffff),
      emissiveMap: videoData.texture,
      emissiveIntensity: 1.0,
      roughness: 0.5,
      metalness: 0.0,
    });

    const playVideo = () => {
      videoData.video.play().catch(() => {
        videoData.video.muted = true;
        videoData.video.play().catch(console.error);
      });
    };

    if (videoData.video.readyState >= 3) playVideo();
    else videoData.video.addEventListener("canplay", playVideo, { once: true });
  }, []);

  const setupVideos = useCallback((model: THREE.Group) => {
    CONFIG.VIDEOS.forEach((vc) => {
      const vd = createVideoTexture(vc.path);
      if (vd) { videosRef.current.push(vd); vd.video.load(); }
    });

    model.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        if (
          child.name.toLowerCase().includes(CONFIG.SCREEN.MESH_NAME.toLowerCase()) ||
          (mesh.material as any)?.name?.toLowerCase().includes(CONFIG.SCREEN.MATERIAL_NAME.toLowerCase())
        ) {
          screenMeshRef.current = mesh;
        }
      }
    });

    if (screenMeshRef.current && videosRef.current.length > 0) applyVideoToScreen(1);
  }, [applyVideoToScreen]);

  const setupWheelMeshes = useCallback((model: THREE.Group) => {
    const wheelMeshes: THREE.Mesh[] = [];

    model.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const meshNameLower = mesh.name.toLowerCase();

        const isWheelMesh = CONFIG.WHEEL.MESH_NAMES.some((name) =>
          meshNameLower.includes(name.toLowerCase())
        );

        if (isWheelMesh) {
          wheelMeshes.push(mesh);

          const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          materials.forEach((mat) => {
            const material = mat as THREE.MeshStandardMaterial;
            const stored: StoredMaterialColors = {
              color: material.color ? material.color.clone() : new THREE.Color(0xffffff),
              emissive: material.emissive ? material.emissive.clone() : undefined,
              emissiveIntensity: material.emissiveIntensity,
            };
            wheelOriginalColorsRef.current.set(mat, stored);
          });
        }
      }
    });

    wheelMeshesRef.current = wheelMeshes;
  }, []);

  const loadModel = useCallback(() => {
    if (!sceneRef.current || !rendererRef.current) return;

    const loader = new GLTFLoader();

    loader.load(
      CONFIG.MODEL.PATH,
      (gltf) => {
        const model = gltf.scene;
        modelRef.current = model;

        if (gltf.cameras?.length > 0) {
          const glbCamera = gltf.cameras[0];
          if (glbCamera instanceof THREE.PerspectiveCamera) {
            const currentDT = getDeviceType();
            currentDeviceTypeRef.current = currentDT;
            setDeviceType(currentDT);
            originalCameraPositionRef.current = glbCamera.position.clone();

            let targetFOV = currentDT === "sm" ? 70 : currentDT === "md" ? 60 : currentDT === "lg" ? 50 : Math.min(glbCamera.fov, 75);
            glbCamera.fov = targetFOV;
            glbCamera.aspect = window.innerWidth / window.innerHeight;
            glbCamera.near = 0.1;
            glbCamera.far = 1000;

            let zoomMult = currentDT === "sm" ? 2.0 : currentDT === "md" ? 1.8 : currentDT === "lg" ? 1.3 : 1.0;
            glbCamera.position.z = originalCameraPositionRef.current.z * zoomMult;
            glbCamera.updateProjectionMatrix();
            cameraRef.current = glbCamera;
          }
        }

        model.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            const isVideoScreen = child.name.toLowerCase().includes(CONFIG.SCREEN.MESH_NAME.toLowerCase());
            if (Array.isArray(mesh.material)) {
              mesh.material.forEach((mat) => optimizeMaterial(mat, rendererRef.current!, isVideoScreen));
            } else if (mesh.material) {
              optimizeMaterial(mesh.material, rendererRef.current!, isVideoScreen);
            }
          }
        });

        const currentDT = getDeviceType();
        const targetScale = CONFIG.MODEL.SCALE[currentDT];
        model.scale.set(targetScale, targetScale, targetScale);
        centerModel(model, currentDT);

        const actualBox = new THREE.Box3().setFromObject(model);
        if (groundRef.current) groundRef.current.position.y = actualBox.min.y;

        sceneRef.current!.add(model);

        setupVideos(model);
        setupWheelMeshes(model);

        if (gltf.animations.length > 0) {
          const mixer = new THREE.AnimationMixer(model);
          const action = mixer.clipAction(gltf.animations[0]);
          action.play();
          action.paused = true;
          mixerRef.current = mixer;
          actionRef.current = action;
        }

        setLoading(false);
      },
      undefined,
      (error) => {
        console.error("Error loading model:", error);
        setError("Failed to load 3D model.");
        setLoading(false);
      }
    );
  }, [setupVideos, setupWheelMeshes]);

  // FIX: Optimized scroll trigger - directly update annotations based on TARGET frame (no lag)
  useEffect(() => {
    if (loading) return;

    scrollTriggerRef.current?.kill();

    scrollTriggerRef.current = ScrollTrigger.create({
      trigger: document.body,
      start: "top top",
      end: `+=${window.innerHeight * CONFIG.ANIMATION.SCROLL_MULTIPLIER}`,
      scrub: CONFIG.ANIMATION.SCRUB,
      onUpdate: (self) => {
        targetFrame.current = self.progress * CONFIG.TOTAL_FRAMES;
        
        // FIX: Calculate visible annotations based on TARGET frame (immediate response)
        // instead of currentFrame (which has LERP lag)
        const newVisibleAnnotations: number[] = [];
        CONFIG.TEXT_ANNOTATIONS.forEach((annotation) => {
          if (targetFrame.current >= annotation.frameStart && targetFrame.current <= annotation.frameEnd) {
            newVisibleAnnotations.push(annotation.id);
          }
        });
        
        // FIX: Only update state if annotations actually changed (use simple string comparison)
        const newKey = newVisibleAnnotations.join(',');
        if (lastVisibleAnnotationsRef.current !== newKey) {
          lastVisibleAnnotationsRef.current = newKey;
          setVisibleAnnotations(newVisibleAnnotations);
        }
        
        // Handle button visibility
        const scrollPercent = self.progress * 100;
        if (scrollPercent >= CONFIG.ANIMATION_COMPLETE_THRESHOLD && !showButtons) {
          setShowButtons(true);
        } else if (scrollPercent < CONFIG.ANIMATION_COMPLETE_THRESHOLD && showButtons) {
          setShowButtons(false);
        }
      },
    });

    return () => { scrollTriggerRef.current?.kill(); };
  }, [loading, showButtons]);

  /* ==================== ANIMATION LOOP ==================== */
  useEffect(() => {
    let animationFrameId: number;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return;

      // Lerp current frame toward target (for smooth 3D animation only)
      currentFrame.current = lerp(currentFrame.current, targetFrame.current, CONFIG.ANIMATION.LERP_FACTOR);

      // FIX: Wheel color changes now use CURRENT frame (smooth transition with 3D model)
      let shouldWheelBeRed = false;
      CONFIG.TEXT_ANNOTATIONS.forEach((annotation) => {
        if (currentFrame.current >= annotation.frameStart && currentFrame.current <= annotation.frameEnd) {
          if ((annotation as any).triggerWheelColorChange) {
            shouldWheelBeRed = true;
          }
        }
      });

      if (shouldWheelBeRed && !isWheelRedRef.current) {
        updateWheelColor(true);
        isWheelRedRef.current = true;
      } else if (!shouldWheelBeRed && isWheelRedRef.current) {
        updateWheelColor(false);
        isWheelRedRef.current = false;
      }

      // Update 3D animation
      if (mixerRef.current && actionRef.current) {
        const clip = actionRef.current.getClip();
        actionRef.current.time = (currentFrame.current / CONFIG.TOTAL_FRAMES) * clip.duration;
        mixerRef.current.update(0);
      }

      // Update video texture
      const activeVideoData = videosRef.current[activeVideo - 1];
      if (activeVideoData) activeVideoData.texture.needsUpdate = true;

      rendererRef.current.render(sceneRef.current, cameraRef.current);
    };

    animate();
    return () => cancelAnimationFrame(animationFrameId);
  }, [activeVideo, updateWheelColor]);

  useEffect(() => {
    initScene();
    initRenderer();
    loadEnvironment();
    loadModel();

    const onResize = () => {
      if (!rendererRef.current || !cameraRef.current) return;

      const newDT = getDeviceType();
      if (currentDeviceTypeRef.current !== newDT) {
        currentDeviceTypeRef.current = newDT;
        setDeviceType(newDT);
        if (cameraRef.current instanceof THREE.PerspectiveCamera) {
          cameraRef.current.fov = newDT === "sm" ? 70 : newDT === "md" ? 60 : newDT === "lg" ? 50 : 75;
        }
        updateModelScaleAndPosition();
        ScrollTrigger.refresh();
      }

      cameraRef.current.aspect = window.innerWidth / window.innerHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      
      videosRef.current.forEach((v) => { 
        v.video.pause(); 
        v.video.src = ""; 
        v.texture.dispose();
      });
      videosRef.current = [];
      
      ScrollTrigger.getAll().forEach((t) => t.kill());
      
      if (sceneRef.current) {
        sceneRef.current.traverse((object) => {
          if ((object as THREE.Mesh).isMesh) {
            const mesh = object as THREE.Mesh;
            mesh.geometry?.dispose();
            if (Array.isArray(mesh.material)) {
              mesh.material.forEach((mat) => mat.dispose());
            } else if (mesh.material) {
              mesh.material.dispose();
            }
          }
        });
        sceneRef.current.clear();
      }
      
      if (rendererRef.current) {
        rendererRef.current.dispose();
        rendererRef.current.forceContextLoss();
        rendererRef.current = null;
      }
      
      modelRef.current = null;
      mixerRef.current = null;
      actionRef.current = null;
      wheelMeshesRef.current = [];
      wheelOriginalColorsRef.current.clear();
    };
  }, [initScene, initRenderer, loadEnvironment, loadModel, updateModelScaleAndPosition]);

  const switchVideo = (videoIndex: number) => {
    setActiveVideo(videoIndex);
    applyVideoToScreen(videoIndex);
  };

  // FIX: Memoize annotations to prevent unnecessary re-renders
  const annotationElements = useMemo(() => (
    CONFIG.TEXT_ANNOTATIONS.map((annotation) => (
      <TextAnnotation
        key={annotation.id}
        annotation={annotation}
        isVisible={visibleAnnotations.includes(annotation.id)}
        deviceType={deviceType}
      />
    ))
  ), [visibleAnnotations, deviceType]);

  return (
    <div className="relative h-[1150vh]">
      <div className="fixed inset-0 w-full h-full">
        <canvas ref={canvasRef} className="w-full h-full" />
      </div>

      {annotationElements}

      {loading && !error && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/80">
          <div className="text-white text-xl">Loading 3D Model</div>
        </div>
      )}

      {error && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/80">
          <div className="text-red-500 text-xl max-w-md text-center p-4">{error}</div>
        </div>
      )}

      {showButtons && !loading && !error && (
        <div className="fixed top-4 md:top-5 left-0 right-0 z-[9999] px-2 md:px-0 pointer-events-none">
          <div className="max-w-7xl mx-auto flex justify-center pointer-events-auto">
            <div className="bg-white rounded-full p-1 shadow-lg inline-flex items-center gap-1">
              {CONFIG.VIDEOS.map((video) => (
                <button
                  key={video.id}
                  onClick={() => switchVideo(video.id)}
                  className={`px-5 md:px-6 py-2 md:py-2.5 rounded-full font-medium text-sm md:text-base transition-all duration-300 ease-out ${
                    activeVideo === video.id
                      ? "bg-red-600 text-white shadow-md"
                      : "bg-transparent text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <span className="whitespace-nowrap">{video.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}