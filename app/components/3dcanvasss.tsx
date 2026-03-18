"use client";

import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

/* ==================== SAFARI / iOS DETECTION ==================== */
const isSafari = (): boolean => {
  if (typeof window === "undefined") return false;
  return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
};
const isIOS = (): boolean => {
  if (typeof window === "undefined") return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
};
const isMacOS = (): boolean => {
  if (typeof window === "undefined") return false;
  return /Macintosh|MacIntel|MacPPC|Mac68K/.test(navigator.userAgent);
};
const needsSafariVideoUnlock = (): boolean => isSafari() || isIOS();

/* ==================== CONFIG ==================== */
const CONFIG = {
  TOTAL_FRAMES: 550,
  MODEL: {
    PATH: "/Sbike1 14.glb",
    POSITION_Y_OFFSET: -1,
    SCALE: {
      mobile: 0.05,
      tablet: 0.1,
      desktop: 1.0,
    },
    MOBILE_POSITION: { y: -1.5, x: 0, z: 0 },
    TABLET_POSITION: { y: -1.8, x: 0, z: 0 },
    DESKTOP_POSITION: { y: 1, x: 0, z: 0 },
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
    MODE: "image" as const,
    COLOR: 0x000000,
    IMAGE: {
      PATH: "https://s3.us-east-1.amazonaws.com/sportstech.team/dev_assets/bg.png",
      FIT: "cover",
    },
  },
  CAMERA: {
    mobile: { fov: 50, position: { x: 0, y: 0, z: 8 } },
    tablet: { fov: 50, position: { x: 0, y: 0, z: 7 } },
    desktop: { fov: 1000, position: { x: 1, y: 0, z: 5 } },
  },
  ANIMATION_COMPLETE_THRESHOLD: 95,
  ANIMATION: {
    LERP_FACTOR: 0.02,
    SCRUB: 2.5,
    SCROLL_MULTIPLIER: 12,
    USE_EASING: true,
  },
  SHADOW: {
    ENABLED: true,
    MAP_SIZE: 2048,
    BIAS: -0.0001,
    NORMAL_BIAS: 0.02,
    RADIUS: 4,
    mobile: {
      OPACITY: 0.3,
      PLANE_SIZE: 5,
      LIGHT_HEIGHT: 3,
      CAMERA_BOUNDS: 2,
    },
    tablet: {
      OPACITY: 0.25,
      PLANE_SIZE: 10,
      LIGHT_HEIGHT: 10,
      CAMERA_BOUNDS: 5,
    },
    desktop: {
      OPACITY: 0.2,
      PLANE_SIZE: 50,
      LIGHT_HEIGHT: 35,
      CAMERA_BOUNDS: 10,
    },
  },
  LIGHT: {
    DIRECTIONAL: { COLOR: 0xffffff, INTENSITY: 1.5 },
    AMBIENT: { COLOR: 0xffffff, INTENSITY: 0.3 },
  },
  OPTIMIZATION: {
    MAX_TEXTURE_SIZE: { mobile: 512, tablet: 1024, desktop: 2048 },
    SHADOW_MAP_SIZE: { mobile: 2048, tablet: 1024, desktop: 2048 },
    PIXEL_RATIO: { mobile: 1.5, tablet: 1.5, desktop: 2 },
  },

  /* ── Wheel color change ── */
  WHEEL: {
    MESH_NAMES: ["Wheel"],
    ACTIVE_COLOR: 0xdc2626,
    TRANSITION_DURATION: 1.0,
  },

  /* ── Annotation anchor meshes in GLB ── */
  ANNOTATION_ANCHOR_MESHES: ["wheel_text", "screen_text"] as const,

  /* ── Text annotations with frame ranges ── */
  TEXT_ANNOTATIONS: [
    {
      id: 1,
      frameStart: 60,
      frameEnd: 230,
      visibleAtSection: 1,
      align: "left" as const,
      mobileLayout: { top: "auto", bottom: 80, left: 16, right: "auto" },
      tabletLayout: { top: "auto", bottom: 80, left: 16, right: "auto" },
      title: "Dynamic LED Lights",
      text: "Color-changing LEDs respond to your speed that enhances focus and energy.",
      src: "https://s3.us-east-1.amazonaws.com/sportstech.team/dev_assets/incandescent-light-bulb-svgrepo-com 1.svg",
      meshName: "Wheel",
      anchorMeshName: "wheel_text",
      triggerWheelColorChange: true,
    },
    {
      id: 2,
      frameStart: 220,
      frameEnd: 270,
      visibleAtSection: 2,
      align: "right" as const,
      mobileLayout: { top: "auto", bottom: 80, left: 20, right: "auto" },
      tabletLayout: { top: "auto", bottom: 80, left: "auto", right: 16 },
      title: "21.5 Display",
      text: "With the 360-degree swiveling touch display, your workouts are more flexible than ever!",
      src: "https://s3.us-east-1.amazonaws.com/sportstech.team/dev_assets/square_3942733.svg",
      meshName: "Screen",
      anchorMeshName: "screen_text",
    },
  ],
} as const;

/* ==================== TYPES ==================== */
type DeviceType = "mobile" | "tablet" | "desktop";

interface TextureImage {
  width?: number;
  height?: number;
  videoWidth?: number;
  videoHeight?: number;
}

interface StoredMaterialColors {
  color: THREE.Color;
  emissive?: THREE.Color;
  emissiveIntensity?: number;
}

interface ScreenPt {
  x: number;
  y: number;
  ok: boolean;
}

interface ConnectorState {
  meshPt: ScreenPt;
  cardPt: { x: number; y: number };
}

/* ==================== DEVICE DETECTION ==================== */
const getDeviceType = (): DeviceType => {
  if (typeof window === "undefined") return "desktop";
  if (window.innerWidth <= 767) return "mobile";
  if (window.innerWidth <= 1023) return "tablet";
  return "desktop";
};

const getDeviceInfo = () => {
  if (typeof window === "undefined") {
    return {
      deviceType: "desktop" as DeviceType,
      isIOS: false,
      isMobile: false,
    };
  }
  const ua = navigator.userAgent;
  const iosDevice =
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const isMobile =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  return { deviceType: getDeviceType(), isIOS: iosDevice, isMobile };
};

const getShadowConfig = (deviceType: DeviceType) =>
  CONFIG.SHADOW[deviceType];

/* ==================== HELPERS ==================== */
const lerp = (start: number, end: number, factor: number): number =>
  start + (end - start) * factor;

const centerModel = (model: THREE.Group, deviceType: DeviceType) => {
  const box = new THREE.Box3().setFromObject(model);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const devicePosition =
    deviceType === "mobile"
      ? CONFIG.MODEL.MOBILE_POSITION
      : deviceType === "tablet"
        ? CONFIG.MODEL.TABLET_POSITION
        : CONFIG.MODEL.DESKTOP_POSITION;

  model.position.x = devicePosition.x - center.x;
  model.position.z = devicePosition.z - center.z;
  model.position.y = devicePosition.y - size.y / 1.45;

  return { size, box };
};

