"use client";

import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";
import gsap from "gsap";

/* ==================== SAFARI DETECTION ==================== */
const isSafari = (): boolean => {
  if (typeof window === "undefined") return false;
  return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
};
const isIOS = (): boolean => {
  if (typeof window === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
};

/* ==================== CONFIG ==================== */
const CONFIG = {
  TOTAL_FRAMES: 130,
  MODEL: {
    PATH: "https://s3.us-east-1.amazonaws.com/sportstech.team/dev_assets/Sbike10.glb",
    SCALE: { sm: 0.04, md: 0.06, lg: 0.4, xl: 1.0 },
    MOBILE_POSITION: { y: -1.5, x: 0, z: 0 },
    TABLET_POSITION: { y: -1.8, x: 0, z: 0 },
    LAPTOP_POSITION: { y: -1.0, x: 0, z: 0 },
    DESKTOP_POSITION: { y: 1.0, x: 0, z: 0 },
  },
  HDR: {
    PATH: "https://360-product-view.s3.eu-north-1.amazonaws.com/Product-360-View/models/hdr/lightroom-4.hdr",
  },
  VIDEOS: [
    { id: 1, name: "Workout", path: "https://s3.us-east-1.amazonaws.com/sportstech.team/dev_assets/sBike-Trainer.mp4" },
    { id: 2, name: "Landscape video", path: "https://s3.us-east-1.amazonaws.com/sportstech.team/dev_assets/sBike-Landscape.mp4" },
    { id: 3, name: "Gaming", path: "https://s3.us-east-1.amazonaws.com/sportstech.team/dev_assets/sBike-Gaming.mp4" },
  ],
  SCREEN: { MESH_NAME: "Screen", MATERIAL_NAME: "screen" },
  WHEEL: {
    MESH_NAMES: ["Wheel", "LOGO"],
    ACTIVE_COLOR: 0xdc2626,
    TRANSITION_DURATION: 1.0,
  },
  RENDERER: { MAX_PIXEL_RATIO: 2, TONE_MAPPING_EXPOSURE: 0.8 },
  BACKGROUND: { COLOR: 0xffffff },
  SECTION_DURATION: 1.2,

  /**
   * TEXT_ANNOTATIONS
   * ─ `meshName`     : exact (case-insensitive) mesh name for connector origin
   * ─ `position`     : desktop pixel coords (lg / xl) — unchanged
   * ─ `mobileLayout` : pixel margins only for sm  (top / left / right)
   * ─ `tabletLayout` : pixel margins only for md  (top / left / right)
   *
   * Cards are positioned with `position: fixed` + margin offsets.
   * No flex alignment is used on mobile/tablet.
   */
  TEXT_ANNOTATIONS: [
    {
      id: 1, frameStart: 20, frameEnd: 30, stopFrame: 20,
      position: { lg: { top: 350, left: 800 }, xl: { top: 450, left: 1000 } },
      mobileLayout: { top: 80, bottom: "auto", left: "auto", right: "30%", marginTop: 0, marginBottom: 50 },
      tabletLayout: { top: "auto", bottom: "auto", left: "auto", right: 10, marginTop: 0, marginBottom: 50 },
      title: "Dynamic LED Lights",
      text: "Color-changing LEDs respond to your speed that enhances focus and energy.",
      src: "https://s3.us-east-1.amazonaws.com/sportstech.team/dev_assets/incandescent-light-bulb-svgrepo-com 1.svg",
      meshName: "Wheel",
      triggerWheelColorChange: true,
    },
    {
      id: 2, frameStart: 50, frameEnd: 53, stopFrame: 50,
      position: { lg: { top: 320, left: 890 }, xl: { top: 400, left: 1155 } },
      mobileLayout: { top: "auto", bottom: "auto", left: "auto", right: 90, marginTop: 0, marginBottom: 0 },
      tabletLayout: { top: "auto", bottom: "auto", left: "auto", right: 10, marginTop: 0, marginBottom: 0 },
      title: "Seat Adjustment",
      text: "Quick, smooth adjustments for maximum comfort and personalized fit.",
      src: "https://s3.us-east-1.amazonaws.com/sportstech.team/dev_assets/sit_13792655.svg",
      meshName: "seat",
    },
    {
      id: 3, frameStart: 74, frameEnd: 81, stopFrame: 74,
      position: { lg: { top: 330, left: 320 }, xl: { top: 400, left: 520 } },
      mobileLayout: { top: "60%", bottom: "auto", left: 85, right: "auto", marginTop: 0, marginBottom: 0 },
      tabletLayout: { top: "auto", bottom: "auto", left: 50, right: "auto", marginTop: 0, marginBottom: 0 },
      title: "Auto Resistance",
      text: "Smart automatic resistance adapts to your workout intensity.",
      src: "https://s3.us-east-1.amazonaws.com/sportstech.team/dev_assets/resistanceknob.svg",
      meshName: "Speed",
    },
    {
      id: 4, frameStart: 110, frameEnd: 115, stopFrame: 115,
      position: { lg: { top: 240, left: 350 }, xl: { top: 280, left: 455 } },
      mobileLayout: { top: "70%", bottom: "auto", left: 10, right: "auto", marginTop: 0, marginBottom: 0 },
      tabletLayout: { top: "auto", bottom: "auto", left: 0, right: "auto", marginTop: 0, marginBottom: 0 },
      title: "21.5 Display",
      text: "Crystal-clear, interactive display for tracking progress and staying motivated.",
      src: "https://s3.us-east-1.amazonaws.com/sportstech.team/dev_assets/square_3942733.svg",
      meshName: "Display",
    },
  ],
} as const;

const STOP_FRAMES = [0, ...CONFIG.TEXT_ANNOTATIONS.map(a => a.stopFrame), CONFIG.TOTAL_FRAMES];

/* ==================== TYPES ==================== */
type DeviceType = "sm" | "md" | "lg" | "xl";
interface StoredMaterialColors {
  color: THREE.Color;
  emissive?: THREE.Color;
  emissiveIntensity?: number;
}
interface ScreenPt { x: number; y: number; ok: boolean; }
interface ConnectorState { meshPt: ScreenPt; cardPt: { x: number; y: number }; }

/* ==================== HELPERS ==================== */
const isMobileDevice = (dt: DeviceType): boolean => dt === "sm";

const getDeviceType = (): DeviceType => {
  if (typeof window === "undefined") return "xl";
  const w = window.innerWidth;
  if (w < 1024) return "sm";
  if (w < 1280) return "md";
  if (w < 1600) return "lg";
  return "xl";
};

const centerModel = (model: THREE.Group, dt: DeviceType) => {
  const box = new THREE.Box3().setFromObject(model);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const pos =
    dt === "sm" ? CONFIG.MODEL.MOBILE_POSITION :
      dt === "md" ? CONFIG.MODEL.TABLET_POSITION :
        dt === "lg" ? CONFIG.MODEL.LAPTOP_POSITION :
          CONFIG.MODEL.DESKTOP_POSITION;
  model.position.set(pos.x - center.x, pos.y - size.y / 2, pos.z - center.z);
};

const optimizeTexture = (tex: THREE.Texture, renderer: THREE.WebGLRenderer) => {
  tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.generateMipmaps = true;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
};

const optimizeMaterial = (mat: THREE.Material, renderer: THREE.WebGLRenderer, isVideo = false) => {
  if (!mat) return;
  const m = mat as any;
  if (!isVideo && m.map) optimizeTexture(m.map, renderer);
  if (m.isMeshStandardMaterial || m.isMeshPhysicalMaterial) {
    m.envMapIntensity = isVideo ? 0 : 1.5;
    m.roughness = m.roughness ?? 0.4;
    m.metalness = m.metalness ?? 0.5;
  }
  m.side = THREE.FrontSide;
  m.needsUpdate = true;
};

const createVideoTexture = (path: string) => {
  try {
    const video = document.createElement("video");
    video.setAttribute("playsinline", "");
    video.setAttribute("webkit-playsinline", "");
    video.setAttribute("preload", "metadata");
    video.src = path; video.crossOrigin = "anonymous";
    video.loop = true; video.muted = true; video.autoplay = false; video.playsInline = true;
    (video as any).disablePictureInPicture = true;
    (video as any).disableRemotePlayback = true;
    const texture = new THREE.VideoTexture(video);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.format = THREE.RGBFormat;
    texture.flipY = false;
    return { video, texture };
  } catch { return null; }
};

const toScreen = (obj: THREE.Object3D, cam: THREE.PerspectiveCamera): { x: number; y: number } | null => {
  const wp = new THREE.Vector3();
  obj.getWorldPosition(wp);
  wp.project(cam);
  if (wp.z > 1) return null;
  return {
    x: (wp.x * 0.5 + 0.5) * window.innerWidth,
    y: (-wp.y * 0.5 + 0.5) * window.innerHeight,
  };
};

/* ==================== PRELOADER ==================== */
interface PreloaderProps { progress: number; visible: boolean; }
const Preloader: React.FC<PreloaderProps> = ({ progress, visible }) => {
  const p = Math.min(100, Math.max(0, progress));
  const c = 2 * Math.PI * 54;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#fff", opacity: visible ? 1 : 0, pointerEvents: visible ? "all" : "none", WebkitTransition: "opacity 0.7s cubic-bezier(0.4,0,0.2,1)", transition: "opacity 0.7s cubic-bezier(0.4,0,0.2,1)" }}>
      <div style={{ position: "absolute", inset: 0, backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`, backgroundRepeat: "repeat", backgroundSize: "128px", opacity: 0.6, pointerEvents: "none" }} />
      <div style={{ position: "relative", width: 140, height: 140 }}>
        <svg width="140" height="140" style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }}>
          <circle cx="70" cy="70" r="54" fill="none" stroke="#f0f0f0" strokeWidth="5" />
          <circle cx="70" cy="70" r="54" fill="none" stroke="#dc2626" strokeWidth="5" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c - (p / 100) * c} style={{ transition: "stroke-dashoffset 0.3s ease-out" }} />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
          <span style={{ fontFamily: "'DM Mono','Courier New',monospace", fontSize: "28px", fontWeight: 700, color: "#111", letterSpacing: "-1px", lineHeight: 1 }}>{Math.round(p)}</span>
          <span style={{ fontFamily: "'DM Mono','Courier New',monospace", fontSize: "11px", color: "#999", letterSpacing: "0.1em", marginTop: 2 }}>%</span>
        </div>
      </div>
      <div style={{ marginTop: 28, textAlign: "center" }}>
        <p style={{ fontFamily: "'DM Mono','Courier New',monospace", fontSize: "11px", letterSpacing: "0.25em", color: "#dc2626", textTransform: "uppercase", marginBottom: 6 }}>sBike</p>
        <p style={{ fontFamily: "'DM Mono','Courier New',monospace", fontSize: "11px", letterSpacing: "0.12em", color: "#aaa", textTransform: "uppercase" }}>{p < 100 ? "Loading 3D experience…" : "Preparing scene…"}</p>
      </div>
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 3, background: "#f0f0f0" }}>
        <div style={{ height: "100%", width: `${p}%`, background: "linear-gradient(90deg,#dc2626,#ef4444)", transition: "width 0.3s ease-out", borderRadius: "0 2px 2px 0" }} />
      </div>
    </div>
  );
};

/* ==================== CONNECTOR LINE ==================== */
interface ConnectorLineProps {
  meshPt: ScreenPt;
  cardPt: { x: number; y: number };
  visible: boolean;
  deviceType: DeviceType;
}
const ConnectorLine: React.FC<ConnectorLineProps> = React.memo(({ meshPt, cardPt, visible, deviceType }) => {
  if (deviceType === "lg" || deviceType === "xl") return null;
  if (!meshPt.ok) return null;
  const { x: x1, y: y1 } = meshPt;
  const { x: x2, y: y2 } = cardPt;
  return (
    <svg
      style={{
        position: "fixed", inset: 0,
        width: "100%", height: "100%",
        pointerEvents: "none",
        zIndex: 49,
        opacity: visible ? 1 : 0,
        transition: "opacity 0.35s ease-out",
        overflow: "visible",
      }}
    >
     
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#707070" strokeWidth="1.5" strokeLinecap="round" filter="url(#cg)" />
      <circle cx={x1} cy={y1} r="4.5" fill="#707070" filter="url(#cg)" />
      <circle cx={x1} cy={y1} r="7" fill="none" stroke="#707070" strokeWidth="1" opacity="0.4" />
    </svg>
  );
});
ConnectorLine.displayName = "ConnectorLine";

/* ==================== TEXT ANNOTATIONS ==================== */
interface TextAnnotationProps {
  annotation: (typeof CONFIG.TEXT_ANNOTATIONS)[number];
  isVisible: boolean;
  deviceType: DeviceType;
  cardRef?: React.RefCallback<HTMLDivElement>;
}

/**
 * Mobile / tablet card — positioned with `position: fixed` + margin only.
 * No flex wrapper, no alignSelf. Just left/right/top/bottom offsets on the
 * card itself so you can move it freely by editing mobileLayout / tabletLayout.
 */
const TextAnnotationMobile: React.FC<TextAnnotationProps> = React.memo(({ annotation, isVisible, deviceType, cardRef }) => {
  const layout = deviceType === "sm" ? annotation.mobileLayout : annotation.tabletLayout;
  const cardW = deviceType === "sm" ? 208 : 256;

  // Build the position style from whichever sides have numeric values
  const posStyle: React.CSSProperties = {
    position: "fixed",
    // Vertical: default to vertically centered via top:50% + translateY(-50%)
    top: layout.top !== "auto" ? layout.top : "20%",
    bottom: layout.bottom !== "auto" ? layout.bottom : "auto",
    // Horizontal: left / right edge
    left: layout.left !== "auto" ? (layout.left as number) : "auto",
    right: layout.right !== "auto" ? (layout.right as number) : "auto",
    // Vertical nudge via margins (positive = down, negative = up)
    marginTop: (layout as any).marginTop ?? 0,
    marginBottom: (layout as any).marginBottom ?? 0,
  };

  // When top is "auto" (i.e. we're using 50%), apply -50% translateY to truly
  // center the card. This is combined with the visibility translateY below.
  const isCenteredVertically = layout.top === "auto" && layout.bottom === "auto";

  return (
    <div
      ref={cardRef}
      style={{
        ...posStyle,
        pointerEvents: "none",
        zIndex: 50,
        // Translate: center vertically if needed, plus fade-in nudge
        transform: isCenteredVertically
          ? isVisible ? "translateY(-50%)" : "translateY(calc(-50% + 10px))"
          : isVisible ? "translateY(0)" : "translateY(10px)",
        WebkitTransform: isCenteredVertically
          ? isVisible ? "translateY(-50%)" : "translateY(calc(-50% + 10px))"
          : isVisible ? "translateY(0)" : "translateY(10px)",
        opacity: isVisible ? 1 : 0,
        transition: "opacity 0.3s ease-out, transform 0.3s ease-out",
        WebkitTransition: "opacity 0.3s ease-out, -webkit-transform 0.3s ease-out",
        willChange: "opacity, transform",
      }}
    >
      <div
        className="rounded-2xl"
        style={{
          width: cardW,
          boxShadow: "0 8px 32px rgba(0,0,0,0.18),0 2px 8px rgba(0,0,0,0.12),inset 0 1px 0 rgba(255,255,255,0.6)",
        }}
      >
        <div
          className="rounded-2xl p-3 flex flex-col gap-1.5"
          style={{
            background: "linear-gradient(135deg,rgba(255,255,255,0.72) 0%,rgba(255,255,255,0.48) 100%)",
            WebkitBackdropFilter: "blur(20px) saturate(180%)",
            backdropFilter: "blur(20px) saturate(180%)",
            border: "1px solid rgba(255,255,255,0.55)",
            borderTop: "1px solid rgba(255,255,255,0.80)",
            borderLeft: "1px solid rgba(255,255,255,0.80)",
            boxShadow: "inset 0 1px 1px rgba(255,255,255,0.90)",
            isolation: "isolate",
          }}
        >
          <div className="flex justify-start items-center gap-2">
            <img src={annotation.src} alt={annotation.title} className="rounded-lg w-10 h-10 object-contain" draggable={false} />
            <h3 className="text-xs font-bold font-mono text-gray-900 leading-snug">{annotation.title}</h3>
          </div>
          <p className="text-gray-600 text-[10px] font-mono leading-relaxed font-semibold">{annotation.text}</p>
        </div>
      </div>
    </div>
  );
});
TextAnnotationMobile.displayName = "TextAnnotationMobile";

/** Desktop card — fixed pixel top/left, unchanged. */
const TextAnnotationDesktop: React.FC<TextAnnotationProps> = React.memo(({ annotation, isVisible, deviceType, cardRef }) => {
  const pos = annotation.position[deviceType as "lg" | "xl"];
  return (
    <div
      ref={cardRef}
      className="fixed pointer-events-none z-50"
      style={{
        top: `${pos.top}px`,
        left: `${pos.left}px`,
        opacity: isVisible ? 1 : 0,
        WebkitTransform: isVisible ? "translateY(0)" : "translateY(10px)",
        transform: isVisible ? "translateY(0)" : "translateY(10px)",
        WebkitTransition: "opacity 0.3s ease-out,-webkit-transform 0.3s ease-out",
        transition: "opacity 0.3s ease-out,transform 0.3s ease-out",
        willChange: "opacity,transform",
      }}
    >
      <div className="rounded-xl p-3 md:p-4 lg:p-5 w-56 sm:w-64 md:w-72 lg:w-80 flex flex-col">
        <img src={annotation.src} alt={annotation.title} className="mb-2 rounded-lg w-12" draggable={false} />
        <h3 className="text-xs sm:text-base md:text-lg font-bold font-mono text-gray-900 mb-2">{annotation.title}</h3>
        <p className="text-gray-700 text-xs md:text-sm font-mono leading-relaxed">{annotation.text}</p>
      </div>
    </div>
  );
});
TextAnnotationDesktop.displayName = "TextAnnotationDesktop";

const TextAnnotation: React.FC<TextAnnotationProps> = (props) => {
  if (props.deviceType === "sm" || props.deviceType === "md") return <TextAnnotationMobile {...props} />;
  return <TextAnnotationDesktop {...props} />;
};

/* ==================== MAIN COMPONENT ==================== */
export default function Scroll3DCanva() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const groundRef = useRef<THREE.Mesh | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const actionRef = useRef<THREE.AnimationAction | null>(null);
  const modelRef = useRef<THREE.Group | null>(null);
  const dtRef = useRef<DeviceType>("xl");
  const origCamZRef = useRef(0);

  const wheelMeshesRef = useRef<THREE.Mesh[]>([]);
  const wheelOriginalColorsRef = useRef<Map<THREE.Material, StoredMaterialColors>>(new Map());
  const isWheelRedRef = useRef(false);

  const videosRef = useRef<{ video: HTMLVideoElement; texture: THREE.VideoTexture }[]>([]);
  const screenMeshRef = useRef<THREE.Mesh | null>(null);
  const activeVideoRef = useRef(1);

  const pop01MeshRef = useRef<THREE.Object3D | null>(null);
  const connectorMeshRefs = useRef<(THREE.Object3D | null)[]>([null, null, null, null]);
  const annCardRefs = useRef<(HTMLDivElement | null)[]>([null, null, null, null]);

  const hasUserInteractedRef = useRef(false);
  const pendingVideoIdxRef = useRef<number | null>(null);

  const gsapFrameObj = useRef({ value: 0 });
  const renderFrameRef = useRef(0);
  const tweenRef = useRef<gsap.core.Tween | null>(null);
  const sectionRef = useRef(0);
  const targetSectionRef = useRef(0);
  const isTweeningRef = useRef(false);
  const cooldownRef = useRef(false);
  const cooldownTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initializedRef = useRef(false);
  const safariRef = useRef(false);
  const iosRef = useRef(false);

  const [loadProgress, setLoadProgress] = useState(0);
  const [preloaderVisible, setPreloaderVisible] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showButtons, setShowButtons] = useState(false);
  const [activeVideo, setActiveVideo] = useState(1);
  const [deviceType, setDeviceType] = useState<DeviceType>("xl");
  const [visibleAnnotations, setVisibleAnnotations] = useState<Set<number>>(new Set());
  const [currentSection, setCurrentSection] = useState(0);

  const [connectors, setConnectors] = useState<ConnectorState[]>(
    CONFIG.TEXT_ANNOTATIONS.map(() => ({
      meshPt: { x: 0, y: 0, ok: false },
      cardPt: { x: 0, y: 0 },
    }))
  );

  const updatePop01Visibility = useCallback((dt: DeviceType) => {
    if (pop01MeshRef.current) pop01MeshRef.current.visible = isMobileDevice(dt);
  }, []);

  const prevAnnotationsRef = useRef<number[]>([]);
  const updateAnnotations = useCallback((frame: number) => {
    const next: number[] = [];
    for (const a of CONFIG.TEXT_ANNOTATIONS)
      if (frame >= a.frameStart && frame <= a.frameEnd) next.push(a.id);
    const prev = prevAnnotationsRef.current;
    if (next.length !== prev.length || next.some((v, i) => v !== prev[i])) {
      prevAnnotationsRef.current = next;
      setVisibleAnnotations(new Set(next));
    }
    if (frame >= CONFIG.TOTAL_FRAMES - 1) setShowButtons(true);
    else if (frame < CONFIG.TOTAL_FRAMES - 10) setShowButtons(false);
  }, []);

  const setWheelRed = useCallback((toRed: boolean) => {
    for (const mesh of wheelMeshesRef.current) {
      for (const mat of (Array.isArray(mesh.material) ? mesh.material : [mesh.material])) {
        const m = mat as THREE.MeshStandardMaterial;
        const orig = wheelOriginalColorsRef.current.get(mat);
        if (!orig) continue;
        const tc = toRed ? new THREE.Color(CONFIG.WHEEL.ACTIVE_COLOR) : orig.color;
        const dur = CONFIG.WHEEL.TRANSITION_DURATION;
        if (m.color) gsap.to(m.color, { r: tc.r, g: tc.g, b: tc.b, duration: dur, ease: "power2.inOut", onUpdate: () => { m.needsUpdate = true; } });
        if (m.emissive) {
          const ec = toRed ? new THREE.Color(tc.r * .5, tc.g * .5, tc.b * .5) : (orig.emissive ?? new THREE.Color(0, 0, 0));
          gsap.to(m.emissive, { r: ec.r, g: ec.g, b: ec.b, duration: dur, ease: "power2.inOut" });
        }
        if (m.emissiveIntensity !== undefined)
          gsap.to(m, { emissiveIntensity: toRed ? 1 : (orig.emissiveIntensity ?? 0), duration: dur, ease: "power2.inOut" });
      }
    }
  }, []);

  const goToSection = useCallback((idx: number) => {
    if (idx < 0 || idx >= STOP_FRAMES.length) return;
    if (isTweeningRef.current && targetSectionRef.current === idx) return;
    if (cooldownRef.current && !isTweeningRef.current) return;
    tweenRef.current?.kill();
    gsapFrameObj.current.value = renderFrameRef.current;
    isTweeningRef.current = true;
    targetSectionRef.current = idx;
    tweenRef.current = gsap.to(gsapFrameObj.current, {
      value: STOP_FRAMES[idx], duration: CONFIG.SECTION_DURATION, ease: "power2.inOut",
      onUpdate: () => { updateAnnotations(gsapFrameObj.current.value); },
      onComplete: () => {
        gsapFrameObj.current.value = STOP_FRAMES[idx];
        renderFrameRef.current = STOP_FRAMES[idx];
        sectionRef.current = idx;
        isTweeningRef.current = false;
        setCurrentSection(idx);
        updateAnnotations(STOP_FRAMES[idx]);
        cooldownRef.current = true;
        if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current);
        cooldownTimerRef.current = setTimeout(() => { cooldownRef.current = false; }, 50);
      },
    });
  }, [updateAnnotations]);

  const playVideoSafely = useCallback((video: HTMLVideoElement) => {
    const attempt = () => video.play().catch(() => { video.muted = true; video.play().catch(console.error); });
    if (video.readyState >= 3) attempt();
    else { video.addEventListener("canplay", attempt, { once: true }); video.load(); }
  }, []);

  useEffect(() => {
    if (loading) return;
    let tpAccum = 0;
    const markInteracted = () => {
      if (hasUserInteractedRef.current) return;
      hasUserInteractedRef.current = true;
      if (pendingVideoIdxRef.current !== null) {
        const idx = pendingVideoIdxRef.current; pendingVideoIdxRef.current = null;
        const vd = videosRef.current[idx - 1]; if (vd) playVideoSafely(vd.video);
      }
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault(); markInteracted();
      const delta = e.deltaY, abs = Math.abs(delta), dir = delta > 0 ? 1 : -1;
      if (isTweeningRef.current && targetSectionRef.current === sectionRef.current + dir) return;
      if (cooldownRef.current && !isTweeningRef.current) return;
      if (abs < 50) { tpAccum += abs; if (tpAccum < 120) return; tpAccum = 0; } else tpAccum = 0;
      goToSection(sectionRef.current + dir);
    };
    let ty = 0;
    const onTS = (e: TouchEvent) => { markInteracted(); ty = e.touches[0].clientY; };
    const onTE = (e: TouchEvent) => {
      const dy = ty - e.changedTouches[0].clientY; if (Math.abs(dy) < 30) return;
      const dir = dy > 0 ? 1 : -1;
      if (isTweeningRef.current && targetSectionRef.current === sectionRef.current + dir) return;
      goToSection(sectionRef.current + dir);
    };
    const onKD = (e: KeyboardEvent) => {
      markInteracted(); let dir = 0;
      if (["ArrowDown", "PageDown", " "].includes(e.key)) { e.preventDefault(); dir = 1; }
      if (["ArrowUp", "PageUp"].includes(e.key)) { e.preventDefault(); dir = -1; }
      if (!dir) return;
      if (isTweeningRef.current && targetSectionRef.current === sectionRef.current + dir) return;
      goToSection(sectionRef.current + dir);
    };
    const el = containerRef.current;
    el?.addEventListener("wheel", onWheel, { passive: false });
    el?.addEventListener("touchstart", onTS, { passive: true });
    el?.addEventListener("touchend", onTE, { passive: true });
    window.addEventListener("keydown", onKD);
    return () => {
      el?.removeEventListener("wheel", onWheel);
      el?.removeEventListener("touchstart", onTS);
      el?.removeEventListener("touchend", onTE);
      window.removeEventListener("keydown", onKD);
    };
  }, [loading, goToSection, playVideoSafely]);

  const initScene = useCallback(() => {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(CONFIG.BACKGROUND.COLOR);
    const sl = new THREE.DirectionalLight(0xffffff, 1.5);
    sl.position.set(1, 10, 0); sl.castShadow = true;
    sl.shadow.mapSize.set(2048, 2048);
    sl.shadow.camera.near = 0.5; sl.shadow.camera.far = 50;
    sl.shadow.bias = -0.0001; sl.shadow.normalBias = 0.02;
    const d = 15; Object.assign(sl.shadow.camera, { left: -d, right: d, top: d, bottom: -d });
    scene.add(sl); scene.add(new THREE.AmbientLight(0xffffff, 0.8));
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(100, 100), new THREE.ShadowMaterial({ opacity: 0.4 }));
    ground.rotation.x = -Math.PI / 2; ground.position.y = -100; ground.receiveShadow = true;
    groundRef.current = ground; scene.add(ground); sceneRef.current = scene;
  }, []);

  const initRenderer = useCallback(() => {
    if (!canvasRef.current || rendererRef.current) return;
    const safari = isSafari(), ios = isIOS();
    safariRef.current = safari; iosRef.current = ios;
    const r = new THREE.WebGLRenderer({ canvas: canvasRef.current, antialias: !ios, alpha: false, powerPreference: "high-performance", precision: ios ? "mediump" : "highp", preserveDrawingBuffer: false });
    r.setPixelRatio(Math.min(window.devicePixelRatio, ios ? 1.5 : CONFIG.RENDERER.MAX_PIXEL_RATIO));
    r.setSize(window.innerWidth, window.innerHeight);
    r.outputColorSpace = THREE.SRGBColorSpace;
    r.toneMapping = THREE.ACESFilmicToneMapping;
    r.toneMappingExposure = CONFIG.RENDERER.TONE_MAPPING_EXPOSURE;
    r.shadowMap.enabled = true;
    r.shadowMap.type = ios ? THREE.BasicShadowMap : THREE.PCFSoftShadowMap;
    rendererRef.current = r;
  }, []);

  const loadEnvironment = useCallback(() => {
    if (!sceneRef.current || !rendererRef.current) return;
    try {
      const gl = rendererRef.current.getContext();
      const hasFloat = gl.getExtension("OES_texture_float") || gl.getExtension("OES_texture_half_float") || gl.getExtension("EXT_color_buffer_float") || gl.getExtension("EXT_color_buffer_half_float");
      if (!hasFloat && safariRef.current) { sceneRef.current.add(new THREE.AmbientLight(0xffffff, 0.6)); return; }
      const pmrem = new THREE.PMREMGenerator(rendererRef.current);
      pmrem.compileEquirectangularShader();
      new RGBELoader().load(CONFIG.HDR.PATH,
        hdr => { try { sceneRef.current!.environment = pmrem.fromEquirectangular(hdr).texture; } catch (e) { console.warn(e); } finally { hdr.dispose(); pmrem.dispose(); } },
        undefined, e => { console.warn(e); pmrem.dispose(); }
      );
    } catch (e) { console.warn(e); }
  }, []);

  const applyVideoToScreen = useCallback((idx: number) => {
    const vd = videosRef.current[idx - 1], mesh = screenMeshRef.current;
    if (!vd || !mesh) return;
    videosRef.current.forEach((v, i) => { if (i !== idx - 1) { v.video.pause(); v.video.currentTime = 0; } });
    mesh.material = new THREE.MeshStandardMaterial({ map: vd.texture, emissive: new THREE.Color(0xffffff), emissiveMap: vd.texture, emissiveIntensity: 1.0, roughness: 0.5, metalness: 0.0 });
    if (hasUserInteractedRef.current) playVideoSafely(vd.video);
    else { pendingVideoIdxRef.current = idx; vd.video.load(); }
  }, [playVideoSafely]);

  const setupVideos = useCallback((model: THREE.Group) => {
    for (const vc of CONFIG.VIDEOS) {
      const vd = createVideoTexture(vc.path);
      if (vd) { videosRef.current.push(vd); setTimeout(() => vd.video.load(), 0); }
    }
    model.traverse(child => {
      if (!(child as THREE.Mesh).isMesh) return;
      const mesh = child as THREE.Mesh;
      if (child.name.toLowerCase().includes(CONFIG.SCREEN.MESH_NAME.toLowerCase()) || (mesh.material as any)?.name?.toLowerCase().includes(CONFIG.SCREEN.MATERIAL_NAME.toLowerCase()))
        screenMeshRef.current = mesh;
    });
    if (screenMeshRef.current && videosRef.current.length > 0) applyVideoToScreen(1);
  }, [applyVideoToScreen]);

  const setupWheelMeshes = useCallback((model: THREE.Group) => {
    const meshes: THREE.Mesh[] = [];
    model.traverse(child => {
      if (!(child as THREE.Mesh).isMesh) return;
      const mesh = child as THREE.Mesh;
      if (!CONFIG.WHEEL.MESH_NAMES.some(n => mesh.name.toLowerCase() === n.toLowerCase())) return;
      meshes.push(mesh);
      for (const mat of (Array.isArray(mesh.material) ? mesh.material : [mesh.material])) {
        const m = mat as THREE.MeshStandardMaterial;
        wheelOriginalColorsRef.current.set(mat, { color: m.color?.clone() ?? new THREE.Color(0xffffff), emissive: m.emissive?.clone(), emissiveIntensity: m.emissiveIntensity });
      }
    });
    wheelMeshesRef.current = meshes;
  }, []);

  const setupConnectorMeshes = useCallback((model: THREE.Group) => {
    const names = CONFIG.TEXT_ANNOTATIONS.map(a => (a as any).meshName as string);
    model.traverse(child => {
      const lc = child.name.toLowerCase();
      names.forEach((name, idx) => {
        if (!connectorMeshRefs.current[idx] && lc === name.toLowerCase()) {
          connectorMeshRefs.current[idx] = child;
        }
      });
    });
  }, []);

  const updateModelLayout = useCallback(() => {
    if (!modelRef.current) return;
    const dt = getDeviceType();
    if (dtRef.current !== dt) { dtRef.current = dt; setDeviceType(dt); updatePop01Visibility(dt); }
    const s = CONFIG.MODEL.SCALE[dt];
    modelRef.current.scale.set(s, s, s);
    centerModel(modelRef.current, dt);
    const box = new THREE.Box3().setFromObject(modelRef.current);
    if (groundRef.current) groundRef.current.position.y = box.min.y;
    if (cameraRef.current) {
      cameraRef.current.position.z = origCamZRef.current * (dt === "sm" ? 5 : dt === "md" ? 4 : dt === "lg" ? 2 : 1);
      cameraRef.current.aspect = window.innerWidth / window.innerHeight;
      cameraRef.current.updateProjectionMatrix();
    }
  }, [updatePop01Visibility]);

  const loadModel = useCallback(() => {
    if (!sceneRef.current || !rendererRef.current) return;
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath("https://www.gstatic.com/draco/versioned/decoders/1.5.6/");
    const loader = new GLTFLoader();
    loader.setDRACOLoader(dracoLoader);
    loader.load(CONFIG.MODEL.PATH,
      gltf => {
        setLoadProgress(100);
        const model = gltf.scene; modelRef.current = model;
        if (gltf.cameras?.length) {
          const gc = gltf.cameras[0];
          if (gc instanceof THREE.PerspectiveCamera) {
            const dt = getDeviceType(); dtRef.current = dt; setDeviceType(dt);
            origCamZRef.current = gc.position.z;
            gc.fov = dt === "sm" ? 80 : dt === "md" ? 60 : dt === "lg" ? 50 : Math.min(gc.fov, 75);
            gc.aspect = window.innerWidth / window.innerHeight; gc.near = 0.1; gc.far = 1000;
            gc.position.z *= dt === "sm" ? 2 : dt === "md" ? 1.8 : dt === "lg" ? 1.3 : 1;
            gc.updateProjectionMatrix(); cameraRef.current = gc;
          }
        }
        model.traverse(child => { if (child.name.toLowerCase() === "pop01") pop01MeshRef.current = child; });
        updatePop01Visibility(dtRef.current);
        model.traverse(child => {
          if (!(child as THREE.Mesh).isMesh) return;
          const mesh = child as THREE.Mesh; mesh.castShadow = true; mesh.receiveShadow = true;
          const isScreen = child.name.toLowerCase().includes(CONFIG.SCREEN.MESH_NAME.toLowerCase());
          for (const m of (Array.isArray(mesh.material) ? mesh.material : [mesh.material]))
            optimizeMaterial(m, rendererRef.current!, isScreen);
        });
        const dt = getDeviceType(), s = CONFIG.MODEL.SCALE[dt];
        model.scale.set(s, s, s); centerModel(model, dt);
        const box = new THREE.Box3().setFromObject(model);
        if (groundRef.current) groundRef.current.position.y = box.min.y;
        sceneRef.current!.add(model);
        setupVideos(model);
        setupWheelMeshes(model);
        setupConnectorMeshes(model);
        if (gltf.animations.length) {
          const mixer = new THREE.AnimationMixer(model);
          const action = mixer.clipAction(gltf.animations[0]);
          action.play(); action.paused = true;
          mixerRef.current = mixer; actionRef.current = action;
        }
        gsapFrameObj.current.value = 0; renderFrameRef.current = 0; sectionRef.current = 0;
        dracoLoader.dispose();
        setTimeout(() => { setPreloaderVisible(false); setTimeout(() => setLoading(false), 700); }, 400);
      },
      (evt: ProgressEvent) => {
        if (evt.lengthComputable && evt.total > 0) setLoadProgress(Math.min(95, Math.round((evt.loaded / evt.total) * 95)));
        else setLoadProgress(p => Math.min(p + 1, 85));
      },
      err => { console.error(err); dracoLoader.dispose(); setError("Failed to load 3D model."); setLoading(false); setPreloaderVisible(false); }
    );
  }, [setupVideos, setupWheelMeshes, setupConnectorMeshes, updatePop01Visibility]);

  useEffect(() => {
    const LERP = 10, SNAP = 0.005;
    let rafId: number, lastT = performance.now();

    const animate = (now: number) => {
      rafId = requestAnimationFrame(animate);
      if (document.visibilityState === "hidden") { lastT = now; return; }
      const dt = Math.min((now - lastT) / 1000, 0.05); lastT = now;
      if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return;

      const target = gsapFrameObj.current.value;
      const diff = target - renderFrameRef.current;
      renderFrameRef.current = Math.abs(diff) > SNAP ? renderFrameRef.current + diff * Math.min(LERP * dt, 1) : target;
      const frame = renderFrameRef.current;

      let red = false;
      for (const a of CONFIG.TEXT_ANNOTATIONS)
        if (frame >= a.frameStart && frame <= a.frameEnd && (a as any).triggerWheelColorChange) { red = true; break; }
      if (red !== isWheelRedRef.current) { setWheelRed(red); isWheelRedRef.current = red; }

      if (mixerRef.current && actionRef.current) {
        const clip = actionRef.current.getClip();
        actionRef.current.time = (frame / CONFIG.TOTAL_FRAMES) * clip.duration;
        mixerRef.current.update(0);
      }

      const vd = videosRef.current[activeVideoRef.current - 1];
      if (vd && !vd.video.paused && vd.video.readyState >= 2) vd.texture.needsUpdate = true;

      rendererRef.current.render(sceneRef.current, cameraRef.current);

      // ── CONNECTOR UPDATE — all 4 annotations ─────────────────────────
      const cam = cameraRef.current;
      setConnectors(prev => {
        let dirty = false;
        const next: ConnectorState[] = prev.map((c, i) => {
          const ann = CONFIG.TEXT_ANNOTATIONS[i];
          const inRange = frame >= ann.frameStart && frame <= ann.frameEnd;

          if (!inRange) {
            if (!c.meshPt.ok) return c;
            dirty = true;
            return { ...c, meshPt: { ...c.meshPt, ok: false } };
          }

          const meshObj = connectorMeshRefs.current[i];
          if (!meshObj) return c;

          const projected = toScreen(meshObj, cam);
          if (!projected) {
            if (!c.meshPt.ok) return c;
            dirty = true;
            return { ...c, meshPt: { ...c.meshPt, ok: false } };
          }
          const cardEl = annCardRefs.current[i];
          let ax = c.cardPt.x, ay = c.cardPt.y;
          if (cardEl) {
            const rect = cardEl.getBoundingClientRect();
            ax = rect.left + rect.width / 2;
            // Annotations 0 & 1 → connect from card bottom-center
            // Annotations 2 & 3 → connect from card top-center
            ay = i < 2 ? rect.bottom : rect.top;
          }

          if (
            c.meshPt.ok &&
            Math.abs(c.meshPt.x - projected.x) < 0.5 &&
            Math.abs(c.meshPt.y - projected.y) < 0.5 &&
            Math.abs(c.cardPt.x - ax) < 0.5 &&
            Math.abs(c.cardPt.y - ay) < 0.5
          ) return c;

          dirty = true;
          return {
            meshPt: { x: projected.x, y: projected.y, ok: true },
            cardPt: { x: ax, y: ay },
          };
        });
        return dirty ? next : prev;
      });
    };

    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [setWheelRed]);

  useEffect(() => {
    const onVis = () => {
      const vd = videosRef.current[activeVideoRef.current - 1]; if (!vd) return;
      if (document.visibilityState === "hidden") vd.video.pause();
      else if (hasUserInteractedRef.current) playVideoSafely(vd.video);
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [playVideoSafely]);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    initScene(); initRenderer(); loadEnvironment(); loadModel();

    const onResize = () => {
      if (!rendererRef.current || !cameraRef.current) return;
      const dt = getDeviceType();
      if (dtRef.current !== dt) {
        dtRef.current = dt; setDeviceType(dt);
        if (cameraRef.current instanceof THREE.PerspectiveCamera)
          cameraRef.current.fov = dt === "sm" ? 80 : dt === "md" ? 60 : dt === "lg" ? 50 : 75;
        updateModelLayout(); updatePop01Visibility(dt);
      }
      cameraRef.current.aspect = window.innerWidth / window.innerHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", onResize);

    const canvas = canvasRef.current;
    const onCL = (e: Event) => { e.preventDefault(); };
    const onCR = () => { rendererRef.current?.dispose(); rendererRef.current = null; initializedRef.current = false; initRenderer(); loadEnvironment(); };
    canvas?.addEventListener("webglcontextlost", onCL, false);
    canvas?.addEventListener("webglcontextrestored", onCR, false);

    return () => {
      window.removeEventListener("resize", onResize);
      canvas?.removeEventListener("webglcontextlost", onCL);
      canvas?.removeEventListener("webglcontextrestored", onCR);
      tweenRef.current?.kill();
      if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current);
      for (const v of videosRef.current) { v.video.pause(); v.video.removeAttribute("src"); v.video.load(); v.texture.dispose(); }
      videosRef.current = [];
      sceneRef.current?.traverse(obj => {
        if (!(obj as THREE.Mesh).isMesh) return;
        const m = obj as THREE.Mesh; m.geometry?.dispose();
        for (const mat of (Array.isArray(m.material) ? m.material : [m.material])) mat.dispose();
      });
      sceneRef.current?.clear();
      rendererRef.current?.forceContextLoss(); rendererRef.current?.dispose(); rendererRef.current = null;
      modelRef.current = null; mixerRef.current = null; actionRef.current = null;
      pop01MeshRef.current = null;
      connectorMeshRefs.current = [null, null, null, null];
      wheelMeshesRef.current = []; wheelOriginalColorsRef.current.clear();
      initializedRef.current = false;
    };
  }, [initScene, initRenderer, loadEnvironment, loadModel, updateModelLayout, updatePop01Visibility]);

  const switchVideo = useCallback((idx: number) => { activeVideoRef.current = idx; setActiveVideo(idx); applyVideoToScreen(idx); }, [applyVideoToScreen]);
  const handleDotClick = useCallback((idx: number) => {
    hasUserInteractedRef.current = true;
    if (pendingVideoIdxRef.current !== null) { const p = pendingVideoIdxRef.current; pendingVideoIdxRef.current = null; const vd = videosRef.current[p - 1]; if (vd) playVideoSafely(vd.video); }
    goToSection(idx);
  }, [goToSection, playVideoSafely]);

  const annotationElements = useMemo(() =>
    CONFIG.TEXT_ANNOTATIONS.map((a, i) => (
      <TextAnnotation
        key={a.id}
        annotation={a}
        isVisible={visibleAnnotations.has(a.id)}
        deviceType={deviceType}
        cardRef={(el) => { annCardRefs.current[i] = el; }}
      />
    )),
    [visibleAnnotations, deviceType]);

  return (
    <div ref={containerRef} className="relative h-screen w-screen overflow-hidden"
      style={{ touchAction: "none", WebkitOverflowScrolling: "touch", position: "relative" }}>

      <div className="fixed inset-0 w-full h-full">
        <canvas ref={canvasRef} className="w-full h-full" style={{ display: "block" }} />
      </div>

      {CONFIG.TEXT_ANNOTATIONS.map((a, i) => (
        <ConnectorLine
          key={a.id}
          meshPt={connectors[i].meshPt}
          cardPt={connectors[i].cardPt}
          visible={visibleAnnotations.has(a.id)}
          deviceType={deviceType}
        />
      ))}

      {annotationElements}

      <div className="fixed right-4 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-3">
        {STOP_FRAMES.map((_, idx) => (
          <button key={idx} onClick={() => handleDotClick(idx)}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${currentSection === idx ? "bg-red-600 scale-125" : "bg-gray-400 hover:bg-gray-600"}`}
            aria-label={`Go to section ${idx + 1}`}
          />
        ))}
      </div>

      <Preloader progress={loadProgress} visible={preloaderVisible} />

      {error && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/80">
          <div className="text-red-500 text-xl max-w-md text-center p-4">{error}</div>
        </div>
      )}

      {showButtons && !loading && !error && (
        <div className="fixed top-4 md:top-5 left-0 right-0 z-[9999] px-2 md:px-0 pointer-events-none">
          <div className="max-w-7xl mx-auto flex justify-center pointer-events-auto">
            <div className="bg-white rounded-full p-1 shadow-lg inline-flex items-center gap-1">
              {CONFIG.VIDEOS.map(video => (
                <button key={video.id} onClick={() => switchVideo(video.id)}
                  className={`px-5 md:px-6 py-2 md:py-2.5 rounded-full font-medium text-sm md:text-base transition-all duration-300 ease-out ${activeVideo === video.id ? "bg-red-600 text-white shadow-md" : "bg-transparent text-gray-700 hover:bg-gray-100"}`}>
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