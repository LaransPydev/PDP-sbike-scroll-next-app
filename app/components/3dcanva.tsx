"use client";

import { useEffect, useRef, useState, useCallback } from "react";
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
    PATH: "https://s3.us-east-1.amazonaws.com/sportstech.team/dev_assets/Sbike-28.glb",
    POSITION_Y_OFFSET: -1,
    SCALE: {
      sm: 0.04, // Mobile (< 1024px)
      md: 0.06, // 1024px - 1279px
      lg: 0.4, // 1280px - 1599px
      xl: 1.0, // 1600px - 1920px+
    },
    MOBILE_POSITION: {
      y: -1.5,
      x: 0,
      z: 0,
    },
    TABLET_POSITION: {
      y: -1.8,
      x: 0,
      z: 0,
    },
    LAPTOP_POSITION: {
      y: -1.0,
      x: 0,
      z: 0,
    },
    DESKTOP_POSITION: {
      y: 1,
      x: 0,
      z: 0,
    },
  },
  HDR: {
    PATH: "https://360-product-view.s3.eu-north-1.amazonaws.com/Product-360-View/models/hdr/lightroom-4.hdr",
  },
  VIDEOS: [
    {
      id: 1,
      name: "Workout",
      path: "https://s3.us-east-1.amazonaws.com/sportstech.team/dev_assets/sBike-Trainer.mp4",
      description: "First Display",
    },
    {
      id: 2,
      name: "Landscape video",
      path: "https://s3.us-east-1.amazonaws.com/sportstech.team/dev_assets/sBike-Landscape.mp4",
      description: "Second Display",
    },
    {
      id: 3,
      name: "Gaming",
      path: "https://s3.us-east-1.amazonaws.com/sportstech.team/dev_assets/sBike-Gaming.mp4",
      description: "Third Display",
    },
  ],
  SCREEN: {
    MESH_NAME: "Screen",
    MATERIAL_NAME: "screen",
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
    sm: {
      fov: 50,
      position: { x: 0, y: 0, z: 8 },
    },
    md: {
      fov: 50,
      position: { x: 0, y: 0, z: 7 },
    },
    lg: {
      fov: 60,
      position: { x: 0, y: 0, z: 6 },
    },
    xl: {
      fov: 1000,
      position: { x: 1, y: 0, z: 5 },
    },
  },
  ANIMATION_COMPLETE_THRESHOLD: 100,
  ANIMATION: {
    LERP_FACTOR: 0.25,
    SCRUB: 0.1,
    SCROLL_MULTIPLIER: 10,
    USE_EASING: true,
  },
  // Text annotations configuration with responsive positions
  // Device breakpoints: Mobile (< 1024px), md (1024-1279px), lg (1280-1599px), xl (1600-1920px+)
  TEXT_ANNOTATIONS: [
    {
      id: 1,
      frameStart: 20,
      frameEnd: 30,
      position: {
        sm: { top: 100, left: 15 }, // Mobile (< 1024px)
        md: { top: 180, left: 40 }, // 1024px - 1279px
        lg: { top: 350, left: 800 }, // 1280px - 1599px
        xl: { top: 450, left: 1000 }, // 1600px - 1920px+
      },
      title: "LED lights",
      text: "The LED lights adapt to your performance and give you motivating feedback.",
      src: "https://s3.us-east-1.amazonaws.com/sportstech.team/dev_assets/Frame3.svg",
    },
    {
      id: 2,
      frameStart: 40,
      frameEnd: 50,
      position: {
        sm: { top: 150, left: 15 }, // Mobile (< 1024px)
        md: { top: 240, left: 40 }, // 1024px - 1279px
        lg: { top: 320, left: 890 }, // 1280px - 1599px
        xl: { top: 400, left: 1155 }, // 1600px - 1920px+
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
        sm: { top: 200, left: 15 }, // Mobile (< 1024px)
        md: { top: 300, left: 40 }, // 1024px - 1279px
        lg: { top: 330, left: 350 }, // 1280px - 1599px
        xl: { top: 400, left: 520 }, // 1600px - 1920px+
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
        sm: { top: 250, left: 15 }, // Mobile (< 1024px)
        md: { top: 360, left: 40 }, // 1024px - 1279px
        lg: { top: 240, left: 350 }, // 1280px - 1599px
        xl: { top: 280, left: 455 }, // 1600px - 1920px+
      },
      title: "21.5 Display",
      text: "With the 360-degree swiveling touch display, your workouts are more flexible than ever!",
      src: "https://s3.us-east-1.amazonaws.com/sportstech.team/dev_assets/Frame3(3).svg",
    },
  ],
};