/* ==================== TEXTURE / MODEL OPTIMIZATION ==================== */
const optimizeTexture = (
  texture: THREE.Texture,
  maxSize: number,
): THREE.Texture => {
  if (!texture.image) return texture;
  const image = texture.image as TextureImage;
  const width = image.width || image.videoWidth || 0;
  const height = image.height || image.videoHeight || 0;
  if (width <= maxSize && height <= maxSize) return texture;
  if (width === 0 || height === 0) return texture;

  const aspect = width / height;
  let newWidth = maxSize;
  let newHeight = maxSize;
  if (aspect > 1) newHeight = Math.round(maxSize / aspect);
  else newWidth = Math.round(maxSize * aspect);

  const canvas = document.createElement("canvas");
  canvas.width = newWidth;
  canvas.height = newHeight;
  const ctx = canvas.getContext("2d");
  if (ctx && texture.image instanceof HTMLImageElement) {
    ctx.drawImage(texture.image, 0, 0, newWidth, newHeight);
    texture.image = canvas;
    texture.needsUpdate = true;
  }
  return texture;
};

const optimizeModel = (model: THREE.Group, deviceType: DeviceType) => {
  const maxTextureSize = CONFIG.OPTIMIZATION.MAX_TEXTURE_SIZE[deviceType];
  model.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh;
      const materials = Array.isArray(mesh.material)
        ? mesh.material
        : [mesh.material];
      materials.forEach((material) => {
        if (
          material instanceof THREE.MeshStandardMaterial ||
          material instanceof THREE.MeshPhysicalMaterial
        ) {
          const textureProps: (keyof THREE.MeshStandardMaterial)[] = [
            "map",
            "normalMap",
            "roughnessMap",
            "metalnessMap",
            "aoMap",
            "emissiveMap",
          ];
          textureProps.forEach((prop) => {
            const texture = material[prop] as THREE.Texture | null;
            if (texture) {
              optimizeTexture(texture, maxTextureSize);
              texture.generateMipmaps = deviceType !== "mobile";
              texture.minFilter =
                deviceType === "mobile"
                  ? THREE.LinearFilter
                  : THREE.LinearMipmapLinearFilter;
              texture.magFilter = THREE.LinearFilter;
              texture.anisotropy =
                deviceType === "mobile"
                  ? 1
                  : deviceType === "tablet"
                    ? 4
                    : 8;
            }
          });
          if (deviceType === "mobile") material.envMapIntensity = 0.5;
        }
      });
      if (mesh.geometry) {
        mesh.geometry.computeBoundingSphere();
        mesh.geometry.computeBoundingBox();
        if (deviceType === "mobile" && mesh.geometry.getAttribute("uv2")) {
          mesh.geometry.deleteAttribute("uv2");
        }
      }
      mesh.frustumCulled = true;
    }
  });
};

/* ==================== DISPOSE ==================== */
const disposeTexture = (texture: THREE.Texture | null) => {
  if (texture) texture.dispose();
};

const disposeMaterial = (material: THREE.Material) => {
  if (
    material instanceof THREE.MeshStandardMaterial ||
    material instanceof THREE.MeshPhysicalMaterial
  ) {
    disposeTexture(material.map);
    disposeTexture(material.normalMap);
    disposeTexture(material.roughnessMap);
    disposeTexture(material.metalnessMap);
    disposeTexture(material.aoMap);
    disposeTexture(material.emissiveMap);
  }
  material.dispose();
};

const disposeModel = (model: THREE.Group) => {
  model.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh;
      if (mesh.geometry) mesh.geometry.dispose();
      if (Array.isArray(mesh.material))
        mesh.material.forEach(disposeMaterial);
      else if (mesh.material) disposeMaterial(mesh.material);
    }
  });
};

/* ==================== BACKGROUND ==================== */
const createImageBackground = (
  scene: THREE.Scene,
  imagePath: string,
  fitMode: string = "cover",
) => {
  const textureLoader = new THREE.TextureLoader();
  textureLoader.setCrossOrigin("anonymous");
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
    (error) => {
      console.error("Failed to load background image:", error);
      scene.background = new THREE.Color(0x1a1a2e);
    },
  );
};

/* ==================== VIDEO TEXTURE ==================== */
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
    video.setAttribute("playsinline", "");
    video.setAttribute("webkit-playsinline", "");

    if (needsSafariVideoUnlock()) {
      video.style.cssText = [
        "position:fixed",
        "top:-9999px",
        "left:-9999px",
        "width:1px",
        "height:1px",
        "opacity:0",
        "pointer-events:none",
        "z-index:-1",
      ].join(";");
      document.body.appendChild(video);
    }

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

/* ==================== SHADOW ==================== */
const createShadowPlane = (
  scene: THREE.Scene,
  yPosition: number,
  deviceType: DeviceType,
): THREE.Mesh => {
  const shadowConfig = getShadowConfig(deviceType);
  const geometry = new THREE.PlaneGeometry(
    shadowConfig.PLANE_SIZE,
    shadowConfig.PLANE_SIZE,
  );
  const material = new THREE.ShadowMaterial({
    opacity: shadowConfig.OPACITY,
    transparent: true,
    depthWrite: false,
  });
  const plane = new THREE.Mesh(geometry, material);
  plane.rotation.x = -Math.PI / 2;
  plane.position.y = yPosition;
  plane.receiveShadow = true;
  plane.name = "shadowPlane";
  plane.renderOrder = -1;
  scene.add(plane);
  return plane;
};

const updateShadowPlane = (
  shadowPlane: THREE.Mesh | null,
  model: THREE.Group | null,
  deviceType: DeviceType,
) => {
  if (!shadowPlane || !model) return;
  const box = new THREE.Box3().setFromObject(model);
  const center = box.getCenter(new THREE.Vector3());
  const shadowConfig = getShadowConfig(deviceType);
  shadowPlane.position.x = center.x;
  shadowPlane.position.z = center.z;
  shadowPlane.position.y = box.min.y - 0.001;
  const geometry = new THREE.PlaneGeometry(
    shadowConfig.PLANE_SIZE,
    shadowConfig.PLANE_SIZE,
  );
  shadowPlane.geometry.dispose();
  shadowPlane.geometry = geometry;
  (shadowPlane.material as THREE.ShadowMaterial).opacity =
    shadowConfig.OPACITY;
};

const createShadowLights = (
  scene: THREE.Scene,
  deviceType: DeviceType,
): THREE.DirectionalLight => {
  const shadowConfig = getShadowConfig(deviceType);
  const shadowMapSize = CONFIG.OPTIMIZATION.SHADOW_MAP_SIZE[deviceType];
  const directionalLight = new THREE.DirectionalLight(
    CONFIG.LIGHT.DIRECTIONAL.COLOR,
    CONFIG.LIGHT.DIRECTIONAL.INTENSITY,
  );
  directionalLight.position.set(
    shadowConfig.CAMERA_BOUNDS * 0.5,
    shadowConfig.LIGHT_HEIGHT,
    shadowConfig.CAMERA_BOUNDS * 0.5,
  );
  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.width = shadowMapSize;
  directionalLight.shadow.mapSize.height = shadowMapSize;
  directionalLight.shadow.camera.left = -shadowConfig.CAMERA_BOUNDS;
  directionalLight.shadow.camera.right = shadowConfig.CAMERA_BOUNDS;
  directionalLight.shadow.camera.top = shadowConfig.CAMERA_BOUNDS;
  directionalLight.shadow.camera.bottom = -shadowConfig.CAMERA_BOUNDS;
  directionalLight.shadow.camera.near = 0.1;
  directionalLight.shadow.camera.far = shadowConfig.LIGHT_HEIGHT * 2;
  directionalLight.shadow.bias = CONFIG.SHADOW.BIAS;
  directionalLight.shadow.normalBias = CONFIG.SHADOW.NORMAL_BIAS;
  directionalLight.shadow.radius = CONFIG.SHADOW.RADIUS;
  scene.add(directionalLight);
  scene.add(directionalLight.target);

  const ambientLight = new THREE.AmbientLight(
    CONFIG.LIGHT.AMBIENT.COLOR,
    CONFIG.LIGHT.AMBIENT.INTENSITY,
  );
  scene.add(ambientLight);
  return directionalLight;
};

