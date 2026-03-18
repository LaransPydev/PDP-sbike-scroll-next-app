"use client";

import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

/* ==================== SAFARI / DEVICE DETECTION ==================== */
const isSafari = () => typeof window !== "undefined" && /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
const isIOS    = () => typeof window !== "undefined" && /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
const isMacOS  = () => typeof window !== "undefined" && /Macintosh|MacIntel|MacPPC|Mac68K/.test(navigator.userAgent);
const needsSafariVideoUnlock = () => isSafari() || isIOS();

/* ==================== CONFIG ==================== */
const CONFIG = {
  TOTAL_FRAMES: 130,
  MODEL: {
    PATH: "https://s3.us-east-1.amazonaws.com/sportstech.team/dev_assets/Sbikedraft.glb",
    SCALE: { sm: 0.04, md: 0.06, lg: 0.4, xl: 1.0 },
    MOBILE_POSITION:  { y: -1.5, x: 0, z: 0 },
    TABLET_POSITION:  { y: -1.8, x: 0, z: 0 },
    LAPTOP_POSITION:  { y: -1.0, x: 0, z: 0 },
    DESKTOP_POSITION: { y:  1.0, x: 0, z: 0 },
  },
  HDR:    { PATH: "https://360-product-view.s3.eu-north-1.amazonaws.com/Product-360-View/models/hdr/lightroom-4.hdr" },
  VIDEOS: [
    { id: 1, name: "Workout",        path: "https://s3.us-east-1.amazonaws.com/sportstech.team/dev_assets/sBike-Trainer.mp4"   },
    { id: 2, name: "Landscape video",path: "https://s3.us-east-1.amazonaws.com/sportstech.team/dev_assets/sBike-Landscape.mp4" },
    { id: 3, name: "Gaming",         path: "https://s3.us-east-1.amazonaws.com/sportstech.team/dev_assets/sBike-Gaming.mp4"    },
  ],
  SCREEN: { MESH_NAME: "Screen", MATERIAL_NAME: "screen" },
  WHEEL:  { MESH_NAMES: ["Wheel"], ACTIVE_COLOR: 0xdc2626, TRANSITION_DURATION: 1.0 },
  RENDERER: { MAX_PIXEL_RATIO: 2, TONE_MAPPING_EXPOSURE: 0.8 },
  BACKGROUND: { COLOR: 0xf5f5f5 },
  ANNOTATION_ANCHOR_MESHES: ["wheel_text", "screen_text"] as const,
  TEXT_ANNOTATIONS: [
    {
      id: 1,
      frameStart: 15, frameEnd: 20, stopFrame: 15,
      visibleAtSection: 1,
      align: "left" as const,
      mobileLayout: { top: "auto", bottom: 50, left: 16, right: "auto" },
      tabletLayout: { top: "auto", bottom: 50, left: 16, right: "auto" },
      title: "Dynamic LED Lights",
      text: "Color-changing LEDs respond to your speed that enhances focus and energy.",
      src: "https://s3.us-east-1.amazonaws.com/sportstech.team/dev_assets/incandescent-light-bulb-svgrepo-com 1.svg",
      meshName: "Wheel",
      anchorMeshName: "wheel_text",
      triggerWheelColorChange: true,
    },
    {
      id: 2,
      frameStart: 40, frameEnd: 50, stopFrame: 45,
      visibleAtSection: 2,
      align: "right" as const,
      mobileLayout: { top: "auto", bottom: 50, left: 20, right: "auto" },
      tabletLayout: { top: "auto", bottom: 50, left: "auto", right: 16 },
      title: "21.5 Display",
      text: "With the 360-degree swiveling touch display, your workouts are more flexible than ever!",
      src: "https://s3.us-east-1.amazonaws.com/sportstech.team/dev_assets/square_3942733.svg",
      meshName: "Screen",
      anchorMeshName: "screen_text",
    },
  ],
} as const;

const STOP_FRAMES   = [0, ...CONFIG.TEXT_ANNOTATIONS.map(a => a.stopFrame), CONFIG.TOTAL_FRAMES];
const TOTAL_SECTIONS = STOP_FRAMES.length;

/* ==================== LAYOUT ==================== */
const NAV_HEIGHT          = 62;   // px — keep in sync with Topnav
const VH_PER_SECTION      = 140;  // viewport-heights per transition
const LERP_SPEED          = 8;    // render-loop lerp factor (higher = snappier)
const SNAP_THRESHOLD      = 0.5;  // frame units
const EXTRA_TAIL_SCROLL   = 0.5;    // Adds an extra 1 segment of scroll distance at the very end
const SCROLL_SEGMENTS     = (TOTAL_SECTIONS - 1) + EXTRA_TAIL_SCROLL;

/* ==================== TYPES ==================== */
type DeviceType = "sm" | "md" | "lg" | "xl";
interface StoredMaterialColors { color: THREE.Color; emissive?: THREE.Color; emissiveIntensity?: number; }
interface ScreenPt { x: number; y: number; ok: boolean; }
interface ConnectorState { meshPt: ScreenPt; cardPt: { x: number; y: number }; }

/* ==================== HELPERS ==================== */
const isMobileDevice = (dt: DeviceType) => dt === "sm";

const getDeviceType = (): DeviceType => {
  if (typeof window === "undefined") return "xl";
  const w = window.innerWidth;
  if (w < 1024) return "sm";
  if (w < 1280) return "md";
  if (w < 1600) return "lg";
  return "xl";
};

const centerModel = (model: THREE.Group, dt: DeviceType) => {
  const box    = new THREE.Box3().setFromObject(model);
  const center = box.getCenter(new THREE.Vector3());
  const size   = box.getSize(new THREE.Vector3());
  const pos    = dt === "sm" ? CONFIG.MODEL.MOBILE_POSITION  :
                 dt === "md" ? CONFIG.MODEL.TABLET_POSITION  :
                 dt === "lg" ? CONFIG.MODEL.LAPTOP_POSITION  :
                               CONFIG.MODEL.DESKTOP_POSITION;
  model.position.set(pos.x - center.x, pos.y - size.y / 2, pos.z - center.z);
};

const optimizeTexture = (tex: THREE.Texture, r: THREE.WebGLRenderer) => {
  tex.anisotropy    = r.capabilities.getMaxAnisotropy();
  tex.minFilter     = THREE.LinearMipmapLinearFilter;
  tex.magFilter     = THREE.LinearFilter;
  tex.generateMipmaps = true;
  tex.colorSpace    = THREE.SRGBColorSpace;
  tex.needsUpdate   = true;
};