/* ==================== SMOOTH INTERPOLATION HELPERS ==================== */
const lerp = (start: number, end: number, factor: number): number => {
  return start + (end - start) * factor;
};

const smoothStep = (x: number): number => {
  return x * x * (3 - 2 * x);
};

/* ==================== HELPERS ==================== */
type DeviceType = "sm" | "md" | "lg" | "xl";

const getDeviceType = (): DeviceType => {
  if (typeof window === "undefined") return "xl";
  const width = window.innerWidth;

  if (width < 1024) return "sm"; // Mobile (< 1024px)
  if (width < 1280) return "md"; // 1024px - 1279px
  if (width < 1600) return "lg"; // 1280px - 1599px
  return "xl"; // 1600px - 1920px and beyond
};

const centerModel = (model: THREE.Group, deviceType: DeviceType) => {
  const box = new THREE.Box3().setFromObject(model);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());

  const devicePosition =
    deviceType === "sm"
      ? CONFIG.MODEL.MOBILE_POSITION
      : deviceType === "md"
        ? CONFIG.MODEL.TABLET_POSITION
        : deviceType === "lg"
          ? CONFIG.MODEL.LAPTOP_POSITION
          : CONFIG.MODEL.DESKTOP_POSITION;

  model.position.x = devicePosition.x - center.x;
  model.position.z = devicePosition.z - center.z;
  model.position.y = devicePosition.y - size.y / 2;

  console.log(
    `📦 Model positioned at: (${model.position.x.toFixed(2)}, ${model.position.y.toFixed(2)}, ${model.position.z.toFixed(2)})`,
  );
  console.log(
    `📏 Model size: (${size.x.toFixed(2)}, ${size.y.toFixed(2)}, ${size.z.toFixed(2)})`,
  );

  return { box, size };
};

/* ==================== CREATE IMAGE BACKGROUND ==================== */
const createImageBackground = (
  scene: THREE.Scene,
  imagePath: string,
  fitMode: string = "cover",
) => {
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
      console.log(`✅ Image background applied: ${imagePath}`);
    },
    undefined,
    (error) => {
      console.error("Failed to load background image:", error);
      scene.background = new THREE.Color(0x1a1a2e);
    },
  );
};

/* ==================== OPTIMIZE TEXTURES ==================== */
const optimizeTexture = (
  texture: THREE.Texture,
  renderer: THREE.WebGLRenderer,
) => {
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = true;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
};

/* ==================== OPTIMIZE MATERIAL ==================== */
const optimizeMaterial = (
  material: THREE.Material,
  renderer: THREE.WebGLRenderer,
  isVideoMaterial = false,
) => {
  if (!material) return;

  const mat = material as any;

  if (!isVideoMaterial && mat.map) {
    optimizeTexture(mat.map, renderer);
  }

  if (mat.isMeshStandardMaterial || mat.isMeshPhysicalMaterial) {
    mat.envMapIntensity = isVideoMaterial ? 0 : 1.5;
    mat.roughness = mat.roughness ?? 0.4;
    mat.metalness = mat.metalness ?? 0.5;
  }

  mat.side = THREE.FrontSide;
  mat.needsUpdate = true;
};

/* ==================== CREATE VIDEO TEXTURE ==================== */
const createVideoTexture = (
  videoPath: string,
): { video: HTMLVideoElement; texture: THREE.VideoTexture } | null => {
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

    console.log(`✅ Video texture created for: ${videoPath}`);
    return { video, texture };
  } catch (err) {
    console.error("Failed to create video texture:", err);
    return null;
  }
};

/* ==================== TEXT ANNOTATION COMPONENT ==================== */
interface TextAnnotationProps {
  annotation: (typeof CONFIG.TEXT_ANNOTATIONS)[0];
  isVisible: boolean;
  deviceType: DeviceType;
}