const updateLightForDevice = (
  light: THREE.DirectionalLight | null,
  model: THREE.Group | null,
  deviceType: DeviceType,
) => {
  if (!light || !model) return;
  const box = new THREE.Box3().setFromObject(model);
  const center = box.getCenter(new THREE.Vector3());
  const shadowConfig = getShadowConfig(deviceType);
  const shadowMapSize = CONFIG.OPTIMIZATION.SHADOW_MAP_SIZE[deviceType];

  light.position.set(
    center.x + shadowConfig.CAMERA_BOUNDS * 0.5,
    center.y + shadowConfig.LIGHT_HEIGHT,
    center.z + shadowConfig.CAMERA_BOUNDS * 0.5,
  );
  light.target.position.set(center.x, center.y, center.z);
  light.target.updateMatrixWorld();
  light.shadow.mapSize.width = shadowMapSize;
  light.shadow.mapSize.height = shadowMapSize;
  light.shadow.camera.left = -shadowConfig.CAMERA_BOUNDS;
  light.shadow.camera.right = shadowConfig.CAMERA_BOUNDS;
  light.shadow.camera.top = shadowConfig.CAMERA_BOUNDS;
  light.shadow.camera.bottom = -shadowConfig.CAMERA_BOUNDS;
  light.shadow.camera.far = shadowConfig.LIGHT_HEIGHT * 2;
  light.shadow.camera.updateProjectionMatrix();
};

/* ==================== 3D → 2D PROJECTION ==================== */
const projectPoint = (
  wp: THREE.Vector3,
  cam: THREE.PerspectiveCamera,
): { x: number; y: number } | null => {
  const p = wp.clone().project(cam);
  if (p.z > 1) return null;
  return {
    x: (p.x * 0.5 + 0.5) * window.innerWidth,
    y: (-p.y * 0.5 + 0.5) * window.innerHeight,
  };
};

const toScreen = (
  obj: THREE.Object3D,
  cam: THREE.PerspectiveCamera,
): { x: number; y: number } | null => {
  const wp = new THREE.Vector3();
  obj.getWorldPosition(wp);
  return projectPoint(wp, cam);
};

const toScreenBottomCenter = (
  obj: THREE.Object3D,
  cam: THREE.PerspectiveCamera,
): { x: number; y: number } | null => {
  const mesh = obj as THREE.Mesh;
  if (!mesh.geometry) return toScreen(obj, cam);
  mesh.geometry.computeBoundingBox();
  const bbox = mesh.geometry.boundingBox;
  if (!bbox) return toScreen(obj, cam);
  const localPt = new THREE.Vector3(
    (bbox.min.x + bbox.max.x) / 2,
    bbox.min.y,
    (bbox.min.z + bbox.max.z) / 2,
  );
  const worldPt = localPt.applyMatrix4(obj.matrixWorld);
  return projectPoint(worldPt, cam);
};

/* ==================== CONNECTOR LINE (mobile/tablet) ==================== */
interface ConnectorLineProps {
  meshPt: ScreenPt;
  cardPt: { x: number; y: number };
  visible: boolean;
  deviceType: DeviceType;
}

const ConnectorLine: React.FC<ConnectorLineProps> = React.memo(
  ({ meshPt, cardPt, visible, deviceType }) => {
    const lastPtRef = useRef<{
      x1: number;
      y1: number;
      x2: number;
      y2: number;
    } | null>(null);

    // Only show on mobile/tablet
    if (deviceType === "desktop") return null;

    if (meshPt.ok) {
      lastPtRef.current = {
        x1: meshPt.x,
        y1: meshPt.y,
        x2: cardPt.x,
        y2: cardPt.y,
      };
    }
    if (!lastPtRef.current) return null;

    const { x1, y1, x2, y2 } = lastPtRef.current;
    const mx = (x1 + x2) / 2;
    const my = (y1 + y2) / 2 - 18;
    const pathD = `M ${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}`;
    const lineLen = Math.hypot(x2 - x1, y2 - y1);
    const uid = `conn-${deviceType}`;
    const show = visible && meshPt.ok;

    return (
      <svg
        style={{
          position: "fixed",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          zIndex: 49,
          overflow: "visible",
          opacity: show ? 1 : 0,
          transition: "opacity 0.4s cubic-bezier(0.4,0,0.2,1)",
        }}
      >
        <defs>
          <linearGradient
            id={`grad-${uid}`}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#dc2626" stopOpacity="0.9" />
            <stop offset="60%" stopColor="#9ca3af" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#6b7280" stopOpacity="0.4" />
          </linearGradient>
          <filter
            id={`glow-${uid}`}
            x="-20%"
            y="-20%"
            width="140%"
            height="140%"
          >
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id={`dash-${uid}`}>
            <feGaussianBlur stdDeviation="1" />
          </filter>
        </defs>
        <path
          d={pathD}
          fill="none"
          stroke="#dc2626"
          strokeWidth="3"
          strokeOpacity="0.18"
          filter={`url(#dash-${uid})`}
        />
        <path
          d={pathD}
          fill="none"
          stroke={`url(#grad-${uid})`}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeDasharray={`${lineLen}`}
          strokeDashoffset={show ? "0" : `${lineLen}`}
          style={{
            transition:
              "stroke-dashoffset 0.7s cubic-bezier(0.4,0,0.2,1)",
          }}
        />
        <circle
          cx={x1}
          cy={y1}
          r="4"
          fill="#dc2626"
          opacity="0.95"
          filter={`url(#glow-${uid})`}
        />
        <circle
          cx={x1}
          cy={y1}
          r="4"
          fill="none"
          stroke="#dc2626"
          strokeWidth="1.5"
          opacity="0.5"
        >
          <animate
            attributeName="r"
            values="4;9;4"
            dur="2s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            values="0.5;0;0.5"
            dur="2s"
            repeatCount="indefinite"
          />
        </circle>
        <circle cx={x1} cy={y1} r="2" fill="#fff" opacity="0.9" />
        <circle cx={x2} cy={y2} r="3.5" fill="#6b7280" opacity="0.6" />
        <circle
          cx={x2}
          cy={y2}
          r="3.5"
          fill="none"
          stroke="#9ca3af"
          strokeWidth="1"
          opacity="0.4"
        >
          <animate
            attributeName="r"
            values="3.5;6;3.5"
            dur="2.4s"
            repeatCount="indefinite"
            begin="0.4s"
          />
          <animate
            attributeName="opacity"
            values="0.4;0;0.4"
            dur="2.4s"
            repeatCount="indefinite"
            begin="0.4s"
          />
        </circle>
        <circle cx={x2} cy={y2} r="1.5" fill="#fff" opacity="0.8" />
        <line
          x1={x2 - 6}
          y1={y2}
          x2={x2 + 6}
          y2={y2}
          stroke="#9ca3af"
          strokeWidth="1"
          opacity="0.5"
          strokeLinecap="round"
        />
        <line
          x1={x2}
          y1={y2 - 6}
          x2={x2}
          y2={y2 + 6}
          stroke="#9ca3af"
          strokeWidth="1"
          opacity="0.5"
          strokeLinecap="round"
        />
      </svg>
    );
  },
);
ConnectorLine.displayName = "ConnectorLine";