const optimizeMaterial = (mat: THREE.Material, r: THREE.WebGLRenderer, isVideo = false) => {
  if (!mat) return;
  const m = mat as any;
  if (!isVideo && m.map) optimizeTexture(m.map, r);
  if (m.isMeshStandardMaterial || m.isMeshPhysicalMaterial) {
    m.envMapIntensity = isVideo ? 0 : 1.5;
    m.roughness       = m.roughness ?? 0.4;
    m.metalness       = m.metalness ?? 0.5;
  }
  m.side        = THREE.FrontSide;
  m.needsUpdate = true;
};

const createVideoTexture = (path: string) => {
  try {
    const video = document.createElement("video");
    video.setAttribute("playsinline", "");
    video.setAttribute("webkit-playsinline", "");
    video.setAttribute("preload", needsSafariVideoUnlock() ? "auto" : "metadata");
    video.setAttribute("x-webkit-airplay", "deny");
    video.muted = true; video.loop = true; video.playsInline = true;
    video.autoplay = false; video.crossOrigin = "anonymous";
    (video as any).disablePictureInPicture   = true;
    (video as any).disableRemotePlayback     = true;
    video.src = path;
    if (needsSafariVideoUnlock()) {
      video.style.cssText = "position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;opacity:0;pointer-events:none;z-index:-1";
      document.body.appendChild(video);
    }
    const texture = new THREE.VideoTexture(video);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter  = THREE.LinearFilter;
    texture.magFilter  = THREE.LinearFilter;
    texture.format     = THREE.RGBAFormat;
    texture.flipY      = false;
    return { video, texture };
  } catch { return null; }
};

const projectPoint = (wp: THREE.Vector3, cam: THREE.PerspectiveCamera) => {
  const p = wp.clone().project(cam);
  if (p.z > 1) return null;
  return { x: (p.x * 0.5 + 0.5) * window.innerWidth, y: (-p.y * 0.5 + 0.5) * window.innerHeight };
};
const toScreen = (obj: THREE.Object3D, cam: THREE.PerspectiveCamera) => {
  const wp = new THREE.Vector3(); obj.getWorldPosition(wp); return projectPoint(wp, cam);
};
const toScreenBottomCenter = (obj: THREE.Object3D, cam: THREE.PerspectiveCamera) => {
  const mesh = obj as THREE.Mesh;
  if (!mesh.geometry) return toScreen(obj, cam);
  mesh.geometry.computeBoundingBox();
  const bbox = mesh.geometry.boundingBox;
  if (!bbox) return toScreen(obj, cam);
  const lp = new THREE.Vector3((bbox.min.x + bbox.max.x) / 2, bbox.min.y, (bbox.min.z + bbox.max.z) / 2);
  return projectPoint(lp.applyMatrix4(obj.matrixWorld), cam);
};