const TextAnnotation: React.FC<TextAnnotationProps> = ({
  annotation,
  isVisible,
  deviceType,
}) => {
  if (!isVisible) return null;

  // Get position based on device type
  const position = annotation.position[deviceType];

  // Debug logging
  useEffect(() => {
    if (isVisible) {
      console.log(
        `📍 Annotation ${annotation.id} - Device: ${deviceType}, Position:`,
        position,
      );
    }
  }, [isVisible, deviceType, annotation.id, position]);

  return (
    <div
      className="fixed pointer-events-none z-50 transition-all duration-500"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
    >
      <div className="rounded-xl p-3 md:p-4 lg:p-5 w-56 sm:w-64 md:w-72 lg:w-80 ">
        <img
          src={annotation.src}
          alt={annotation.title}
          className="mb-2 rounded-lg w-10"
        />
        <h3 className="text-sm sm:text-base md:text-lg font-bold font-mono text-gray-900 mb-2">
          {annotation.title}
        </h3>
        <p className="text-gray-700 text-xs md:text-sm font-mono leading-relaxed">
          {annotation.text}
        </p>
      </div>
    </div>
  );
};

/* ==================== COMPONENT ==================== */
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
  const glbCameraRef = useRef<THREE.Camera | null>(null);
  const originalCameraPositionRef = useRef<THREE.Vector3 | null>(null);

  const videosRef = useRef<
    {
      video: HTMLVideoElement;
      texture: THREE.VideoTexture;
    }[]
  >([]);

  const screenMeshRef = useRef<THREE.Mesh | null>(null);

  const targetFrame = useRef(0);
  const currentFrame = useRef(0);
  const scrollTriggerRef = useRef<ScrollTrigger | null>(null);

  // NEW: Ref to store pending annotation updates
  const pendingAnnotationsRef = useRef<number[] | null>(null);

  const [loading, setLoading] = useState(true);
  const [showButtons, setShowButtons] = useState(false);
  const [activeVideo, setActiveVideo] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState({
    device: "",
    scale: 0,
    width: 0,
  });
  const [deviceType, setDeviceType] = useState<DeviceType>("xl");

  // State for tracking which annotations are visible
  const [visibleAnnotations, setVisibleAnnotations] = useState<number[]>([]);

  /* ==================== UPDATE DEVICE TYPE ON MOUNT ==================== */
  useEffect(() => {
    const initialDeviceType = getDeviceType();
    setDeviceType(initialDeviceType);
    currentDeviceTypeRef.current = initialDeviceType;
    console.log(`📱 Initial device type set to: ${initialDeviceType}`);
  }, []);

  /* ==================== UPDATE MODEL SCALE & POSITION ==================== */
  const updateModelScaleAndPosition = useCallback(() => {
    if (!modelRef.current) return;

    const newDeviceType = getDeviceType();
    const deviceTypeChanged = currentDeviceTypeRef.current !== newDeviceType;

    if (deviceTypeChanged) {
      currentDeviceTypeRef.current = newDeviceType;
      setDeviceType(newDeviceType);
      console.log(`📱 Device changed to: ${newDeviceType}`);
    }

    const targetScale = CONFIG.MODEL.SCALE[newDeviceType];
    console.log(`🔧 Applying scale ${targetScale} for ${newDeviceType}`);
    modelRef.current.scale.set(targetScale, targetScale, targetScale);
    console.log(
      `✅ Model scale set to: (${modelRef.current.scale.x}, ${modelRef.current.scale.y}, ${modelRef.current.scale.z})`,
    );

    setDebugInfo({
      device: newDeviceType,
      scale: targetScale,
      width: window.innerWidth,
    });

    centerModel(modelRef.current, newDeviceType);

    // Recalculate box for ground positioning after resize
    const finalBox = new THREE.Box3().setFromObject(modelRef.current);
    if (groundRef.current) {
      groundRef.current.position.y = finalBox.min.y;
    }

    // Update shadow camera bounds dynamically
    const size = finalBox.getSize(new THREE.Vector3());
    const padding = Math.max(size.x, size.z) * 1.5;

    const shadowLight = sceneRef.current?.children.find(
      (c) => c instanceof THREE.DirectionalLight && c.castShadow,
    ) as THREE.DirectionalLight;

    if (shadowLight && shadowLight.shadow.camera) {
      const cam = shadowLight.shadow.camera;
      if (cam instanceof THREE.OrthographicCamera) {
        cam.left = -padding;
        cam.right = padding;
        cam.top = padding;
        cam.bottom = -padding;
        cam.updateProjectionMatrix();
      }
    }

    if (cameraRef.current && originalCameraPositionRef.current) {
      const originalPos = originalCameraPositionRef.current;
      let zoomMultiplier = 1.0;

      if (newDeviceType === "sm") {
        zoomMultiplier = 5.0; // Mobile
      } else if (newDeviceType === "md") {
        zoomMultiplier = 4.0; // Tablet
      } else if (newDeviceType === "lg") {
        zoomMultiplier = 2.0; // Laptop
      }

      cameraRef.current.position.z = originalPos.z * zoomMultiplier;
      console.log(
        `📷 Camera Z adjusted: ${originalPos.z} → ${cameraRef.current.position.z} (${zoomMultiplier}x)`,
      );

      cameraRef.current.aspect = window.innerWidth / window.innerHeight;
      cameraRef.current.updateProjectionMatrix();

      console.log(`📷 Camera aspect updated for device: ${newDeviceType}`);
    }
  }, []);

  /* ==================== SCENE SETUP ==================== */
  const initScene = useCallback(() => {
    const scene = new THREE.Scene();

    if (CONFIG.BACKGROUND.MODE === "image") {
      createImageBackground(
        scene,
        CONFIG.BACKGROUND.IMAGE.PATH,
        CONFIG.BACKGROUND.IMAGE.FIT,
      );
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

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const groundGeometry = new THREE.PlaneGeometry(100, 100);
    const groundMaterial = new THREE.ShadowMaterial({
      opacity: 0.4,
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -100;
    ground.receiveShadow = true;

    groundRef.current = ground;
    scene.add(ground);

    sceneRef.current = scene;
    console.log("✅ Scene initialized");
  }, []);

  /* ==================== RENDERER ==================== */
  const initRenderer = useCallback(() => {
    if (!canvasRef.current) return;

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
    });

    const pixelRatio = Math.min(
      window.devicePixelRatio,
      CONFIG.RENDERER.MAX_PIXEL_RATIO,
    );
    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = CONFIG.RENDERER.TONE_MAPPING_EXPOSURE;

    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    rendererRef.current = renderer;
    console.log("✅ Renderer initialized");
  }, []);

  /* ==================== LOAD ENV ==================== */
  const loadEnvironment = useCallback(() => {
    if (!sceneRef.current || !rendererRef.current) return;

    const pmremGenerator = new THREE.PMREMGenerator(rendererRef.current);
    pmremGenerator.compileEquirectangularShader();

    new RGBELoader().load(
      CONFIG.HDR.PATH,
      (hdr) => {
        const envMap = pmremGenerator.fromEquirectangular(hdr).texture;
        sceneRef.current!.environment = envMap;

        if (CONFIG.BACKGROUND.MODE === "hdr") {
          sceneRef.current!.background = envMap;
        }

        hdr.dispose();
        pmremGenerator.dispose();
        console.log("✅ Environment loaded");
      },
      undefined,
      (error) => {
        console.warn("HDR loading failed (non-critical):", error);
      },
    );
  }, []);

  /* ==================== SETUP ALL VIDEOS ==================== */
  const setupVideos = useCallback((model: THREE.Group) => {
    const videoTextures: {
      video: HTMLVideoElement;
      texture: THREE.VideoTexture;
    }[] = [];

    CONFIG.VIDEOS.forEach((videoConfig) => {
      const videoData = createVideoTexture(videoConfig.path);
      if (videoData) {
        videoTextures.push(videoData);
        videoData.video.load();
      }
    });

    videosRef.current = videoTextures;

    let screenFound = false;

    model.traverse((child) => {
      if (
        !screenFound &&
        (child.name
          .toLowerCase()
          .includes(CONFIG.SCREEN.MESH_NAME.toLowerCase()) ||
          ((child as THREE.Mesh).material as any)?.name
            ?.toLowerCase()
            .includes(CONFIG.SCREEN.MATERIAL_NAME.toLowerCase()))
      ) {
        if ((child as THREE.Mesh).isMesh) {
          screenMeshRef.current = child as THREE.Mesh;
          screenFound = true;
          console.log(`🎬 Found screen mesh: ${child.name}`);
        }
      }
    });

    if (!screenFound) {
      console.warn("⚠️ Screen mesh not found. Listing all meshes:");
      model.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          console.log(`  Mesh: "${child.name}"`);
        }
      });
    }

    if (screenFound && videoTextures.length > 0) {
      applyVideoToScreen(1);
    }
  }, []);

  /* ==================== APPLY VIDEO TO SCREEN ==================== */
  const applyVideoToScreen = useCallback((videoIndex: number) => {
    const videoData = videosRef.current[videoIndex - 1];
    const screenMesh = screenMeshRef.current;

    if (!videoData || !screenMesh) {
      console.error("Video or screen mesh not found");
      return;
    }

    videosRef.current.forEach((v, idx) => {
      if (idx !== videoIndex - 1) {
        v.video.pause();
        v.video.currentTime = 0;
      }
    });

    const videoMaterial = new THREE.MeshStandardMaterial({
      map: videoData.texture,
      emissive: new THREE.Color(0xffffff),
      emissiveMap: videoData.texture,
      emissiveIntensity: 1.0,
      roughness: 0.5,
      metalness: 0.0,
    });

    screenMesh.material = videoMaterial;

    const playVideo = () => {
      const playPromise = videoData.video.play();

      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log(`✅ Video ${videoIndex} playing successfully`);
          })
          .catch((err) => {
            console.warn(`Video ${videoIndex} autoplay failed:`, err);
            videoData.video.muted = true;
            videoData.video.play().catch((e) => {
              console.error("Video play failed even when muted:", e);
            });
          });
      }
    };

    if (videoData.video.readyState >= 3) {
      playVideo();
    } else {
      videoData.video.addEventListener("canplay", playVideo, { once: true });
      videoData.video.load();
    }

    console.log(`✅ Switched to Video ${videoIndex}`);
  }, []);

  /* ==================== SWITCH VIDEO ==================== */
  const switchVideo = (videoIndex: number) => {
    setActiveVideo(videoIndex);
    applyVideoToScreen(videoIndex);
  };

  /* ==================== LOAD MODEL ==================== */
  const loadModel = useCallback(() => {
    if (!sceneRef.current || !rendererRef.current) return;

    const loader = new GLTFLoader();

    console.log("🔄 Loading model from:", CONFIG.MODEL.PATH);

    loader.load(
      CONFIG.MODEL.PATH,
      (gltf) => {
        const model = gltf.scene;
        modelRef.current = model;

        console.log("✅ Model loaded successfully");
        console.log("📦 Model has animations:", gltf.animations.length);
        console.log("📷 Model has cameras:", gltf.cameras.length);

        if (gltf.cameras && gltf.cameras.length > 0) {
          console.log("🎥 Detecting GLB cameras...");

          gltf.cameras.forEach((cam, index) => {
            console.log(`  Camera ${index}:`, cam.name, cam.type);
            if (cam instanceof THREE.PerspectiveCamera) {
              console.log(`    - FOV: ${cam.fov}`);
              console.log(
                `    - Position: (${cam.position.x}, ${cam.position.y}, ${cam.position.z})`,
              );
              console.log(
                `    - Rotation: (${cam.rotation.x}, ${cam.rotation.y}, ${cam.rotation.z})`,
              );
            }
          });

          const glbCamera = gltf.cameras[0];

          if (glbCamera instanceof THREE.PerspectiveCamera) {
            glbCameraRef.current = glbCamera;

            const currentDeviceType = getDeviceType();
            currentDeviceTypeRef.current = currentDeviceType;
            setDeviceType(currentDeviceType);

            originalCameraPositionRef.current = glbCamera.position.clone();

            let targetFOV = glbCamera.fov;
            if (currentDeviceType === "sm") {
              targetFOV = 70; // Mobile
            } else if (currentDeviceType === "md") {
              targetFOV = 60; // Tablet
            } else if (currentDeviceType === "lg") {
              targetFOV = 50; // Laptop
            } else {
              targetFOV = Math.min(glbCamera.fov, 75); // Desktop
            }

            glbCamera.fov = targetFOV;
            console.log(
              `📷 FOV overridden: ${glbCamera.fov} → ${targetFOV} for ${currentDeviceType}`,
            );

            glbCamera.aspect = window.innerWidth / window.innerHeight;
            glbCamera.near = 0.1;
            glbCamera.far = 1000;

            let zoomMultiplier = 1.0;
            if (currentDeviceType === "sm") {
              zoomMultiplier = 2.0; // Mobile
            } else if (currentDeviceType === "md") {
              zoomMultiplier = 1.8; // Tablet
            } else if (currentDeviceType === "lg") {
              zoomMultiplier = 1.3; // Laptop
            }
            glbCamera.position.z =
              originalCameraPositionRef.current.z * zoomMultiplier;

            glbCamera.updateProjectionMatrix();

            cameraRef.current = glbCamera;
            console.log(
              "✅ Using GLB Camera (FOV and position adjusted for device)",
            );
            console.log(`   Adjusted FOV: ${targetFOV}`);
            console.log(
              `   Original Position: (${originalCameraPositionRef.current.x}, ${originalCameraPositionRef.current.y}, ${originalCameraPositionRef.current.z})`,
            );
            console.log(
              `   Adjusted Position: (${glbCamera.position.x}, ${glbCamera.position.y}, ${glbCamera.position.z})`,
            );
            console.log(
              `   Zoom Multiplier: ${zoomMultiplier}x for ${currentDeviceType}`,
            );
          } else {
            console.warn(
              "⚠️ GLB camera is not PerspectiveCamera, using fallback",
            );
            const fallbackDeviceType = getDeviceType();
            currentDeviceTypeRef.current = fallbackDeviceType;
            setDeviceType(fallbackDeviceType);
          }
        } else {
          console.warn("⚠️ No GLB camera found, using fallback");
          const fallbackDeviceType = getDeviceType();
          currentDeviceTypeRef.current = fallbackDeviceType;
          setDeviceType(fallbackDeviceType);
        }

        console.log("🎨 Optimizing model materials...");
        model.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;

            mesh.castShadow = true;
            mesh.receiveShadow = true;

            const isVideoScreen =
              child.name
                .toLowerCase()
                .includes(CONFIG.SCREEN.MESH_NAME.toLowerCase()) ||
              (mesh.material as any)?.name
                ?.toLowerCase()
                .includes(CONFIG.SCREEN.MATERIAL_NAME.toLowerCase());

            if (Array.isArray(mesh.material)) {
              mesh.material.forEach((mat) =>
                optimizeMaterial(mat, rendererRef.current!, isVideoScreen),
              );
            } else if (mesh.material) {
              optimizeMaterial(
                mesh.material,
                rendererRef.current!,
                isVideoScreen,
              );
            }
          }
        });

        const currentDeviceType = getDeviceType();
        const targetScale = CONFIG.MODEL.SCALE[currentDeviceType];
        console.log(`🎯 Initial device type: ${currentDeviceType}`);
        console.log(`🎯 Target scale for ${currentDeviceType}: ${targetScale}`);
        console.log(`🎯 Available scales:`, CONFIG.MODEL.SCALE);
        console.log(`🎯 Window width: ${window.innerWidth}px`);
        model.scale.set(targetScale, targetScale, targetScale);
        console.log(
          `✅ Model scale applied: (${model.scale.x}, ${model.scale.y}, ${model.scale.z})`,
        );

        setDebugInfo({
          device: currentDeviceType,
          scale: targetScale,
          width: window.innerWidth,
        });

        centerModel(model, currentDeviceType);

        const actualBox = new THREE.Box3().setFromObject(model);
        const actualSize = actualBox.getSize(new THREE.Vector3());

        if (groundRef.current) {
          groundRef.current.position.y = actualBox.min.y;
          console.log(
            `🌍 Ground snapped exactly to model min Y: ${actualBox.min.y.toFixed(3)}`,
          );
        }

        const shadowLight = sceneRef.current?.children.find(
          (c) => c instanceof THREE.DirectionalLight && c.castShadow,
        ) as THREE.DirectionalLight;

        if (shadowLight) {
          const padding = Math.max(actualSize.x, actualSize.z) * 1.5;
          const cam = shadowLight.shadow.camera as any;
          if (cam) {
            cam.left = -padding;
            cam.right = padding;
            cam.top = padding;
            cam.bottom = -padding;
            cam.updateProjectionMatrix();
            console.log(
              `💡 Shadow camera bounds updated to +/- ${padding.toFixed(2)}`,
            );
          }
        }

        sceneRef.current!.add(model);
        console.log("✅ Model added to scene");

        setupVideos(model);

        if (gltf.animations.length > 0) {
          const mixer = new THREE.AnimationMixer(model);
          const action = mixer.clipAction(gltf.animations[0]);
          action.play();
          action.paused = true;

          mixerRef.current = mixer;
          actionRef.current = action;

          console.log(
            `✅ Animation setup - Duration: ${gltf.animations[0].duration}s`,
          );
        }

        setLoading(false);
        console.log("🎉 All setup complete!");
      },
      (progress) => {
        const percent = ((progress.loaded / progress.total) * 100).toFixed(2);
        console.log(`⏳ Loading: ${percent}%`);
      },
      (error) => {
        console.error("❌ Error loading model:", error);
        setError("Failed to load 3D model. Please check the model path.");
        setLoading(false);
      },
    );
  }, [updateModelScaleAndPosition, setupVideos]);

  /* ==================== SCROLL ANIMATION ==================== */
  useEffect(() => {
    if (loading) return;

    if (scrollTriggerRef.current) {
      scrollTriggerRef.current.kill();
    }

    scrollTriggerRef.current = ScrollTrigger.create({
      trigger: document.body,
      start: "top top",
      end: `+=${window.innerHeight * CONFIG.ANIMATION.SCROLL_MULTIPLIER}`,
      scrub: CONFIG.ANIMATION.SCRUB,
      onUpdate: (self) => {
        const progress = self.progress;
        const scrollPercent = progress * 100;
        const newTargetFrame = progress * CONFIG.TOTAL_FRAMES;

        targetFrame.current = newTargetFrame;

        if (scrollPercent >= CONFIG.ANIMATION_COMPLETE_THRESHOLD) {
          if (!showButtons) {
            setShowButtons(true);
          }
        } else {
          if (showButtons) {
            setShowButtons(false);
          }
        }
      },
    });

    console.log("✅ ScrollTrigger initialized");

    return () => {
      if (scrollTriggerRef.current) {
        scrollTriggerRef.current.kill();
      }
    };
  }, [loading, showButtons]);

  /* ==================== NEW: SEPARATE EFFECT FOR STATE UPDATES ==================== */
  useEffect(() => {
    const interval = setInterval(() => {
      if (pendingAnnotationsRef.current !== null) {
        const pending = pendingAnnotationsRef.current;
        setVisibleAnnotations((current) => {
          if (JSON.stringify(pending) !== JSON.stringify(current)) {
            return pending;
          }
          return current;
        });
      }
    }, 16); // ~60fps

    return () => clearInterval(interval);
  }, []);

  /* ==================== ANIMATION LOOP WITH LERP (FIXED) ==================== */
  useEffect(() => {
    let animationFrameId: number;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      if (!rendererRef.current || !sceneRef.current || !cameraRef.current)
        return;

      // Update frame with lerp
      if (CONFIG.ANIMATION.USE_EASING) {
        currentFrame.current = lerp(
          currentFrame.current,
          targetFrame.current,
          CONFIG.ANIMATION.LERP_FACTOR,
        );
      } else {
        const distance = Math.abs(targetFrame.current - currentFrame.current);
        const adaptiveFactor = Math.min(
          CONFIG.ANIMATION.LERP_FACTOR * (1 + distance / 100),
          0.3,
        );
        currentFrame.current = lerp(
          currentFrame.current,
          targetFrame.current,
          adaptiveFactor,
        );
      }

      // Check which annotations should be visible - store in ref instead of setState
      const newVisibleAnnotations: number[] = [];
      CONFIG.TEXT_ANNOTATIONS.forEach((annotation) => {
        if (
          currentFrame.current >= annotation.frameStart &&
          currentFrame.current <= annotation.frameEnd
        ) {
          newVisibleAnnotations.push(annotation.id);
        }
      });

      // FIXED: Store in ref instead of calling setState directly
      pendingAnnotationsRef.current = newVisibleAnnotations;

      // Update GLB animation to current frame
      if (mixerRef.current && actionRef.current) {
        const clip = actionRef.current.getClip();
        const normalizedTime = currentFrame.current / CONFIG.TOTAL_FRAMES;
        actionRef.current.time = normalizedTime * clip.duration;
        mixerRef.current.update(0);
      }

      // Update video texture
      const activeVideoData = videosRef.current[activeVideo - 1];
      if (activeVideoData) {
        activeVideoData.texture.needsUpdate = true;
      }

      rendererRef.current.render(sceneRef.current, cameraRef.current);
    };

    animate();

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [activeVideo]);

  /* ==================== INIT + RESIZE ==================== */
  useEffect(() => {
    initScene();
    initRenderer();
    loadEnvironment();
    loadModel();

    const onResize = () => {
      if (!rendererRef.current || !cameraRef.current) return;

      const newDeviceType = getDeviceType();
      const deviceChanged = currentDeviceTypeRef.current !== newDeviceType;

      if (deviceChanged) {
        console.log(
          `🔄 Device type changed: ${currentDeviceTypeRef.current} → ${newDeviceType}`,
        );
        currentDeviceTypeRef.current = newDeviceType;
        setDeviceType(newDeviceType);

        if (cameraRef.current instanceof THREE.PerspectiveCamera) {
          let targetFOV = 75;
          if (newDeviceType === "sm") {
            targetFOV = 70; // Mobile
          } else if (newDeviceType === "md") {
            targetFOV = 60; // Tablet
          } else if (newDeviceType === "lg") {
            targetFOV = 50; // Laptop
          }
          cameraRef.current.fov = targetFOV;
          console.log(`📷 FOV updated to ${targetFOV} for ${newDeviceType}`);
        }
      }

      cameraRef.current.aspect = window.innerWidth / window.innerHeight;
      cameraRef.current.updateProjectionMatrix();

      rendererRef.current.setSize(window.innerWidth, window.innerHeight);
      rendererRef.current.setPixelRatio(
        Math.min(window.devicePixelRatio, CONFIG.RENDERER.MAX_PIXEL_RATIO),
      );

      if (deviceChanged) {
        updateModelScaleAndPosition();
        ScrollTrigger.refresh();
      }

      if (CONFIG.BACKGROUND.MODE === "image" && sceneRef.current) {
        createImageBackground(
          sceneRef.current,
          CONFIG.BACKGROUND.IMAGE.PATH,
          CONFIG.BACKGROUND.IMAGE.FIT,
        );
      }
    };

    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      videosRef.current.forEach((v) => {
        v.video.pause();
        v.video.src = "";
      });
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());

      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
    };
  }, [
    initScene,
    initRenderer,
    loadEnvironment,
    loadModel,
    updateModelScaleAndPosition,
  ]);

  return (
    <div className="relative h-[1150vh]">
      <div className="fixed inset-0 w-full h-full">
        <canvas ref={canvasRef} className="w-full h-full" />
      </div>

      {/* Render all text annotations with device-specific positioning */}
      {CONFIG.TEXT_ANNOTATIONS.map((annotation) => (
        <TextAnnotation
          key={annotation.id}
          annotation={annotation}
          isVisible={visibleAnnotations.includes(annotation.id)}
          deviceType={deviceType}
        />
      ))}

      {/* Loading indicator */}
      {loading && !error && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/80">
          <div className="text-white text-xl">Loading 3D Model...</div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/80">
          <div className="text-red-500 text-xl max-w-md text-center p-4">
            {error}
          </div>
        </div>
      )}

      {/* Video Control Buttons */}
      {showButtons && !loading && !error && (
        <div className="fixed top-4 md:top-5 left-0 right-0 z-[9999] px-2 md:px-0 pointer-events-none">
          <div className="max-w-7xl mx-auto flex justify-center pointer-events-auto">
            <div className="bg-white rounded-full p-1 shadow-lg inline-flex items-center gap-1">
              {CONFIG.VIDEOS.map((video) => (
                <button
                  key={video.id}
                  onClick={() => switchVideo(video.id)}
                  className={`
                    px-5 md:px-6 py-2 md:py-2.5 rounded-full font-medium text-sm md:text-base
                    transition-all duration-300 ease-out
                    ${
                      activeVideo === video.id
                        ? "bg-red-600 text-white shadow-md"
                        : "bg-transparent text-gray-700 hover:bg-gray-100"
                    }
                  `}
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