/* ==================== TEXT ANNOTATIONS ==================== */
interface TextAnnotationProps {
  annotation: (typeof CONFIG.TEXT_ANNOTATIONS)[number];
  isVisible: boolean;
  deviceType: DeviceType;
  cardRef?: React.RefCallback<HTMLDivElement>;
  anchorScreenPt?: ScreenPt;
}

/* ── Mobile / Tablet card ── */
const TextAnnotationMobile: React.FC<TextAnnotationProps> = React.memo(
  ({ annotation, isVisible, deviceType, cardRef }) => {
    const layout =
      deviceType === "mobile"
        ? annotation.mobileLayout
        : annotation.tabletLayout;
    const cardW = deviceType === "mobile" ? 208 : 256;
    const toVal = (v: number | string): number | "auto" =>
      (v as string) === "auto" ? "auto" : (v as number);

    return (
      <div
        ref={cardRef}
        style={{
          position: "fixed",
          top: toVal(layout.top as number | string),
          bottom: toVal(layout.bottom as number | string),
          left: toVal(layout.left as number | string),
          right: toVal(layout.right as number | string),
          pointerEvents: "none",
          zIndex: 50,
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? "translateY(0px)" : "translateY(10px)",
          transition:
            "opacity 0.35s cubic-bezier(0.4,0,0.2,1), transform 0.35s cubic-bezier(0.4,0,0.2,1)",
          willChange: "opacity, transform",
        }}
      >
        <div
          className="rounded-2xl"
          style={{
            width: cardW,
            boxShadow:
              "0 8px 32px rgba(0,0,0,0.45), 0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.12)",
          }}
        >
          <div
            className="rounded-2xl p-3 flex flex-col gap-1.5"
            style={{
              background:
                "linear-gradient(135deg, rgba(20,20,20,0.85) 0%, rgba(30,30,30,0.70) 100%)",
              WebkitBackdropFilter: "blur(20px) saturate(180%)",
              backdropFilter: "blur(20px) saturate(180%)",
              border: "1px solid rgba(255,255,255,0.10)",
              borderTop: "1px solid rgba(255,255,255,0.18)",
              borderLeft: "1px solid rgba(255,255,255,0.14)",
            }}
          >
            <div className="flex justify-start items-center gap-2">
              <img
                src={annotation.src}
                alt={annotation.title}
                className="rounded-lg w-10 h-10 object-contain"
                draggable={false}
                style={{ filter: "brightness(0) invert(1)" }}
              />
              <h3
                className="text-xs font-bold font-mono leading-snug"
                style={{ color: "#f0f0f0" }}
              >
                {annotation.title}
              </h3>
            </div>
            <p
              className="text-[10px] font-mono leading-relaxed font-semibold"
              style={{ color: "#999" }}
            >
              {annotation.text}
            </p>
          </div>
        </div>
      </div>
    );
  },
);
TextAnnotationMobile.displayName = "TextAnnotationMobile";

/* ── Desktop card with growing line ── */
const CARD_WIDTH = 280;
const LINE_LENGTH = 64;
const CARD_GAP = 10;

const TextAnnotationDesktop: React.FC<TextAnnotationProps> = React.memo(
  ({ annotation, isVisible, cardRef, anchorScreenPt }) => {
    const isRight = annotation.align === "right";
    const lineRef = useRef<SVGLineElement>(null);
    const prevVisibleRef = useRef(false);
    const hasAnchor = anchorScreenPt?.ok === true;
    const anchorX = hasAnchor ? anchorScreenPt!.x : 0;
    const anchorY = hasAnchor ? anchorScreenPt!.y : 0;

    useEffect(() => {
      const line = lineRef.current;
      if (!line) return;
      if (isVisible && !prevVisibleRef.current) {
        line.style.transition = "none";
        line.style.strokeDashoffset = String(LINE_LENGTH);
        void line.getBoundingClientRect();
        line.style.transition =
          "stroke-dashoffset 0.55s cubic-bezier(0.4,0,0.2,1) 0.05s";
        line.style.strokeDashoffset = "0";
      } else if (!isVisible && prevVisibleRef.current) {
        line.style.transition =
          "stroke-dashoffset 0.3s cubic-bezier(0.4,0,0.2,1)";
        line.style.strokeDashoffset = String(LINE_LENGTH);
      }
      prevVisibleRef.current = isVisible;
    }, [isVisible]);

    const cardLeft = isRight
      ? anchorX - LINE_LENGTH - CARD_WIDTH - CARD_GAP
      : anchorX + LINE_LENGTH + CARD_GAP;
    const shouldShow = isVisible && hasAnchor;

    return (
      <div
        style={{
          visibility: hasAnchor ? "visible" : "hidden",
          pointerEvents: "none",
        }}
      >
        <svg
          style={{
            position: "fixed",
            inset: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
            zIndex: 49,
            overflow: "visible",
            opacity: shouldShow ? 1 : 0,
            transition: "opacity 0.3s ease-out",
          }}
        >
          <defs>
            <filter
              id={`glow-desktop-${annotation.id}`}
              x="-50%"
              y="-50%"
              width="200%"
              height="200%"
            >
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {/* growing line */}
          <line
            ref={lineRef}
            x1={anchorX}
            y1={anchorY}
            x2={
              isRight
                ? anchorX - LINE_LENGTH
                : anchorX + LINE_LENGTH
            }
            y2={anchorY}
            stroke="#dc2626"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeDasharray={LINE_LENGTH}
            strokeDashoffset={LINE_LENGTH}
          />
          {/* pulse ring */}
          <circle
            cx={anchorX}
            cy={anchorY}
            r="5"
            fill="none"
            stroke="#dc2626"
            strokeWidth="1.5"
            opacity="0.4"
          >
            <animate
              attributeName="r"
              values="5;11;5"
              dur="2s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="opacity"
              values="0.4;0;0.4"
              dur="2s"
              repeatCount="indefinite"
            />
          </circle>
          {/* anchor dot */}
          <circle
            cx={anchorX}
            cy={anchorY}
            r="4"
            fill="#dc2626"
            filter={`url(#glow-desktop-${annotation.id})`}
          />
          <circle cx={anchorX} cy={anchorY} r="1.8" fill="#fff" />
        </svg>

        <div
          ref={cardRef}
          className="fixed pointer-events-none z-50"
          style={{
            top: `${anchorY - 8}px`,
            left: `${cardLeft}px`,
            opacity: shouldShow ? 1 : 0,
            transform: shouldShow
              ? "translateX(0)"
              : isRight
                ? "translateX(12px)"
                : "translateX(-12px)",
            transition:
              "opacity 0.3s ease-out 0.15s, transform 0.3s ease-out 0.15s",
            willChange: "opacity, transform",
          }}
        >
          <div style={{ width: CARD_WIDTH }}>
            <div
              className={`flex items-center gap-2 mb-1.5 ${isRight ? "justify-end" : "justify-start"}`}
            >
              <img
                src={annotation.src}
                alt={annotation.title}
                className="w-10 h-10 object-contain flex-shrink-0"
                draggable={false}
                style={{ filter: "brightness(0) invert(1)" }}
              />
            </div>
            <h3
              className="font-bold font-mono mb-1.5"
              style={{
                fontSize: "15px",
                textAlign: isRight ? "right" : "left",
                color: "#f0f0f0",
              }}
            >
              {annotation.title}
            </h3>
            <p
              className="font-mono leading-relaxed"
              style={{
                fontSize: "12px",
                textAlign: isRight ? "right" : "left",
                color: "#999",
              }}
            >
              {annotation.text}
            </p>
          </div>
        </div>
      </div>
    );
  },
);
TextAnnotationDesktop.displayName = "TextAnnotationDesktop";