/* ==================== PRELOADER ==================== */
const Preloader: React.FC<{ progress: number; visible: boolean }> = ({ progress, visible }) => {
  const p = Math.min(100, Math.max(0, progress));
  const c = 2 * Math.PI * 54;
  return (
    <div style={{ position:"fixed", inset:0, zIndex:9999, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", background:"#fff", opacity: visible ? 1 : 0, pointerEvents: visible ? "all" : "none", transition:"opacity 0.7s cubic-bezier(0.4,0,0.2,1)" }}>
      <div style={{ position:"absolute", inset:0, backgroundImage:`url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`, backgroundRepeat:"repeat", backgroundSize:"128px", opacity:0.6, pointerEvents:"none" }} />
      <div style={{ position:"relative", width:140, height:140 }}>
        <svg width="140" height="140" style={{ position:"absolute", inset:0, transform:"rotate(-90deg)" }}>
          <circle cx="70" cy="70" r="54" fill="none" stroke="#f0f0f0" strokeWidth="5" />
          <circle cx="70" cy="70" r="54" fill="none" stroke="#dc2626" strokeWidth="5" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c - (p / 100) * c} style={{ transition:"stroke-dashoffset 0.3s ease-out" }} />
        </svg>
        <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column" }}>
          <span style={{ fontFamily:"'DM Mono','Courier New',monospace", fontSize:"28px", fontWeight:700, color:"#111", letterSpacing:"-1px", lineHeight:1 }}>{Math.round(p)}</span>
          <span style={{ fontFamily:"'DM Mono','Courier New',monospace", fontSize:"11px", color:"#999", letterSpacing:"0.1em", marginTop:2 }}>%</span>
        </div>
      </div>
      <div style={{ marginTop:28, textAlign:"center" }}>
        <p style={{ fontFamily:"'DM Mono','Courier New',monospace", fontSize:"11px", letterSpacing:"0.25em", color:"#dc2626", textTransform:"uppercase", marginBottom:6 }}>sBike</p>
        <p style={{ fontFamily:"'DM Mono','Courier New',monospace", fontSize:"11px", letterSpacing:"0.12em", color:"#aaa", textTransform:"uppercase" }}>{p < 100 ? "Loading" : "Preparing scene…"}</p>
      </div>
      <div style={{ position:"absolute", bottom:0, left:0, right:0, height:3, background:"#f0f0f0" }}>
        <div style={{ height:"100%", width:`${p}%`, background:"linear-gradient(90deg,#dc2626,#ef4444)", transition:"width 0.3s ease-out", borderRadius:"0 2px 2px 0" }} />
      </div>
    </div>
  );
};

/* ==================== CONNECTOR LINE (mobile only) ==================== */
const ConnectorLine: React.FC<{ meshPt: ScreenPt; cardPt: { x:number; y:number }; visible: boolean; deviceType: DeviceType }> = React.memo(({ meshPt, cardPt, visible, deviceType }) => {
  const lastPtRef = useRef<{ x1:number; y1:number; x2:number; y2:number } | null>(null);
  if (deviceType === "lg" || deviceType === "xl") return null;
  if (meshPt.ok) lastPtRef.current = { x1:meshPt.x, y1:meshPt.y, x2:cardPt.x, y2:cardPt.y };
  if (!lastPtRef.current) return null;
  const { x1, y1, x2, y2 } = lastPtRef.current;
  const mx = (x1+x2)/2, my = (y1+y2)/2 - 18;
  const pathD = `M ${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}`;
  const len   = Math.hypot(x2-x1, y2-y1);
  const show  = visible && meshPt.ok;
  const uid   = deviceType;
  return (
    <svg style={{ position:"fixed", inset:0, width:"100%", height:"100%", pointerEvents:"none", zIndex:49, overflow:"visible", opacity: show ? 1 : 0, transition:"opacity 0.4s cubic-bezier(0.4,0,0.2,1)" }}>
      <defs>
        <linearGradient id={`grad-${uid}`} x1={x1} y1={y1} x2={x2} y2={y2} gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#dc2626" stopOpacity="0.9" />
          <stop offset="60%"  stopColor="#9ca3af" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#6b7280" stopOpacity="0.4" />
        </linearGradient>
        <filter id={`glow-${uid}`} x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="2.5" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        <filter id={`blur-${uid}`}><feGaussianBlur stdDeviation="1"/></filter>
      </defs>
      <path d={pathD} fill="none" stroke="#dc2626" strokeWidth="3" strokeOpacity="0.18" filter={`url(#blur-${uid})`} />
      <path d={pathD} fill="none" stroke={`url(#grad-${uid})`} strokeWidth="1.5" strokeLinecap="round" strokeDasharray={len} strokeDashoffset={show ? 0 : len} style={{ transition:"stroke-dashoffset 0.7s cubic-bezier(0.4,0,0.2,1)" }} />
      <circle cx={x1} cy={y1} r="4" fill="#dc2626" opacity="0.95" filter={`url(#glow-${uid})`} />
      <circle cx={x1} cy={y1} r="4" fill="none" stroke="#dc2626" strokeWidth="1.5" opacity="0.5"><animate attributeName="r" values="4;9;4" dur="2s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.5;0;0.5" dur="2s" repeatCount="indefinite"/></circle>
      <circle cx={x1} cy={y1} r="2" fill="#fff" opacity="0.9"/>
      <circle cx={x2} cy={y2} r="3.5" fill="#6b7280" opacity="0.6"/>
      <circle cx={x2} cy={y2} r="3.5" fill="none" stroke="#9ca3af" strokeWidth="1" opacity="0.4"><animate attributeName="r" values="3.5;6;3.5" dur="2.4s" repeatCount="indefinite" begin="0.4s"/><animate attributeName="opacity" values="0.4;0;0.4" dur="2.4s" repeatCount="indefinite" begin="0.4s"/></circle>
      <circle cx={x2} cy={y2} r="1.5" fill="#fff" opacity="0.8"/>
    </svg>
  );
});
ConnectorLine.displayName = "ConnectorLine";

/* ==================== TEXT ANNOTATIONS ==================== */
type AnnotationProps = { annotation: (typeof CONFIG.TEXT_ANNOTATIONS)[number]; isVisible: boolean; deviceType: DeviceType; cardRef?: React.RefCallback<HTMLDivElement>; anchorScreenPt?: ScreenPt; };

const TextAnnotationMobile: React.FC<AnnotationProps> = React.memo(({ annotation, isVisible, deviceType, cardRef }) => {
  const layout = deviceType === "sm" ? annotation.mobileLayout : annotation.tabletLayout;
  const cardW  = deviceType === "sm" ? 208 : 256;
  const toVal  = (v: number | string) => (v as string) === "auto" ? "auto" as const : v as number;
  return (
    <div ref={cardRef} style={{ position:"fixed", top:toVal(layout.top as any), bottom:toVal(layout.bottom as any), left:toVal(layout.left as any), right:toVal(layout.right as any), pointerEvents:"none", zIndex:50, opacity: isVisible ? 1 : 0, transform: isVisible ? "translateY(0)" : "translateY(10px)", transition:"opacity 0.5s cubic-bezier(0.4,0,0.2,1), transform 0.5s cubic-bezier(0.4,0,0.2,1)", willChange:"opacity, transform" }}>
      <div className="rounded-2xl" style={{ width:cardW, boxShadow:"0 8px 32px rgba(0,0,0,0.18),0 2px 8px rgba(0,0,0,0.12)" }}>
        <div className="rounded-2xl p-3 flex flex-col gap-1.5" style={{ background:"linear-gradient(135deg,rgba(255,255,255,0.72) 0%,rgba(255,255,255,0.48) 100%)", backdropFilter:"blur(20px) saturate(180%)", border:"1px solid rgba(255,255,255,0.55)", isolation:"isolate" }}>
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

const CARD_W = 280, LINE_L = 64, CARD_GAP = 10;

const TextAnnotationDesktop: React.FC<AnnotationProps> = React.memo(({ annotation, isVisible, cardRef, anchorScreenPt }) => {
  const isRight   = annotation.align === "right";
  const lineRef   = useRef<SVGLineElement>(null);
  const prevRef   = useRef(false);
  const hasAnchor = anchorScreenPt?.ok === true;
  const ax = hasAnchor ? anchorScreenPt!.x : 0;
  const ay = hasAnchor ? anchorScreenPt!.y : 0;

  useEffect(() => {
    const line = lineRef.current; if (!line) return;
    if (isVisible && !prevRef.current) {
      line.style.transition = "none";
      line.style.strokeDashoffset = String(LINE_L);
      void line.getBoundingClientRect();
      line.style.transition = "stroke-dashoffset 0.55s cubic-bezier(0.4,0,0.2,1) 0.05s";
      line.style.strokeDashoffset = "0";
    } else if (!isVisible && prevRef.current) {
      line.style.transition = "stroke-dashoffset 0.3s cubic-bezier(0.4,0,0.2,1)";
      line.style.strokeDashoffset = String(LINE_L);
    }
    prevRef.current = isVisible;
  }, [isVisible]);

  const cardLeft  = isRight ? ax - LINE_L - CARD_W - CARD_GAP : ax + LINE_L + CARD_GAP;
  const shouldShow = isVisible && hasAnchor;

  return (
    <div style={{ visibility: hasAnchor ? "visible" : "hidden", pointerEvents:"none" }}>
      <svg style={{ position:"fixed", inset:0, width:"100%", height:"100%", pointerEvents:"none", zIndex:49, overflow:"visible", opacity: shouldShow ? 1 : 0, transition:"opacity 0.5s cubic-bezier(0.4,0,0.2,1)" }}>
        <defs><filter id={`gd-${annotation.id}`} x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
        <line ref={lineRef} x1={ax} y1={ay} x2={isRight ? ax - LINE_L : ax + LINE_L} y2={ay} stroke="#dc2626" strokeWidth="1.5" strokeLinecap="round" strokeDasharray={LINE_L} strokeDashoffset={LINE_L} />
        <circle cx={ax} cy={ay} r="5" fill="none" stroke="#dc2626" strokeWidth="1.5" opacity="0.4"><animate attributeName="r" values="5;11;5" dur="2s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.4;0;0.4" dur="2s" repeatCount="indefinite"/></circle>
        <circle cx={ax} cy={ay} r="4" fill="#dc2626" filter={`url(#gd-${annotation.id})`} />
        <circle cx={ax} cy={ay} r="1.8" fill="#fff" />
      </svg>
      <div ref={cardRef} className="fixed pointer-events-none z-50" style={{ top:`${ay - 8}px`, left:`${cardLeft}px`, opacity: shouldShow ? 1 : 0, transform: shouldShow ? "translateX(0)" : isRight ? "translateX(12px)" : "translateX(-12px)", transition:"opacity 0.5s cubic-bezier(0.4,0,0.2,1) 0.1s, transform 0.5s cubic-bezier(0.4,0,0.2,1) 0.1s", willChange:"opacity, transform" }}>
        <div style={{ width:CARD_W }}>
          <div className={`flex items-center gap-2 mb-1.5 ${isRight ? "justify-end" : "justify-start"}`}>
            <img src={annotation.src} alt={annotation.title} className="w-10 h-10 object-contain flex-shrink-0" draggable={false} />
          </div>
          <h3 className="font-bold font-mono text-gray-900 mb-1.5" style={{ fontSize:"15px", textAlign: isRight ? "right" : "left" }}>{annotation.title}</h3>
          <p className="text-gray-600 font-mono leading-relaxed" style={{ fontSize:"12px", textAlign: isRight ? "right" : "left" }}>{annotation.text}</p>
        </div>
      </div>
    </div>
  );
});
TextAnnotationDesktop.displayName = "TextAnnotationDesktop";

const TextAnnotation: React.FC<AnnotationProps> = (props) =>
  props.deviceType === "sm" || props.deviceType === "md"
    ? <TextAnnotationMobile {...props} />
    : <TextAnnotationDesktop {...props} />;

/* ==================== MAIN COMPONENT ==================== */
export default function Scrollfast() {
  const containerRef  = useRef<HTMLDivElement>(null);
  const canvasRef     = useRef<HTMLCanvasElement>(null);
  const pinWrapperRef = useRef<HTMLDivElement>(null);
  const groundRef     = useRef<THREE.Mesh | null>(null);
  const sceneRef      = useRef<THREE.Scene | null>(null);
  const cameraRef     = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef   = useRef<THREE.WebGLRenderer | null>(null);
  const mixerRef      = useRef<THREE.AnimationMixer | null>(null);
  const actionRef     = useRef<THREE.AnimationAction | null>(null);
  const modelRef      = useRef<THREE.Group | null>(null);
  const dtRef         = useRef<DeviceType>("xl");
  const origCamZRef   = useRef(2);

  const wheelMeshesRef          = useRef<THREE.Mesh[]>([]);
  const wheelOriginalColorsRef  = useRef<Map<THREE.Material, StoredMaterialColors>>(new Map());
  const isWheelRedRef           = useRef(false);

  const videosRef     = useRef<{ video: HTMLVideoElement; texture: THREE.VideoTexture }[]>([]);
  const screenMeshRef = useRef<THREE.Mesh | null>(null);
  const activeVideoRef = useRef(1);

  const pop01MeshRef         = useRef<THREE.Object3D | null>(null);
  const connectorMeshRefs    = useRef<(THREE.Object3D | null)[]>([null, null, null, null]);
  const annotationAnchorRefs = useRef<(THREE.Object3D | null)[]>([null, null]);
  const annCardRefs          = useRef<(HTMLDivElement | null)[]>([null, null, null, null]);

  const hasUserInteractedRef  = useRef(false);
  const pendingVideoIdxRef    = useRef<number | null>(null);
  const safariVideoUnlockedRef = useRef(false);
  const initializedRef        = useRef(false);
  const safariRef             = useRef(false);
  const iosRef                = useRef(false);
  const macosRef              = useRef(false);

  // Scroll-driven state
  const scrollProgressRef  = useRef(0);   // raw 0→1 from ScrollTrigger
  const animFrameRef       = useRef(0);   // current rendered frame (lerped)
  const currentSectionRef  = useRef(0);

  const [loading,          setLoading]          = useState(true);
  const [modelProgress,    setModelProgress]    = useState(0);
  const [error,            setError]            = useState<string | null>(null);
  const [showButtons,      setShowButtons]      = useState(false);
  const [activeVideo,      setActiveVideo]      = useState(1);
  const [deviceType,       setDeviceType]       = useState<DeviceType>("xl");
  const [visibleAnnotations, setVisibleAnnotations] = useState<Set<number>>(new Set());
  const [currentSection,   setCurrentSection]   = useState(0);
  const [connectors,       setConnectors]       = useState<ConnectorState[]>(CONFIG.TEXT_ANNOTATIONS.map(() => ({ meshPt:{x:0,y:0,ok:false}, cardPt:{x:0,y:0} })));
  const [anchorScreenPts,  setAnchorScreenPts]  = useState<ScreenPt[]>(CONFIG.TEXT_ANNOTATIONS.map(() => ({ x:0,y:0,ok:false })));

  /* ── progress → frame (section-to-section mapping with smooth pause/plateaus) ── */
  const progressToFrame = useCallback((p: number): number => {
    const sf = p * SCROLL_SEGMENTS;
    
    // Clamp to the final frame if the user is in the extra tail scroll area
    if (sf >= TOTAL_SECTIONS - 1) {
      return CONFIG.TOTAL_FRAMES;
    }

    const idx  = Math.max(0, Math.floor(sf));
    let t      = sf - idx; 

    // Define a "hold" percentage (e.g., 60% of the scroll segment is fully paused)
    const HOLD_RATIO = idx === 0 ? 0 : 0.6; 

    if (t < HOLD_RATIO) {
      t = 0; 
    } else {
      t = (t - HOLD_RATIO) / (1 - HOLD_RATIO);
      t = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    return STOP_FRAMES[idx] + (STOP_FRAMES[idx + 1] - STOP_FRAMES[idx]) * t;
  }, []);

  /* ── progress → nearest settled section ── */
  const progressToSection = useCallback((p: number): number => {
    const sf = p * SCROLL_SEGMENTS;
    
    // Lock the navigation to the 4th dot while in the tail scroll
    if (sf >= TOTAL_SECTIONS - 1) return TOTAL_SECTIONS - 1; 

    const n  = Math.round(sf);
    return Math.abs(sf - n) < 0.05 ? n : Math.floor(sf);
  }, []);

  /* ── wheel colour tween ── */
  const setWheelRed = useCallback((toRed: boolean) => {
    for (const mesh of wheelMeshesRef.current) {
      for (const mat of (Array.isArray(mesh.material) ? mesh.material : [mesh.material])) {
        const m    = mat as THREE.MeshStandardMaterial;
        const orig = wheelOriginalColorsRef.current.get(mat);
        if (!orig) continue;
        const tc  = toRed ? new THREE.Color(CONFIG.WHEEL.ACTIVE_COLOR) : orig.color;
        const dur = CONFIG.WHEEL.TRANSITION_DURATION;
        if (m.color)   gsap.to(m.color,   { r:tc.r, g:tc.g, b:tc.b, duration:dur, ease:"power2.inOut", onUpdate:() => { m.needsUpdate = true; } });
        if (m.emissive) {
          const ec = toRed ? new THREE.Color(tc.r*.5, tc.g*.5, tc.b*.5) : (orig.emissive ?? new THREE.Color(0,0,0));
          gsap.to(m.emissive, { r:ec.r, g:ec.g, b:ec.b, duration:dur, ease:"power2.inOut" });
        }
        if (m.emissiveIntensity !== undefined)
          gsap.to(m, { emissiveIntensity: toRed ? 1 : (orig.emissiveIntensity ?? 0), duration:dur, ease:"power2.inOut" });
      }
    }
  }, []);

  /* ── Safari video unlock ── */
  const unlockSafariVideos = useCallback(() => {
    if (safariVideoUnlockedRef.current || !needsSafariVideoUnlock()) return;
    safariVideoUnlockedRef.current = true;
    for (const vd of videosRef.current) {
      const p = vd.video.play();
      if (p) p.then(() => { if (vd !== videosRef.current[activeVideoRef.current - 1]) vd.video.pause(); }).catch(() => {});
    }
  }, []);

  const playVideoSafely = useCallback((video: HTMLVideoElement) => {
    video.muted = true;
    const attempt = (retries = 3) => {
      const promise = video.play();
      if (promise) promise.catch(err => { if (retries > 0) setTimeout(() => { video.muted = true; attempt(retries - 1); }, 150); });
    };
    if (video.readyState >= 3) { attempt(); }
    else {
      const onReady = () => { video.removeEventListener("canplaythrough", onReady); attempt(); };
      video.addEventListener("canplaythrough", onReady, { once:true });
      if (needsSafariVideoUnlock()) video.load();
    }
  }, []);

  /* ==================== THREE.JS SETUP ==================== */
  const initScene = useCallback(() => {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(CONFIG.BACKGROUND.COLOR);
    const sl = new THREE.DirectionalLight(0xffffff, 1.5);
    sl.position.set(1, 10, 0); sl.castShadow = true;
    const mob = typeof window !== "undefined" && window.innerWidth < 1024;
    sl.shadow.mapSize.set(mob ? 1024 : 2048, mob ? 1024 : 2048);
    sl.shadow.camera.near = 0.2; sl.shadow.camera.far = 20;
    sl.shadow.bias = 1e-8; sl.shadow.normalBias = 1e-8;
    const d = mob ? 3 : 15;
    Object.assign(sl.shadow.camera, { left:-d, right:d, top:d, bottom:-d });
    scene.add(sl, new THREE.AmbientLight(0xffffff, 0.8));
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(100, 100), new THREE.ShadowMaterial({ opacity:0.5, transparent:true }));
    ground.rotation.x = -Math.PI / 2; ground.position.y = -100; ground.receiveShadow = true;
    groundRef.current = ground; scene.add(ground); sceneRef.current = scene;
  }, []);

  const initRenderer = useCallback(() => {
    if (!canvasRef.current || rendererRef.current) return;
    const safari = isSafari(), ios = isIOS(), macos = isMacOS();
    safariRef.current = safari; iosRef.current = ios; macosRef.current = macos;
    const r = new THREE.WebGLRenderer({ canvas: canvasRef.current, antialias:!ios, alpha:false, powerPreference:"high-performance", precision: ios ? "mediump" : "highp", preserveDrawingBuffer: ios || (safari && macos) });
    r.setPixelRatio(Math.min(window.devicePixelRatio, ios ? 1.5 : CONFIG.RENDERER.MAX_PIXEL_RATIO));
    r.setSize(window.innerWidth, window.innerHeight);
    r.outputColorSpace    = THREE.SRGBColorSpace;
    r.toneMapping         = THREE.ACESFilmicToneMapping;
    r.toneMappingExposure = CONFIG.RENDERER.TONE_MAPPING_EXPOSURE;
    r.shadowMap.enabled   = true;
    r.shadowMap.type      = THREE.PCFSoftShadowMap;
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
        hdr => { try { sceneRef.current!.environment = pmrem.fromEquirectangular(hdr).texture; } catch(e){} finally { hdr.dispose(); pmrem.dispose(); } },
        undefined,
        () => { pmrem.dispose(); sceneRef.current?.add(new THREE.AmbientLight(0xffffff, 0.6)); }
      );
    } catch(e) {}
  }, []);

  const applyVideoToScreen = useCallback((idx: number) => {
    const vd = videosRef.current[idx - 1], mesh = screenMeshRef.current;
    if (!vd || !mesh) return;
    videosRef.current.forEach((v, i) => { if (i !== idx - 1) { v.video.pause(); v.video.currentTime = 0; } });
    mesh.material = new THREE.MeshStandardMaterial({ map:vd.texture, emissive:new THREE.Color(0xffffff), emissiveMap:vd.texture, emissiveIntensity:1.0, roughness:0.5, metalness:0.0, transparent:false, depthWrite:true });
    if (needsSafariVideoUnlock() && !safariVideoUnlockedRef.current) { pendingVideoIdxRef.current = idx; vd.video.load(); }
    else playVideoSafely(vd.video);
  }, [playVideoSafely]);

  const setupVideos = useCallback((model: THREE.Group) => {
    for (const vc of CONFIG.VIDEOS) {
      const vd = createVideoTexture(vc.path);
      if (vd) { videosRef.current.push(vd); setTimeout(() => vd.video.load(), 0); }
    }
    const anchorNames = CONFIG.ANNOTATION_ANCHOR_MESHES.map(n => n.toLowerCase());
    model.traverse(child => {
      if (!(child as THREE.Mesh).isMesh) return;
      const mesh = child as THREE.Mesh, nameLc = child.name.toLowerCase();
      if (anchorNames.some(an => nameLc === an)) return;
      if (nameLc === CONFIG.SCREEN.MESH_NAME.toLowerCase() || (mesh.material as any)?.name?.toLowerCase().includes(CONFIG.SCREEN.MATERIAL_NAME)) screenMeshRef.current = mesh;
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
        wheelOriginalColorsRef.current.set(mat, { color:m.color?.clone() ?? new THREE.Color(0xffffff), emissive:m.emissive?.clone(), emissiveIntensity:m.emissiveIntensity });
      }
    });
    wheelMeshesRef.current = meshes;
  }, []);

  const setupConnectorMeshes = useCallback((model: THREE.Group) => {
    const names = CONFIG.TEXT_ANNOTATIONS.map(a => (a as any).meshName as string);
    model.traverse(child => {
      const lc = child.name.toLowerCase();
      names.forEach((name, i) => { if (!connectorMeshRefs.current[i] && lc === name.toLowerCase()) connectorMeshRefs.current[i] = child; });
    });
  }, []);

  const setupAnnotationAnchors = useCallback((model: THREE.Group) => {
    CONFIG.ANNOTATION_ANCHOR_MESHES.forEach((anchorName, i) => {
      model.traverse(child => {
        if (!annotationAnchorRefs.current[i] && child.name.toLowerCase() === anchorName.toLowerCase()) {
          child.visible = false; annotationAnchorRefs.current[i] = child;
        }
      });
    });
  }, []);

  const updateModelLayout = useCallback(() => {
    if (!modelRef.current) return;
    const dt = getDeviceType();
    if (dtRef.current !== dt) { dtRef.current = dt; setDeviceType(dt); if (pop01MeshRef.current) pop01MeshRef.current.visible = isMobileDevice(dt); }
    const s = CONFIG.MODEL.SCALE[dt]; modelRef.current.scale.set(s,s,s); centerModel(modelRef.current, dt);
    const box = new THREE.Box3().setFromObject(modelRef.current);
    if (groundRef.current) groundRef.current.position.y = box.min.y;
    if (cameraRef.current) { cameraRef.current.position.z = origCamZRef.current * (dt==="sm"?5:dt==="md"?4:2); cameraRef.current.aspect = window.innerWidth/window.innerHeight; cameraRef.current.updateProjectionMatrix(); }
  }, []);

  const loadModel = useCallback(() => {
    if (!sceneRef.current || !rendererRef.current) return;
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath("https://www.gstatic.com/draco/versioned/decoders/1.5.6/");
    const loader = new GLTFLoader(); loader.setDRACOLoader(dracoLoader);
    loader.load(CONFIG.MODEL.PATH,
      gltf => {
        const model = gltf.scene; modelRef.current = model;
        if (gltf.cameras?.length) {
          const gc = gltf.cameras[0];
          if (gc instanceof THREE.PerspectiveCamera) {
            const dt = getDeviceType(); dtRef.current = dt; setDeviceType(dt);
            origCamZRef.current = gc.position.z;
            gc.fov = dt==="sm"?80:dt==="md"?60:dt==="lg"?50:Math.min(gc.fov, 75);
            gc.aspect = window.innerWidth/window.innerHeight; gc.near = 0.1; gc.far = 1000;
            gc.position.z *= dt==="sm"?2:dt==="md"?1.8:dt==="lg"?1.3:1;
            gc.updateProjectionMatrix(); cameraRef.current = gc;
          }
        }
        model.traverse(child => { if (child.name.toLowerCase() === "pop01") { pop01MeshRef.current = child; child.visible = isMobileDevice(dtRef.current); } });
        model.traverse(child => {
          if (!(child as THREE.Mesh).isMesh) return;
          const mesh = child as THREE.Mesh; mesh.castShadow = true; mesh.receiveShadow = true;
          const isScreen = child.name.toLowerCase().includes(CONFIG.SCREEN.MESH_NAME.toLowerCase());
          for (const m of (Array.isArray(mesh.material) ? mesh.material : [mesh.material])) optimizeMaterial(m, rendererRef.current!, isScreen);
        });
        const dt = getDeviceType(), s = CONFIG.MODEL.SCALE[dt];
        model.scale.set(s,s,s); centerModel(model, dt);
        const box = new THREE.Box3().setFromObject(model);
        if (groundRef.current) groundRef.current.position.y = box.min.y;
        sceneRef.current!.add(model);
        setupVideos(model); setupWheelMeshes(model); setupConnectorMeshes(model); setupAnnotationAnchors(model);
        if (gltf.animations.length) {
          const mixer  = new THREE.AnimationMixer(model);
          const action = mixer.clipAction(gltf.animations[0]);
          action.play(); action.paused = true;
          mixerRef.current = mixer; actionRef.current = action;
        }
        animFrameRef.current = 0; currentSectionRef.current = 0;
        dracoLoader.dispose();
        setLoading(false); setModelProgress(100);
        requestAnimationFrame(() => ScrollTrigger.refresh());
      },
      xhr => { if (xhr?.lengthComputable) setModelProgress(Math.round((xhr.loaded / xhr.total) * 100)); },
      err => { console.error(err); dracoLoader.dispose(); setError("Failed to load 3D model."); setLoading(false); setModelProgress(100); }
    );
  }, [setupVideos, setupWheelMeshes, setupConnectorMeshes, setupAnnotationAnchors]);

  /* ==================== SCROLLTRIGGER PIN ==================== */
  useEffect(() => {
    if (loading) return;
    const section = pinWrapperRef.current;
    if (!section) return;

    // Use the new SCROLL_SEGMENTS so the pin lasts longer
    const pinDistance = window.innerHeight * (VH_PER_SECTION / 100) * SCROLL_SEGMENTS;

    const st = ScrollTrigger.create({
      trigger:      section,
      start:        `top ${NAV_HEIGHT}px`,
      end:          `+=${pinDistance}`,
      pin:          true,
      pinSpacing:   true,
      anticipatePin: 1,
      onUpdate:     self => { scrollProgressRef.current = self.progress; },
    });

    const markInteracted = () => {
      if (hasUserInteractedRef.current) return;
      hasUserInteractedRef.current = true;
      unlockSafariVideos();
      if (pendingVideoIdxRef.current !== null) {
        const idx = pendingVideoIdxRef.current; pendingVideoIdxRef.current = null;
        const vd = videosRef.current[idx - 1]; if (vd) playVideoSafely(vd.video);
      }
    };
    window.addEventListener("pointerdown", markInteracted, { passive:true, once:true });

    return () => {
      st.kill();
      window.removeEventListener("pointerdown", markInteracted);
    };
  }, [loading, unlockSafariVideos, playVideoSafely]);

  /* ==================== RENDER LOOP ==================== */
  useEffect(() => {
    let rafId: number, lastT = performance.now();
    const prevAnnIds = { current: [] as number[] };

    const animate = (now: number) => {
      rafId = requestAnimationFrame(animate);
      if (document.visibilityState === "hidden") { lastT = now; return; }
      const dt = Math.min((now - lastT) / 1000, 0.05); lastT = now;
      if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return;

      // ── Lerp frame toward scroll target ──
      const targetFrame = progressToFrame(scrollProgressRef.current);
      const diff        = targetFrame - animFrameRef.current;
      animFrameRef.current = Math.abs(diff) < SNAP_THRESHOLD ? targetFrame : animFrameRef.current + diff * Math.min(LERP_SPEED * dt, 1);
      const frame    = animFrameRef.current;
      const settled  = Math.abs(diff) < 0.5;

      // ── Section tracking ──
      const section = progressToSection(scrollProgressRef.current);
      if (section !== currentSectionRef.current) { currentSectionRef.current = section; setCurrentSection(section); }

      // ── Video switcher button visibility ──
      if (frame >= CONFIG.TOTAL_FRAMES - 1)     setShowButtons(true);
      else if (frame < CONFIG.TOTAL_FRAMES - 10) setShowButtons(false);

      // ── Annotation visibility — frame-based so text tracks the animation ──
      const FADE = 4;
      const nextIds: number[] = [];
      for (const a of CONFIG.TEXT_ANNOTATIONS) {
        const inRange = frame >= (a.frameStart - FADE) && frame <= (a.frameEnd + FADE);
        if (inRange) nextIds.push(a.id);
      }
      const prev = prevAnnIds.current;
      if (nextIds.length !== prev.length || nextIds.some((v, i) => v !== prev[i])) {
        prevAnnIds.current = nextIds; setVisibleAnnotations(new Set(nextIds));
      }

      // ── Wheel LED colour ──
      let red = false;
      for (const a of CONFIG.TEXT_ANNOTATIONS) { if (frame >= a.frameStart && frame <= a.frameEnd && (a as any).triggerWheelColorChange) { red = true; break; } }
      if (red !== isWheelRedRef.current) { setWheelRed(red); isWheelRedRef.current = red; }

      // ── Drive animation mixer ──
      if (mixerRef.current && actionRef.current) {
        const clip = actionRef.current.getClip();
        actionRef.current.time = (frame / CONFIG.TOTAL_FRAMES) * clip.duration;
        mixerRef.current.update(0);
      }

      // ── Video texture update ──
      const vd = videosRef.current[activeVideoRef.current - 1];
      const minRS = (iosRef.current || (safariRef.current && macosRef.current)) ? 4 : 2;
      if (vd && !vd.video.paused && vd.video.readyState >= minRS) vd.texture.needsUpdate = true;

      rendererRef.current.render(sceneRef.current, cameraRef.current);
      const cam = cameraRef.current;

      // ── Connector screen positions (mobile) ──
      setConnectors(prev => {
        let dirty = false;
        const next: ConnectorState[] = prev.map((c, i) => {
          const ann = CONFIG.TEXT_ANNOTATIONS[i];
          const inRange = frame >= ann.frameStart && frame <= ann.frameEnd;
          if (!inRange) { if (!c.meshPt.ok) return c; dirty = true; return { ...c, meshPt:{...c.meshPt, ok:false} }; }
          const meshObj = i === 1 ? (connectorMeshRefs.current[i] ?? screenMeshRef.current) : connectorMeshRefs.current[i];
          if (!meshObj) return c;
          const proj = i === 1 ? toScreenBottomCenter(meshObj, cam) : toScreen(meshObj, cam);
          if (!proj) { if (!c.meshPt.ok) return c; dirty = true; return { ...c, meshPt:{...c.meshPt, ok:false} }; }
          const cardEl = annCardRefs.current[i];
          let ax = c.cardPt.x, ay = c.cardPt.y;
          if (cardEl) { const r = cardEl.getBoundingClientRect(); ax = r.left + r.width/2; ay = r.top; }
          if (c.meshPt.ok && Math.abs(c.meshPt.x-proj.x) < 0.5 && Math.abs(c.meshPt.y-proj.y) < 0.5 && Math.abs(c.cardPt.x-ax) < 0.5 && Math.abs(c.cardPt.y-ay) < 0.5) return c;
          dirty = true;
          return { meshPt:{x:proj.x, y:proj.y, ok:true}, cardPt:{x:ax, y:ay} };
        });
        return dirty ? next : prev;
      });

      // ── Anchor screen positions (desktop) ──
      setAnchorScreenPts(prev => {
        let dirty = false;
        const next: ScreenPt[] = prev.map((pt, i) => {
          const ann = CONFIG.TEXT_ANNOTATIONS[i];
          const anchorObj = annotationAnchorRefs.current[i];
          const inFrameRange = frame >= ann.frameStart && frame <= ann.frameEnd;
          if (!inFrameRange || !anchorObj) { if (!pt.ok) return pt; dirty = true; return {...pt, ok:false}; }
          if (pt.ok) return pt;
          if (!settled) return pt;
          const proj = toScreen(anchorObj, cam);
          if (!proj) return pt;
          dirty = true; return { x:proj.x, y:proj.y, ok:true };
        });
        return dirty ? next : prev;
      });
    };

    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [setWheelRed, progressToFrame, progressToSection]);

  /* ==================== VISIBILITY CHANGE ==================== */
  useEffect(() => {
    const onVis = () => {
      const vd = videosRef.current[activeVideoRef.current - 1]; if (!vd) return;
      document.visibilityState === "hidden" ? vd.video.pause() : hasUserInteractedRef.current && playVideoSafely(vd.video);
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [playVideoSafely]);

  /* ==================== INIT ==================== */
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    initScene(); initRenderer(); loadEnvironment(); loadModel();

    const onResize = () => {
      if (!rendererRef.current || !cameraRef.current) return;
      const dt = getDeviceType();
      if (dtRef.current !== dt) {
        dtRef.current = dt; setDeviceType(dt);
        if (cameraRef.current instanceof THREE.PerspectiveCamera) cameraRef.current.fov = dt==="sm"?80:dt==="md"?60:dt==="lg"?50:75;
        updateModelLayout();
        if (pop01MeshRef.current) pop01MeshRef.current.visible = isMobileDevice(dt);
      }
      cameraRef.current.aspect = window.innerWidth / window.innerHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(window.innerWidth, window.innerHeight);
      ScrollTrigger.refresh();
    };
    window.addEventListener("resize", onResize);

    const canvas = canvasRef.current;
    const onCL = (e: Event) => { e.preventDefault(); };
    const onCR = () => { rendererRef.current?.dispose(); rendererRef.current = null; initializedRef.current = false; initRenderer(); loadEnvironment(); };
    canvas?.addEventListener("webglcontextlost",     onCL, false);
    canvas?.addEventListener("webglcontextrestored", onCR, false);

    return () => {
      window.removeEventListener("resize", onResize);
      canvas?.removeEventListener("webglcontextlost",     onCL);
      canvas?.removeEventListener("webglcontextrestored", onCR);
      for (const v of videosRef.current) { v.video.pause(); v.video.removeAttribute("src"); v.video.load(); v.texture.dispose(); if (v.video.parentNode) v.video.parentNode.removeChild(v.video); }
      videosRef.current = [];
      sceneRef.current?.traverse(obj => { if (!(obj as THREE.Mesh).isMesh) return; const m = obj as THREE.Mesh; m.geometry?.dispose(); for (const mat of (Array.isArray(m.material) ? m.material : [m.material])) mat.dispose(); });
      sceneRef.current?.clear();
      rendererRef.current?.forceContextLoss(); rendererRef.current?.dispose(); rendererRef.current = null;
      modelRef.current = null; mixerRef.current = null; actionRef.current = null;
      pop01MeshRef.current = null; connectorMeshRefs.current = [null,null,null,null]; annotationAnchorRefs.current = [null,null];
      wheelMeshesRef.current = []; wheelOriginalColorsRef.current.clear();
      initializedRef.current = false;
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, [initScene, initRenderer, loadEnvironment, loadModel, updateModelLayout]);

  /* ── Dot click: smooth scroll to the target section position ── */
  const switchVideo = useCallback((idx: number) => { activeVideoRef.current = idx; setActiveVideo(idx); applyVideoToScreen(idx); }, [applyVideoToScreen]);

  const handleDotClick = useCallback((idx: number) => {
    hasUserInteractedRef.current = true;
    unlockSafariVideos();
    if (pendingVideoIdxRef.current !== null) {
      const p = pendingVideoIdxRef.current; pendingVideoIdxRef.current = null;
      const vd = videosRef.current[p - 1]; if (vd) playVideoSafely(vd.video);
    }
    const st = ScrollTrigger.getAll()[0];
    if (!st) return;
    
    // Updated Math to use SCROLL_SEGMENTS for correct jumping
    const targetY = (st.start as number) + (idx / SCROLL_SEGMENTS) * ((st.end as number) - (st.start as number));
    
    gsap.to(window, { scrollTo: { y: targetY, autoKill: false }, duration: 1.0, ease: "power2.inOut" });
  }, [playVideoSafely, unlockSafariVideos]);

  const annotationElements = useMemo(() =>
    CONFIG.TEXT_ANNOTATIONS.map((a, i) => {
      const isDesktop = deviceType === "lg" || deviceType === "xl";
      const isVisible = isDesktop ? (anchorScreenPts[i]?.ok === true) : visibleAnnotations.has(a.id);
      return (
        <TextAnnotation
          key={a.id}
          annotation={a}
          isVisible={isVisible}
          deviceType={deviceType}
          cardRef={el => { annCardRefs.current[i] = el; }}
          anchorScreenPt={anchorScreenPts[i]}
        />
      );
    }), [visibleAnnotations, deviceType, anchorScreenPts]);

  return (
    <>
      <Preloader progress={modelProgress} visible={loading} />

      {/* ScrollTrigger pins this wrapper. Height = one viewport minus fixed nav. */}
      <div
        ref={pinWrapperRef}
        style={{ height: `calc(100vh - ${NAV_HEIGHT}px)`, width: "100%", position: "relative", overflow: "hidden" }}
      >
        <div
          ref={containerRef}
          className="relative w-full h-full overflow-hidden"
          style={{ touchAction: "pan-y" }}
        >
          <canvas ref={canvasRef} className="w-full h-full" style={{ display: "block" }} />

          {CONFIG.TEXT_ANNOTATIONS.map((a, i) => (
            <ConnectorLine key={a.id} meshPt={connectors[i].meshPt} cardPt={connectors[i].cardPt} visible={visibleAnnotations.has(a.id)} deviceType={deviceType} />
          ))}

          {annotationElements}

          {/* Section nav dots */}
          <div className="absolute right-4 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-3">
            {STOP_FRAMES.map((_, idx) => (
              <button
                key={idx}
                onClick={() => handleDotClick(idx)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${currentSection === idx ? "bg-red-600 scale-125" : "bg-gray-400 hover:bg-gray-600"}`}
                aria-label={`Go to section ${idx + 1}`}
              />
            ))}
          </div>

          {error && (
            <div className="absolute inset-0 flex items-center justify-center z-50 bg-black/80">
              <div className="text-red-500 text-xl max-w-md text-center p-4">{error}</div>
            </div>
          )}

          {showButtons && !loading && !error && (
            <div className="absolute top-22 left-0 right-0 z-[9999] px-2 md:px-0 pointer-events-none">
              <div className="max-w-7xl mx-auto flex justify-center pointer-events-auto">
                <div className="bg-white rounded-full p-1 shadow-lg inline-flex items-center gap-1">
                  {CONFIG.VIDEOS.map(video => (
                    <button
                      key={video.id}
                      onClick={() => switchVideo(video.id)}
                      className={`px-5 md:px-6 py-2 md:py-2.5 rounded-full font-medium text-sm md:text-base transition-all duration-300 ease-out ${activeVideo === video.id ? "bg-red-600 text-white shadow-md" : "bg-transparent text-gray-700 hover:bg-gray-100"}`}
                    >
                      <span className="whitespace-nowrap">{video.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}