const TextAnnotation: React.FC<TextAnnotationProps> = (props) => {
  if (props.deviceType === "mobile" || props.deviceType === "tablet")
    return <TextAnnotationMobile {...props} />;
  return <TextAnnotationDesktop {...props} />;
};

/* ============================================================
   MAIN COMPONENT — same scroll logic as original 3DCanvas
   ============================================================ */
export default function Scroll3DCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const actionRef = useRef<THREE.AnimationAction | null>(null);
  const modelRef = useRef<THREE.Group | null>(null);
  const currentDeviceTypeRef = useRef<DeviceType>("desktop");
  const originalCameraPositionRef = useRef<THREE.Vector3 | null>(null);
  const shadowPlaneRef = useRef<THREE.Mesh | null>(null);
  const directionalLightRef = useRef<THREE.DirectionalLight | null>(null);
  const videosRef = useRef<
    { video: HTMLVideoElement; texture: THREE.VideoTexture }[]
  >([]);
  const screenMeshRef = useRef<THREE.Mesh | null>(null);
  const targetFrame = useRef(0);
  const currentFrame = useRef(0);
  const scrollTriggerRef = useRef<ScrollTrigger | null>(null);
  const isInitializedRef = useRef(false);

  /* ── NEW: wheel color refs ── */
  const wheelMeshesRef = useRef<THREE.Mesh[]>([]);
  const wheelOriginalColorsRef = useRef<
    Map<THREE.Material, StoredMaterialColors>
  >(new Map());
  const isWheelRedRef = useRef(false);

  /* ── NEW: annotation refs ── */
  const connectorMeshRefs = useRef<(THREE.Object3D | null)[]>([null, null]);
  const annotationAnchorRefs = useRef<(THREE.Object3D | null)[]>([
    null,
    null,
  ]);
  const annCardRefs = useRef<(HTMLDivElement | null)[]>([null, null]);

  /* ── NEW: safari refs ── */
  const safariRef = useRef(false);
  const iosRef = useRef(false);
  const macosRef = useRef(false);

  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [showButtons, setShowButtons] = useState(false);
  const [activeVideo, setActiveVideo] = useState(1);
  const [error, setError] = useState<string | null>(null);

  /* ── NEW: annotation/connector state ── */
  const [deviceType, setDeviceType] = useState<DeviceType>("desktop");
  const [visibleAnnotations, setVisibleAnnotations] = useState<Set<number>>(
    new Set(),
  );
  const [connectors, setConnectors] = useState<ConnectorState[]>(
    CONFIG.TEXT_ANNOTATIONS.map(() => ({
      meshPt: { x: 0, y: 0, ok: false },
      cardPt: { x: 0, y: 0 },
    })),
  );
  const [anchorScreenPts, setAnchorScreenPts] = useState<ScreenPt[]>(
    CONFIG.TEXT_ANNOTATIONS.map(() => ({ x: 0, y: 0, ok: false })),
  );

  /* ==================== NEW: Wheel color change ==================== */
  const setWheelRed = useCallback((toRed: boolean) => {
    for (const mesh of wheelMeshesRef.current) {
      for (const mat of Array.isArray(mesh.material)
        ? mesh.material
        : [mesh.material]) {
        const m = mat as THREE.MeshStandardMaterial;
        const orig = wheelOriginalColorsRef.current.get(mat);
        if (!orig) continue;
        const tc = toRed
          ? new THREE.Color(CONFIG.WHEEL.ACTIVE_COLOR)
          : orig.color;
        const dur = CONFIG.WHEEL.TRANSITION_DURATION;
        if (m.color)
          gsap.to(m.color, {
            r: tc.r,
            g: tc.g,
            b: tc.b,
            duration: dur,
            ease: "power2.inOut",
            onUpdate: () => {
              m.needsUpdate = true;
            },
          });
        if (m.emissive) {
          const ec = toRed
            ? new THREE.Color(tc.r * 0.5, tc.g * 0.5, tc.b * 0.5)
            : (orig.emissive ?? new THREE.Color(0, 0, 0));
          gsap.to(m.emissive, {
            r: ec.r,
            g: ec.g,
            b: ec.b,
            duration: dur,
            ease: "power2.inOut",
          });
        }
        if (m.emissiveIntensity !== undefined)
          gsap.to(m, {
            emissiveIntensity: toRed
              ? 1
              : (orig.emissiveIntensity ?? 0),
            duration: dur,
            ease: "power2.inOut",
          });
      }
    }
  }, []);

  /* ==================== NEW: Setup helpers ==================== */
  const setupWheelMeshes = useCallback((model: THREE.Group) => {
    const meshes: THREE.Mesh[] = [];
    model.traverse((child) => {
      if (!(child as THREE.Mesh).isMesh) return;
      const mesh = child as THREE.Mesh;
      if (
        !CONFIG.WHEEL.MESH_NAMES.some(
          (n) => mesh.name.toLowerCase() === n.toLowerCase(),
        )
      )
        return;
      meshes.push(mesh);
      for (const mat of Array.isArray(mesh.material)
        ? mesh.material
        : [mesh.material]) {
        const m = mat as THREE.MeshStandardMaterial;
        wheelOriginalColorsRef.current.set(mat, {
          color: m.color?.clone() ?? new THREE.Color(0xffffff),
          emissive: m.emissive?.clone(),
          emissiveIntensity: m.emissiveIntensity,
        });
      }
    });
    wheelMeshesRef.current = meshes;
  }, []);

  const setupConnectorMeshes = useCallback((model: THREE.Group) => {
    const names = CONFIG.TEXT_ANNOTATIONS.map((a) => a.meshName);
    model.traverse((child) => {
      const lc = child.name.toLowerCase();
      names.forEach((name, idx) => {
        if (!connectorMeshRefs.current[idx] && lc === name.toLowerCase()) {
          connectorMeshRefs.current[idx] = child;
        }
      });
    });
  }, []);

  const setupAnnotationAnchors = useCallback((model: THREE.Group) => {
    CONFIG.ANNOTATION_ANCHOR_MESHES.forEach((anchorName, idx) => {
      model.traverse((child) => {
        if (
          !annotationAnchorRefs.current[idx] &&
          child.name.toLowerCase() === anchorName.toLowerCase()
        ) {
          child.visible = false;
          annotationAnchorRefs.current[idx] = child;
        }
      });
    });
  }, []);

  /* ==================== ORIGINAL: Scene / Renderer / Env ==================== */
  const initScene = useCallback(() => {
    const scene = new THREE.Scene();
    if (CONFIG.BACKGROUND.MODE === "image") {
      createImageBackground(
        scene,
        CONFIG.BACKGROUND.IMAGE.PATH,
        CONFIG.BACKGROUND.IMAGE.FIT,
      );
    } else {
      scene.background = new THREE.Color(CONFIG.BACKGROUND.COLOR);
    }
    if (CONFIG.SHADOW.ENABLED) {
      const dt = getDeviceType();
      const directionalLight = createShadowLights(scene, dt);
      directionalLightRef.current = directionalLight;
    }
    sceneRef.current = scene;
  }, []);

  const initRenderer = useCallback(() => {
    if (!canvasRef.current) return false;
    const { isIOS: iosDevice, deviceType: dt } = getDeviceInfo();
    safariRef.current = isSafari();
    iosRef.current = isIOS();
    macosRef.current = isMacOS();

    const pixelRatio = Math.min(
      window.devicePixelRatio,
      CONFIG.OPTIMIZATION.PIXEL_RATIO[dt],
    );
    try {
      const renderer = new THREE.WebGLRenderer({
        canvas: canvasRef.current,
        antialias: dt === "desktop",
        alpha: false,
        powerPreference: iosDevice ? "low-power" : "high-performance",
        preserveDrawingBuffer: iosDevice,
        failIfMajorPerformanceCaveat: false,
      });
      renderer.setPixelRatio(pixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = CONFIG.RENDERER.TONE_MAPPING_EXPOSURE;
      if (CONFIG.SHADOW.ENABLED) {
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      }
      rendererRef.current = renderer;
      return true;
    } catch (err) {
      console.error("Failed to initialize renderer:", err);
      setError("Failed to initialize 3D renderer");
      return false;
    }
  }, []);

  const loadEnvironment = useCallback(() => {
    if (!sceneRef.current || !rendererRef.current) return;
    const pmremGenerator = new THREE.PMREMGenerator(rendererRef.current);
    pmremGenerator.compileEquirectangularShader();
    const rgbeLoader = new RGBELoader();
    rgbeLoader.setCrossOrigin("anonymous");
    rgbeLoader.load(
      CONFIG.HDR.PATH,
      (hdr) => {
        const envMap = pmremGenerator.fromEquirectangular(hdr).texture;
        sceneRef.current!.environment = envMap;
        hdr.dispose();
        pmremGenerator.dispose();
      },
      undefined,
      (error) => {
        console.warn("HDR loading failed (non-critical):", error);
      },
    );
  }, []);

  const setupVideos = useCallback((model: THREE.Group) => {
    const videoTextures: {
      video: HTMLVideoElement;
      texture: THREE.VideoTexture;
    }[] = [];
    CONFIG.VIDEOS.forEach((videoConfig) => {
      const videoData = createVideoTexture(videoConfig.path);
      if (videoData) videoTextures.push(videoData);
    });
    videosRef.current = videoTextures;

    let screenFound = false;
    model.traverse((child) => {
      if (
        !screenFound &&
        (child.name
          .toLowerCase()
          .includes(CONFIG.SCREEN.MESH_NAME.toLowerCase()) ||
          (
            (child as THREE.Mesh).material as THREE.Material & {
              name?: string;
            }
          )?.name
            ?.toLowerCase()
            .includes(CONFIG.SCREEN.MATERIAL_NAME.toLowerCase()))
      ) {
        if ((child as THREE.Mesh).isMesh) {
          screenMeshRef.current = child as THREE.Mesh;
          screenFound = true;
        }
      }
    });

    if (screenFound && videoTextures.length > 0) {
      applyVideoToScreen(1);
    }
  }, []);

  const applyVideoToScreen = useCallback(
    (videoIndex: number) => {
      const videoData = videosRef.current[videoIndex - 1];
      const screenMesh = screenMeshRef.current;
      if (!videoData || !screenMesh) return;

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
      screenMesh.castShadow = false;
      screenMesh.receiveShadow = false;

      videoData.video.play().catch(() => {});
    },
    [],
  );

  const switchVideo = (videoIndex: number) => {
    setActiveVideo(videoIndex);
    applyVideoToScreen(videoIndex);
  };

  const createFallbackCamera = useCallback(() => {
    const dt = getDeviceType();
    const cameraConfig = CONFIG.CAMERA[dt];
    const cam = new THREE.PerspectiveCamera(
      cameraConfig.fov,
      window.innerWidth / window.innerHeight,
      0.1,
      1000,
    );
    cam.position.set(
      cameraConfig.position.x,
      cameraConfig.position.y,
      cameraConfig.position.z,
    );
    cam.lookAt(0, 0, 0);
    return cam;
  }, []);

  const updateModelScaleAndPosition = useCallback(() => {
    if (!modelRef.current) return;
    const dt = getDeviceType();
    currentDeviceTypeRef.current = dt;
    setDeviceType(dt);
    const targetScale = CONFIG.MODEL.SCALE[dt];
    modelRef.current.scale.set(targetScale, targetScale, targetScale);
    centerModel(modelRef.current, dt);
    updateShadowPlane(shadowPlaneRef.current, modelRef.current, dt);
    updateLightForDevice(directionalLightRef.current, modelRef.current, dt);
    if (cameraRef.current && originalCameraPositionRef.current) {
      let zoomMultiplier = 1.0;
      if (dt === "mobile") zoomMultiplier = 5.0;
      else if (dt === "tablet") zoomMultiplier = 3.0;
      cameraRef.current.position.z =
        originalCameraPositionRef.current.z * zoomMultiplier;
      cameraRef.current.aspect = window.innerWidth / window.innerHeight;
      cameraRef.current.updateProjectionMatrix();
    }
  }, []);

  /* ==================== LOAD MODEL ==================== */
  const loadModel = useCallback(() => {
    if (!sceneRef.current || !rendererRef.current) {
      setError("Scene not initialized");
      return;
    }
    const dt = getDeviceType();
    const loader = new GLTFLoader();
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath(
      "https://www.gstatic.com/draco/versioned/decoders/1.5.6/",
    );
    dracoLoader.setDecoderConfig({ type: "js" });
    loader.setDRACOLoader(dracoLoader);

    loader.load(
      CONFIG.MODEL.PATH,
      (gltf) => {
        const model = gltf.scene;
        modelRef.current = model;

        optimizeModel(model, dt);

        if (gltf.cameras && gltf.cameras.length > 0) {
          const glbCamera = gltf.cameras[0];
          if (glbCamera instanceof THREE.PerspectiveCamera) {
            currentDeviceTypeRef.current = dt;
            originalCameraPositionRef.current = glbCamera.position.clone();
            let targetFOV = glbCamera.fov;
            if (dt === "mobile") targetFOV = 70;
            else if (dt === "tablet") targetFOV = 50;
            else targetFOV = Math.min(glbCamera.fov, 75);
            glbCamera.fov = targetFOV;
            glbCamera.aspect = window.innerWidth / window.innerHeight;
            glbCamera.near = 0.1;
            glbCamera.far = 1000;
            let zoomMultiplier = 1.0;
            if (dt === "mobile") zoomMultiplier = 2.0;
            else if (dt === "tablet") zoomMultiplier = 1.5;
            glbCamera.position.z =
              originalCameraPositionRef.current.z * zoomMultiplier;
            glbCamera.updateProjectionMatrix();
            cameraRef.current = glbCamera;
          } else {
            cameraRef.current = createFallbackCamera();
          }
        } else {
          cameraRef.current = createFallbackCamera();
        }

        currentDeviceTypeRef.current = dt;
        setDeviceType(dt);

        model.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            const isVideoScreen =
              child.name
                .toLowerCase()
                .includes(CONFIG.SCREEN.MESH_NAME.toLowerCase()) ||
              (
                (mesh.material as THREE.Material & { name?: string })
                  ?.name
              )
                ?.toLowerCase()
                .includes(CONFIG.SCREEN.MATERIAL_NAME.toLowerCase());
            if (isVideoScreen) {
              screenMeshRef.current = mesh;
              mesh.castShadow = false;
              mesh.receiveShadow = false;
            } else {
              mesh.castShadow = true;
              mesh.receiveShadow = true;
            }
          }
        });

        const targetScale = CONFIG.MODEL.SCALE[dt];
        model.scale.set(targetScale, targetScale, targetScale);
        const { box } = centerModel(model, dt);

        if (CONFIG.SHADOW.ENABLED && sceneRef.current) {
          const shadowPlane = createShadowPlane(
            sceneRef.current,
            box.min.y - 0.001,
            dt,
          );
          shadowPlaneRef.current = shadowPlane;
          updateShadowPlane(shadowPlane, model, dt);
          updateLightForDevice(directionalLightRef.current, model, dt);
        }

        sceneRef.current!.add(model);
        setupVideos(model);

        /* ── NEW: setup wheel, connectors, anchors ── */
        setupWheelMeshes(model);
        setupConnectorMeshes(model);
        setupAnnotationAnchors(model);

        if (gltf.animations.length > 0) {
          const mixer = new THREE.AnimationMixer(model);
          const action = mixer.clipAction(gltf.animations[0]);
          action.play();
          action.paused = true;
          mixerRef.current = mixer;
          actionRef.current = action;
        }

        dracoLoader.dispose();
        setLoading(false);
        ScrollTrigger.refresh();
      },
      (progress) => {
        if (progress.total > 0) {
          const percent = Math.round(
            (progress.loaded / progress.total) * 100,
          );
          setLoadingProgress(percent);
        }
      },
      (error) => {
        console.error("Error loading model:", error);
        setError("Failed to load 3D model");
        setLoading(false);
      },
    );
  }, [
    setupVideos,
    createFallbackCamera,
    setupWheelMeshes,
    setupConnectorMeshes,
    setupAnnotationAnchors,
  ]);

  /* ==================== ORIGINAL: ScrollTrigger (continuous scrub) ==================== */
  useEffect(() => {
    if (loading) return;

    if (scrollTriggerRef.current) scrollTriggerRef.current.kill();

    scrollTriggerRef.current = ScrollTrigger.create({
      trigger: document.body,
      start: "top top",
      end: "bottom bottom",
      scrub: CONFIG.ANIMATION.SCRUB,
      onUpdate: (self) => {
        targetFrame.current = self.progress * CONFIG.TOTAL_FRAMES;
        const scrollPercent = self.progress * 100;
        if (
          scrollPercent >= CONFIG.ANIMATION_COMPLETE_THRESHOLD &&
          !showButtons
        ) {
          setShowButtons(true);
        } else if (
          scrollPercent < CONFIG.ANIMATION_COMPLETE_THRESHOLD &&
          showButtons
        ) {
          setShowButtons(false);
        }
      },
    });

    return () => {
      if (scrollTriggerRef.current) scrollTriggerRef.current.kill();
    };
  }, [loading, showButtons]);

  /* ==================== RENDER LOOP ==================== */
  useEffect(() => {
    let animationFrameId: number;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      if (!rendererRef.current || !sceneRef.current || !cameraRef.current)
        return;

      // ── ORIGINAL: lerp-based smooth frame interpolation ──
      currentFrame.current = lerp(
        currentFrame.current,
        targetFrame.current,
        CONFIG.ANIMATION.LERP_FACTOR,
      );

      const frame = currentFrame.current;

      // ── ORIGINAL: animation mixer ──
      if (mixerRef.current && actionRef.current) {
        const clip = actionRef.current.getClip();
        actionRef.current.time =
          (frame / CONFIG.TOTAL_FRAMES) * clip.duration;
        mixerRef.current.update(0);
      }

      // ── ORIGINAL: video texture update ──
      const activeVideoData = videosRef.current[activeVideo - 1];
      if (activeVideoData) {
        activeVideoData.texture.needsUpdate = true;
      }

      // ── ORIGINAL: shadow tracking ──
      if (
        modelRef.current &&
        shadowPlaneRef.current &&
        directionalLightRef.current
      ) {
        const box = new THREE.Box3().setFromObject(modelRef.current);
        const center = box.getCenter(new THREE.Vector3());
        const dt = currentDeviceTypeRef.current;
        const shadowConfig = getShadowConfig(dt);

        shadowPlaneRef.current.position.x = lerp(
          shadowPlaneRef.current.position.x,
          center.x,
          0.1,
        );
        shadowPlaneRef.current.position.z = lerp(
          shadowPlaneRef.current.position.z,
          center.z,
          0.1,
        );
        shadowPlaneRef.current.position.y = box.min.y - 0.001;

        directionalLightRef.current.position.x = lerp(
          directionalLightRef.current.position.x,
          center.x + shadowConfig.CAMERA_BOUNDS * 0.5,
          0.1,
        );
        directionalLightRef.current.position.z = lerp(
          directionalLightRef.current.position.z,
          center.z + shadowConfig.CAMERA_BOUNDS * 0.5,
          0.1,
        );
        directionalLightRef.current.target.position.set(
          center.x,
          center.y,
          center.z,
        );
        directionalLightRef.current.target.updateMatrixWorld();
      }

      // ── NEW: wheel color change based on frame ──
      let red = false;
      for (const a of CONFIG.TEXT_ANNOTATIONS) {
        if (
          frame >= a.frameStart &&
          frame <= a.frameEnd &&
          (a as any).triggerWheelColorChange
        ) {
          red = true;
          break;
        }
      }
      if (red !== isWheelRedRef.current) {
        setWheelRed(red);
        isWheelRedRef.current = red;
      }

      // ── NEW: annotation visibility based on frame ──
      const nextVisible = new Set<number>();
      for (const a of CONFIG.TEXT_ANNOTATIONS) {
        if (frame >= a.frameStart && frame <= a.frameEnd) {
          nextVisible.add(a.id);
        }
      }
      setVisibleAnnotations((prev) => {
        if (prev.size !== nextVisible.size) return nextVisible;
        for (const id of nextVisible) {
          if (!prev.has(id)) return nextVisible;
        }
        return prev;
      });

      // ── NEW: connector + anchor projection ──
      const cam = cameraRef.current;

      setConnectors((prev) => {
        let dirty = false;
        const next: ConnectorState[] = prev.map((c, i) => {
          const ann = CONFIG.TEXT_ANNOTATIONS[i];
          const inRange = frame >= ann.frameStart && frame <= ann.frameEnd;
          if (!inRange) {
            if (!c.meshPt.ok) return c;
            dirty = true;
            return { ...c, meshPt: { ...c.meshPt, ok: false } };
          }
          const meshObj =
            i === 1
              ? (connectorMeshRefs.current[i] ?? screenMeshRef.current)
              : connectorMeshRefs.current[i];
          if (!meshObj) return c;
          const projected =
            i === 1
              ? toScreenBottomCenter(meshObj, cam)
              : toScreen(meshObj, cam);
          if (!projected) {
            if (!c.meshPt.ok) return c;
            dirty = true;
            return { ...c, meshPt: { ...c.meshPt, ok: false } };
          }
          const cardEl = annCardRefs.current[i];
          let ax = c.cardPt.x;
          let ay = c.cardPt.y;
          if (cardEl) {
            const rect = cardEl.getBoundingClientRect();
            ax = rect.left + rect.width / 2;
            ay = rect.top;
          }
          if (
            c.meshPt.ok &&
            Math.abs(c.meshPt.x - projected.x) < 0.5 &&
            Math.abs(c.meshPt.y - projected.y) < 0.5 &&
            Math.abs(c.cardPt.x - ax) < 0.5 &&
            Math.abs(c.cardPt.y - ay) < 0.5
          )
            return c;
          dirty = true;
          return {
            meshPt: { x: projected.x, y: projected.y, ok: true },
            cardPt: { x: ax, y: ay },
          };
        });
        return dirty ? next : prev;
      });

      setAnchorScreenPts((prev) => {
        let dirty = false;
        const next: ScreenPt[] = prev.map((pt, i) => {
          const ann = CONFIG.TEXT_ANNOTATIONS[i];
          const anchorObj = annotationAnchorRefs.current[i];
          const inRange = frame >= ann.frameStart && frame <= ann.frameEnd;
          if (!inRange || !anchorObj) {
            if (!pt.ok) return pt;
            dirty = true;
            return { x: pt.x, y: pt.y, ok: false };
          }
          const projected = toScreen(anchorObj, cam);
          if (!projected) {
            if (!pt.ok) return pt;
            dirty = true;
            return { x: pt.x, y: pt.y, ok: false };
          }
          if (
            pt.ok &&
            Math.abs(pt.x - projected.x) < 1 &&
            Math.abs(pt.y - projected.y) < 1
          )
            return pt;
          dirty = true;
          return { x: projected.x, y: projected.y, ok: true };
        });
        return dirty ? next : prev;
      });

      rendererRef.current.render(sceneRef.current, cameraRef.current);
    };

    animate();
    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [activeVideo, setWheelRed]);

  /* ==================== INIT ==================== */
  useEffect(() => {
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;

    initScene();
    if (!initRenderer()) return;
    loadEnvironment();
    loadModel();

    const onResize = () => {
      if (!rendererRef.current || !cameraRef.current) return;
      const newDeviceType = getDeviceType();
      const deviceChanged =
        currentDeviceTypeRef.current !== newDeviceType;

      if (deviceChanged) {
        currentDeviceTypeRef.current = newDeviceType;
        setDeviceType(newDeviceType);
        if (cameraRef.current instanceof THREE.PerspectiveCamera) {
          let targetFOV = 75;
          if (newDeviceType === "mobile") targetFOV = 20;
          else if (newDeviceType === "tablet") targetFOV = 30;
          cameraRef.current.fov = targetFOV;
        }
        if (modelRef.current) {
          updateShadowPlane(
            shadowPlaneRef.current,
            modelRef.current,
            newDeviceType,
          );
          updateLightForDevice(
            directionalLightRef.current,
            modelRef.current,
            newDeviceType,
          );
        }
      }

      cameraRef.current.aspect = window.innerWidth / window.innerHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(window.innerWidth, window.innerHeight);

      const pixelRatio = Math.min(
        window.devicePixelRatio,
        CONFIG.OPTIMIZATION.PIXEL_RATIO[newDeviceType],
      );
      rendererRef.current.setPixelRatio(pixelRatio);

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
        if (v.video.parentNode) v.video.parentNode.removeChild(v.video);
      });
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
      if (modelRef.current) disposeModel(modelRef.current);
      if (rendererRef.current) rendererRef.current.dispose();
      wheelMeshesRef.current = [];
      wheelOriginalColorsRef.current.clear();
      connectorMeshRefs.current = [null, null];
      annotationAnchorRefs.current = [null, null];
    };
  }, [
    initScene,
    initRenderer,
    loadEnvironment,
    loadModel,
    updateModelScaleAndPosition,
  ]);

  /* ── Annotation elements ── */
  const annotationElements = useMemo(
    () =>
      CONFIG.TEXT_ANNOTATIONS.map((a, i) => {
        const isDesktop = deviceType === "desktop";
        const isVisible = isDesktop
          ? anchorScreenPts[i]?.ok === true && visibleAnnotations.has(a.id)
          : visibleAnnotations.has(a.id);
        return (
          <TextAnnotation
            key={a.id}
            annotation={a}
            isVisible={isVisible}
            deviceType={deviceType}
            cardRef={(el) => {
              annCardRefs.current[i] = el;
            }}
            anchorScreenPt={anchorScreenPts[i]}
          />
        );
      }),
    [visibleAnnotations, deviceType, anchorScreenPts],
  );

  /* ==================== RENDER ==================== */
  return (
    <div className="relative h-[1150vh]">
      <div className="fixed inset-0 w-full h-full">
        <canvas ref={canvasRef} className="w-full h-full" />
      </div>

      {/* Connector lines (mobile / tablet) */}
      {CONFIG.TEXT_ANNOTATIONS.map((a, i) => (
        <ConnectorLine
          key={a.id}
          meshPt={connectors[i].meshPt}
          cardPt={connectors[i].cardPt}
          visible={visibleAnnotations.has(a.id)}
          deviceType={deviceType}
        />
      ))}

      {/* Annotation cards with growing lines */}
      {annotationElements}

      {/* Loading */}
      {loading && !error && (
        <div className="fixed inset-0 flex flex-col items-center justify-center z-50 bg-black/90">
          <div className="text-white text-xl mb-4">
            Loading 3D Model...
          </div>
          <div className="w-64 h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-sky-500 transition-all duration-300"
              style={{ width: `${loadingProgress}%` }}
            />
          </div>
          <div className="text-gray-400 text-sm mt-2">
            {loadingProgress}%
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="fixed inset-0 flex flex-col items-center justify-center z-50 bg-black/90 p-4">
          <div className="text-red-500 text-xl max-w-md text-center mb-4">
            ❌ {error}
          </div>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition"
          >
            Retry
          </button>
        </div>
      )}

      {/* Video switcher */}
      {showButtons && !loading && !error && (
        <div className="fixed top-4 md:top-5 left-0 right-0 z-[9999] px-2 md:px-0 pointer-events-none">
          <div className="max-w-7xl mx-auto flex justify-center pointer-events-auto">
            <div
              className="rounded-xl md:rounded-2xl p-2 md:p-3 w-full md:w-auto"
              style={{
                background: "rgba(0,0,0,0.9)",
                backdropFilter: "blur(16px)",
                WebkitBackdropFilter: "blur(16px)",
                border: "1px solid rgba(139,92,246,0.3)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
              }}
            >
              <div className="flex justify-center items-stretch md:items-center gap-2 md:gap-3">
                {CONFIG.VIDEOS.map((video) => (
                  <button
                    key={video.id}
                    onClick={() => switchVideo(video.id)}
                    className={`px-2 py-1 md:px-5 md:py-2.5 rounded-lg md:rounded-xl font-medium text-sm md:text-base transition-all duration-300 transform active:scale-95 ${
                      activeVideo === video.id
                        ? "bg-sky-500 text-white shadow-lg shadow-sky-500/50 scale-105"
                        : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                    }`}
                  >
                    <span className="whitespace-nowrap">
                      {video.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}