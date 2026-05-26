"use client";

import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);
}

/* ================================================================
   CONFIG — FRAME PATHS
   ================================================================ */

const FRAME_COUNT = 900;
const CDN_BASE_URL = "https://do55ukdqgl59f.cloudfront.net";
const desktopFramePath = (i: number) => `${CDN_BASE_URL}/frames/${i}.webp`;
const mobileFramePath = (i: number) => `/mobile-frames/${i}.webp`;

/* ================================================================
   CONFIG — DESKTOP
   ================================================================ */

const DESKTOP_SECTIONS = [
  { id: 1, name: "Workout",   frameStart: 210, frameEnd: 433 },
  { id: 2, name: "Landscape", frameStart: 500, frameEnd: 666 },
  { id: 3, name: "Gaming",    frameStart: 795, frameEnd: 900 },
];

const DESKTOP_HOTSPOTS = [
  {
    id: 1,
    showDuringSection: 1,
    title: "Dynamic LED Light",
    desc: "Color changing LED responds to your speed, enhancing focus and energy.",
    src: "https://do55ukdqgl59f.cloudfront.net/incandescent-light-bulb-svgrepo-com%201.svg",
    cardStyle: { bottom: "20%", right: "17%" } as React.CSSProperties,
    lineFrom: "left" as const,
    showAtFrame: { start: 45, end: 57 },
  },
  {
    id: 2,
    showDuringSection: 2,
    title: "21.5\u2033 Display",
    desc: "With the 360-degree swiveling touch display, your workouts are more flexible than ever!",
    src: "https://do55ukdqgl59f.cloudfront.net/incandescent-light-bulb-svgrepo-com%201.svg",
    cardStyle: { top: "25%", left: "6%" } as React.CSSProperties,
    lineFrom: "right" as const,
    showAtFrame: { start: 110, end: 150 },
  },
];

const DESKTOP_PAUSE_POINTS: { at: number; holdPx: number }[] = [
  { at: 50,  holdPx: 300 },
  { at: 130, holdPx: 200 },
];
const DESKTOP_INTRO_END_FRAME = 200;

/* ================================================================
   CONFIG — MOBILE
   ================================================================ */

const MOBILE_SECTIONS = [
  { id: 1, name: "Workout",   frameStart: 210, frameEnd: 307 },
  { id: 2, name: "Landscape", frameStart: 308, frameEnd: 453 },
  { id: 3, name: "Gaming",    frameStart: 454, frameEnd: 900 },
];

const MOBILE_HOTSPOTS = [
  {
    id: 1,
    showDuringSection: 1,
    title: "Dynamic LED Light",
    desc: "Color changing LED responds to your speed, enhancing focus and energy.",
    src: "https://do55ukdqgl59f.cloudfront.net/incandescent-light-bulb-svgrepo-com%201.svg",
    cardStyle: { bottom: "12%", left: "50%", transform: "translateX(-50%)" } as React.CSSProperties,
    lineFrom: "left" as const,
    showAtFrame: { start: 45, end: 57 },
  },
  {
    id: 2,
    showDuringSection: 2,
    title: "21.5\u2033 Display",
    desc: "360-degree swiveling touch display for flexible workouts.",
    src: "https://do55ukdqgl59f.cloudfront.net/incandescent-light-bulb-svgrepo-com%201.svg",
    cardStyle: { bottom: "12%", left: "50%", transform: "translateX(-50%)" } as React.CSSProperties,
    lineFrom: "right" as const,
    showAtFrame: { start: 80, end: 130 },
  },
];

const MOBILE_PAUSE_POINTS: { at: number; holdPx: number }[] = [
  { at: 50,  holdPx: 300 },
  { at: 120, holdPx: 200 },
];
const MOBILE_INTRO_END_FRAME = 160;

/* ================================================================
   CONFIG — SECTION ANNOTATIONS
   Desktop: bottom-center cinematic subtitle style
   Mobile:  bottom-left small stacked text
   ================================================================ */



/* ================================================================
   SHARED CONSTANTS
   ================================================================ */

const SCROLL_DISTANCE = 6000;
const READY_THRESHOLD = 100;
const HOTSPOT_SHOW_DELAY = 100;
const SCROLL_SETTLE_DELAY = 250;
const MAX_BG_CONCURRENT_DESKTOP = 32;
const MAX_BG_CONCURRENT_MOBILE = 16;

/* ================================================================
   RESPONSIVE
   ================================================================ */

type Breakpoint = "sm" | "md" | "lg";
function useBreakpoint(): Breakpoint {
  const [bp, setBp] = useState<Breakpoint>("lg");
  useEffect(() => {
    const update = () =>
      setBp(window.innerWidth < 640 ? "sm" : window.innerWidth < 1024 ? "md" : "lg");
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return bp;
}

/* ================================================================
   HOTSPOT CARD
   ================================================================ */
type HotspotType = typeof DESKTOP_HOTSPOTS[number];

const HotspotCard: React.FC<{
  spot: HotspotType; visible: boolean; bp: Breakpoint;
}> = React.memo(({ spot, visible, bp }) => {
  const isMobile = bp === "sm";
  const cardW = isMobile ? 200 : 256;
  const lineLen = 80;
  const isLeft = spot.lineFrom === "left";

  // Mobile: always bottom-center; Desktop: use configured cardStyle position
  const posStyle: React.CSSProperties = isMobile
    ? { bottom: "12%", left: "50%" }
    : spot.cardStyle;

  const entranceTranslate = visible ? "translateY(0) scale(1)" : "translateY(20px) scale(0.95)";
  const finalTransform = isMobile
    ? `translateX(-50%) ${entranceTranslate}`
    : entranceTranslate;

  const svgStyle: React.CSSProperties = {
    position: "absolute", top: "50%", transform: "translateY(-50%)",
    ...(isLeft ? { right: "100%" } : { left: "100%" }),
    width: lineLen, height: 32, overflow: "visible", pointerEvents: "none",
  };
  const lx1 = isLeft ? lineLen : 0;
  const lx2 = isLeft ? 0 : lineLen;
  const dotCx = isLeft ? 0 : lineLen;

  return (
    <div style={{
      position: "absolute", ...posStyle, width: cardW, zIndex: 40,
      borderRadius: 16, display: "flex", flexDirection: "column", gap: 6,
      opacity: visible ? 1 : 0, pointerEvents: visible ? "auto" : "none",
      transform: finalTransform,
      transition: "opacity 0.35s cubic-bezier(0.4,0,0.2,1), transform 0.35s cubic-bezier(0.4,0,0.2,1)",
      background: "linear-gradient(135deg,rgba(255,255,255,0.72) 0%,rgba(255,255,255,0.48) 100%)",
      WebkitBackdropFilter: "blur(20px) saturate(180%)", backdropFilter: "blur(20px) saturate(180%)",
      border: "1px solid rgba(255,255,255,0.55)", borderTop: "1px solid rgba(255,255,255,0.80)",
      borderLeft: "1px solid rgba(255,255,255,0.80)",
      boxShadow: "0 8px 32px rgba(0,0,0,0.18), inset 0 1px 1px rgba(255,255,255,0.90)",
      isolation: "isolate", padding: isMobile ? "10px" : "12px",
    }}>
      {/* Connector line — desktop only */}
      {!isMobile && (
        <svg style={svgStyle}>
          <line x1={lx1} y1={16} x2={lx2} y2={16} stroke="#dc2626" strokeWidth="1.5" strokeLinecap="round"
            strokeDasharray={lineLen} strokeDashoffset={visible ? 0 : lineLen}
            style={{ transition: "stroke-dashoffset 0.6s cubic-bezier(0.4,0,0.2,1) 0.15s" }} />
          <g style={{ opacity: visible ? 1 : 0, transition: "opacity 0.3s ease 0.5s" }}>
            <circle cx={dotCx} cy={16} r="5" fill="none" stroke="#dc2626" strokeWidth="1.5" opacity="0.4">
              <animate attributeName="r" values="5;11;5" dur="2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.4;0;0.4" dur="2s" repeatCount="indefinite" />
            </circle>
            <circle cx={dotCx} cy={16} r="4" fill="#dc2626" />
            <circle cx={dotCx} cy={16} r="1.8" fill="#fff" />
          </g>
        </svg>
      )}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <img src={spot.src} alt={spot.title} style={{ width: isMobile ? 32 : 40, height: isMobile ? 32 : 40, objectFit: "contain", borderRadius: 8, flexShrink: 0 }} draggable={false} />
        <h3 style={{ margin: 0, fontSize: isMobile ? 11 : 12, fontWeight: 500, fontFamily: "var(--font-soehne), sans-serif", color: "#111", lineHeight: 1.3 }}>{spot.title}</h3>
      </div>
      <p style={{ margin: 0, fontSize: isMobile ? 9 : 10, fontFamily: "var(--font-soehne), sans-serif", color: "#555", lineHeight: 1.6, fontWeight: 400 }}>{spot.desc}</p>
    </div>
  );
});
HotspotCard.displayName = "HotspotCard";

/* ================================================================
   SECTION ANNOTATION
   Desktop: bottom-center cinematic subtitle style
   Mobile:  bottom-left small stacked text with red accent bar
   ================================================================ */




/* ================================================================
   SCROLL HINT
   ================================================================ */
const ScrollHint: React.FC<{ visible: boolean }> = ({ visible }) => (
  <div style={{
    position: "absolute", bottom: 48, left: "50%", zIndex: 60,
    display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
    pointerEvents: "none", opacity: visible ? 0.9 : 0,
    transform: "translateX(-50%)", transition: "opacity 0.6s ease",
  }}>
    <style>{`@keyframes scrollBounce{0%,100%{transform:translateY(0);opacity:.9}50%{transform:translateY(8px);opacity:.4}}`}</style>
    <div style={{ animation: "scrollBounce 2s ease-in-out infinite" }}>
      <span style={{ display: "block", fontFamily: "var(--font-soehne), sans-serif", fontSize: 11, letterSpacing: "0.2em", color: "#fff", textTransform: "uppercase", textAlign: "center", marginBottom: 8 }}>Scroll to explore</span>
      <svg width="18" height="26" viewBox="0 0 18 26" fill="none" style={{ display: "block", margin: "0 auto" }}>
        <rect x="5.5" y="0.5" width="7" height="15" rx="3.5" stroke="white" strokeOpacity="0.6" />
        <rect x="8" y="3" width="2" height="5" rx="1" fill="white" fillOpacity="0.8" />
        <path d="M3 18l6 7 6-7" stroke="white" strokeOpacity="0.6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  </div>
);

/* ================================================================
   MAIN COMPONENT
   ================================================================ */
export default function ScrollFrames({ src }: { src?: string }) {
  const bp = useBreakpoint();
  const isMobile = bp === "sm";

  const SECTIONS        = isMobile ? MOBILE_SECTIONS     : DESKTOP_SECTIONS;
  const HOTSPOTS        = isMobile ? MOBILE_HOTSPOTS     : DESKTOP_HOTSPOTS;
  const PAUSE_POINTS    = isMobile ? MOBILE_PAUSE_POINTS : DESKTOP_PAUSE_POINTS;
  const INTRO_END_FRAME = isMobile ? MOBILE_INTRO_END_FRAME : DESKTOP_INTRO_END_FRAME;
  const TOTAL_DOT_STOPS = PAUSE_POINTS.length + 1;

  /* ── State ─────────────────────────────────────────────────── */
  const [activeSection, setActiveSection]     = useState<number | null>(null);
  const [introComplete, setIntroComplete]     = useState(false);
  const [hotspotVisible, setHotspotVisible]   = useState<Record<number, boolean>>({});
  const [currentDot, setCurrentDot]           = useState(0);
  const [showButtons, setShowButtons]         = useState(false);
  const [canvasReady, setCanvasReady]         = useState(false);

  /* ── Refs ──────────────────────────────────────────────────── */
  const containerRef  = useRef<HTMLDivElement>(null);
  const canvasRef     = useRef<HTMLCanvasElement>(null);
  const progressRef   = useRef<HTMLDivElement>(null);
  const tlRef         = useRef<gsap.core.Timeline | null>(null);

  const imagesRef = useRef<(HTMLImageElement | null)[]>([]);
  const loadedRef = useRef<boolean[]>([]);

  const targetFrameRef = useRef(1);
  const drawnFrameRef  = useRef(-1);
  const rafRef         = useRef(0);

  const stProxyRef      = useRef({ frame: 1 });
  const proxyRef        = useRef({ frame: 1 });
  const activeTweenRef  = useRef<gsap.core.Tween | null>(null);

  const tweenGenRef            = useRef(0);
  const scrollingToSectionRef  = useRef<number | null>(null);
  const settleTimerRef         = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loopingSectionRef      = useRef<number | null>(null);

  const activeSectionRef   = useRef<number | null>(null);
  const introCompleteRef   = useRef(false);
  const readyRef           = useRef(false);

  const hotspotTimerRef   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingHotspotRef = useRef<Record<number, boolean>>({});

  const bgQueueRef        = useRef<number[]>([]);
  const bgQueueIdxRef     = useRef(0);
  const bgActiveReqRef    = useRef(0);
  const bgLoadStartedRef  = useRef(false);

  const playSectionAnimationRef = useRef<(idx: number) => void>(() => {});

  const isMobileRef = useRef(isMobile);
  useEffect(() => { isMobileRef.current = isMobile; }, [isMobile]);

  const canvasWRef    = useRef(0);
  const canvasHRef    = useRef(0);
  const dprRef        = useRef(1);

  /* ── Reset on breakpoint change ───────────────────────────── */
  const prevIsMobileRef = useRef<boolean | null>(null);
  useEffect(() => {
    if (prevIsMobileRef.current === isMobile) return;
    prevIsMobileRef.current = isMobile;

    cancelAnimationFrame(rafRef.current);
    if (activeTweenRef.current) { activeTweenRef.current.kill(); activeTweenRef.current = null; }
    ScrollTrigger.getAll()
      .filter(t => t.vars.id === "scroll-frames-trigger")
      .forEach(t => t.kill());
    if (hotspotTimerRef.current) clearTimeout(hotspotTimerRef.current);
    if (settleTimerRef.current)  clearTimeout(settleTimerRef.current);

    targetFrameRef.current       = 1;
    drawnFrameRef.current        = -1;
    stProxyRef.current           = { frame: 1 };
    proxyRef.current             = { frame: 1 };
    tweenGenRef.current          = 0;
    scrollingToSectionRef.current = null;
    loopingSectionRef.current    = null;
    activeSectionRef.current     = null;
    introCompleteRef.current     = false;
    pendingHotspotRef.current    = {};
    canvasWRef.current           = 0;
    canvasHRef.current           = 0;
    dprRef.current               = 1;

    setActiveSection(null);
    setIntroComplete(false);
    setHotspotVisible({});
    setCurrentDot(0);
    setShowButtons(false);
  }, [isMobile]);

  /* ================================================================
     CANVAS SIZING
     ================================================================ */
  const resizeTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ctxScaledRef    = useRef(false);

  const initCanvasSize = useCallback((): boolean => {
    const canvas = canvasRef.current;
    if (!canvas) return false;

    const w   = window.innerWidth;
    const h   = window.innerHeight;
    const maxDpr = isMobileRef.current ? 2 : 3;
    const dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, maxDpr));

    if (canvasWRef.current === w && canvasHRef.current === h && dprRef.current === dpr) return false;

    canvasWRef.current  = w;
    canvasHRef.current  = h;
    dprRef.current      = dpr;
    ctxScaledRef.current = false;

    canvas.width  = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
      ctxScaledRef.current = true;
    }

    drawnFrameRef.current = -1;
    return true;
  }, []);

  useEffect(() => {
    if (!canvasReady) return;

    const onResize = () => {
      if (resizeTimerRef.current) clearTimeout(resizeTimerRef.current);
      resizeTimerRef.current = setTimeout(() => {
        const changed = initCanvasSize();
        if (changed) ScrollTrigger.refresh();
      }, 500);
    };

    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      if (resizeTimerRef.current) clearTimeout(resizeTimerRef.current);
    };
  }, [canvasReady, initCanvasSize]);

  /* ================================================================
     SET TARGET FRAME
     ================================================================ */
  const setTargetFrame = useCallback((frame: number) => {
    targetFrameRef.current = frame;
    if (progressRef.current) {
      progressRef.current.style.transform = `scaleX(${Math.min(frame / FRAME_COUNT, 1)})`;
    }
    const f = Math.round(frame);
    const newVis: Record<number, boolean> = {};
    HOTSPOTS.forEach(spot => {
      newVis[spot.id] = introCompleteRef.current
        ? false
        : f >= spot.showAtFrame.start && f <= spot.showAtFrame.end;
    });
    const currentVis = pendingHotspotRef.current;
    let shouldHideNow = false, shouldShowDelay = false;
    for (const id in newVis) {
      const numId = Number(id);
      if (!newVis[numId] && currentVis[numId])  shouldHideNow  = true;
      if (newVis[numId]  && !currentVis[numId]) shouldShowDelay = true;
    }
    if (shouldHideNow) {
      pendingHotspotRef.current = { ...newVis };
      setHotspotVisible({ ...newVis });
      if (hotspotTimerRef.current) { clearTimeout(hotspotTimerRef.current); hotspotTimerRef.current = null; }
    } else if (shouldShowDelay) {
      pendingHotspotRef.current = newVis;
      if (hotspotTimerRef.current) clearTimeout(hotspotTimerRef.current);
      hotspotTimerRef.current = setTimeout(() => {
        setHotspotVisible({ ...pendingHotspotRef.current });
        hotspotTimerRef.current = null;
      }, HOTSPOT_SHOW_DELAY);
    } else {
      pendingHotspotRef.current = { ...newVis };
      setHotspotVisible({ ...newVis });
    }
  }, []);

  /* ================================================================
     RAF RENDER LOOP
     ================================================================ */
  const bitmapCacheRef   = useRef<Map<number, ImageBitmap>>(new Map());
  const bitmapPendingRef = useRef<Set<number>>(new Set());

  const startRafLoop = useCallback(() => {
    const loop = () => {
      const desired = Math.max(1, Math.min(FRAME_COUNT, Math.round(targetFrameRef.current)));

      let target = -1;
      if (loadedRef.current[desired - 1] && imagesRef.current[desired - 1]) {
        target = desired;
      } else {
        let lo = desired - 2, hi = desired;
        while (lo >= 0 || hi < FRAME_COUNT) {
          if (lo >= 0 && loadedRef.current[lo] && imagesRef.current[lo]) { target = lo + 1; break; }
          if (hi < FRAME_COUNT && loadedRef.current[hi] && imagesRef.current[hi]) { target = hi + 1; break; }
          lo--; hi++;
        }
      }

      if (target === -1) { rafRef.current = requestAnimationFrame(loop); return; }

      if (target !== drawnFrameRef.current) {
        const canvas = canvasRef.current;
        const img    = imagesRef.current[target - 1];
        if (canvas && img) {
          const ctx = canvas.getContext("2d");
          if (ctx) {
            const cw  = canvasWRef.current;
            const ch  = canvasHRef.current;
            const dpr = dprRef.current;

            if (cw > 0 && ch > 0 && dpr > 0) {
              if (!ctxScaledRef.current) {
                ctx.setTransform(1, 0, 0, 1, 0, 0);
                ctx.scale(dpr, dpr);
                ctxScaledRef.current = true;
              }

              const iw = img.naturalWidth;
              const ih = img.naturalHeight;
              if (iw > 0 && ih > 0) {
                const scale   = Math.max(cw / iw, ch / ih);
                const drawW   = Math.round(iw * scale);
                const drawH   = Math.round(ih * scale);
                const offsetX = Math.round((cw - drawW) / 2);
                const offsetY = Math.round((ch - drawH) / 2);
                ctx.clearRect(0, 0, cw, ch);

                if (isMobileRef.current && typeof createImageBitmap !== "undefined") {
                  const bm = bitmapCacheRef.current.get(target);
                  if (bm) {
                    ctx.drawImage(bm, offsetX, offsetY, drawW, drawH);
                    drawnFrameRef.current = target;
                  } else if (!bitmapPendingRef.current.has(target)) {
                    bitmapPendingRef.current.add(target);
                    createImageBitmap(img).then(bitmap => {
                      bitmapCacheRef.current.set(target, bitmap);
                      bitmapPendingRef.current.delete(target);
                      bitmapCacheRef.current.forEach((_, key) => {
                        if (Math.abs(key - targetFrameRef.current) > 60) {
                          bitmapCacheRef.current.get(key)?.close();
                          bitmapCacheRef.current.delete(key);
                        }
                      });
                    }).catch(() => { bitmapPendingRef.current.delete(target); });
                    ctx.drawImage(img, offsetX, offsetY, drawW, drawH);
                    drawnFrameRef.current = target;
                  } else {
                    ctx.drawImage(img, offsetX, offsetY, drawW, drawH);
                    drawnFrameRef.current = target;
                  }
                } else {
                  ctx.drawImage(img, offsetX, offsetY, drawW, drawH);
                  drawnFrameRef.current = target;
                }
              }
            }
          }
        }
      }

      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
  }, []);

  /* ================================================================
     BACKGROUND LOADER
     ================================================================ */
  const loadNextBg = useCallback(() => {
    const imgs  = imagesRef.current, loaded = loadedRef.current;
    const maxConcurrent = isMobileRef.current ? MAX_BG_CONCURRENT_MOBILE : MAX_BG_CONCURRENT_DESKTOP;
    const getPath = isMobileRef.current ? mobileFramePath : desktopFramePath;
    while (bgActiveReqRef.current < maxConcurrent && bgQueueIdxRef.current < bgQueueRef.current.length) {
      const idx = bgQueueRef.current[bgQueueIdxRef.current++];
      if (loaded[idx]) continue;
      bgActiveReqRef.current++;
      const img = new Image();
      if (!isMobileRef.current) img.crossOrigin = "anonymous";
      img.decoding = "async";
      img.onload  = () => { loaded[idx] = true; imgs[idx] = img; bgActiveReqRef.current--; loadNextBg(); };
      img.onerror = () => { bgActiveReqRef.current--; loadNextBg(); };
      img.src     = getPath(idx + 1);
      imgs[idx]   = img;
    }
  }, []);

  const reprioritizeBgQueue = useCallback((sectionIndex: number) => {
    const section = SECTIONS[sectionIndex], loaded = loadedRef.current;
    const priority: number[] = [];
    for (let i = section.frameStart; i < section.frameEnd; i++) {
      if (!loaded[i]) priority.push(i);
    }
    if (!priority.length) return;
    const rest = bgQueueRef.current.slice(bgQueueIdxRef.current).filter(f => !priority.includes(f));
    bgQueueRef.current    = [...priority, ...rest];
    bgQueueIdxRef.current = 0;
    loadNextBg();
  }, [loadNextBg]);

  /* ================================================================
     LOADING + CANVAS FIRST PAINT
     ================================================================ */
  useEffect(() => {
    imagesRef.current      = new Array(FRAME_COUNT).fill(null);
    loadedRef.current      = new Array(FRAME_COUNT).fill(false);
    bgQueueRef.current     = [];
    bgQueueIdxRef.current  = 0;
    bgActiveReqRef.current = 0;
    bgLoadStartedRef.current = false;
    readyRef.current       = false;
    drawnFrameRef.current  = -1;
    bitmapCacheRef.current.forEach(bm => bm.close());
    bitmapCacheRef.current.clear();
    bitmapPendingRef.current.clear();

    const getFramePath = isMobile ? mobileFramePath : desktopFramePath;
    const imgs   = imagesRef.current;
    const loaded = loadedRef.current;
    let phase1Done = 0;
    let cancelled  = false;

    const startBgLoad = () => {
      if (bgLoadStartedRef.current || cancelled) return;
      bgLoadStartedRef.current = true;
      const allFramesToLoad = new Set<number>();

      for (let i = READY_THRESHOLD; i < 200;  i += 2) allFramesToLoad.add(i);
      for (let i = 200;            i < 210;   i += 2) allFramesToLoad.add(i);

      DESKTOP_SECTIONS.forEach(s => {
        for (let i = s.frameEnd; i < Math.min(s.frameEnd + 200, FRAME_COUNT); i += 2) allFramesToLoad.add(i);
        for (let i = s.frameStart; i < s.frameEnd; i++) allFramesToLoad.add(i);
      });

      const q: number[] = [];
      const added = new Set<number>();
      const addPattern = (step: number) => {
        for (let i = READY_THRESHOLD; i < FRAME_COUNT; i += step) {
          if (allFramesToLoad.has(i) && !added.has(i)) { q.push(i); added.add(i); }
        }
      };
      addPattern(24); addPattern(12); addPattern(6);
      for (let i = READY_THRESHOLD; i < FRAME_COUNT; i++) {
        if (allFramesToLoad.has(i) && !added.has(i)) { q.push(i); added.add(i); }
      }

      bgQueueRef.current    = q;
      bgQueueIdxRef.current = 0;
      loadNextBg();
    };

    const onLoad = (i: number) => {
      if (cancelled) return;
      loaded[i] = true;
      if (i < READY_THRESHOLD) {
        phase1Done++;
        if (phase1Done === READY_THRESHOLD && !readyRef.current) {
          readyRef.current = true;
          const canvas = canvasRef.current;
          const img0   = imagesRef.current[0];

          if (canvas && img0) {
            const w   = window.innerWidth;
            const h   = window.innerHeight;
            const maxDpr = isMobile ? 2 : 3;
            const dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, maxDpr));

            canvas.width  = Math.round(w * dpr);
            canvas.height = Math.round(h * dpr);
            canvasWRef.current = w;
            canvasHRef.current = h;
            dprRef.current     = dpr;

            const ctx = canvas.getContext("2d");
            if (ctx) {
              ctx.setTransform(1, 0, 0, 1, 0, 0);
              ctx.scale(dpr, dpr);
              ctxScaledRef.current = true;

              const iw = img0.naturalWidth;
              const ih = img0.naturalHeight;
              if (iw > 0 && ih > 0) {
                const scale   = Math.max(w / iw, h / ih);
                const drawW   = Math.round(iw * scale);
                const drawH   = Math.round(ih * scale);
                const offsetX = Math.round((w - drawW) / 2);
                const offsetY = Math.round((h - drawH) / 2);
                ctx.clearRect(0, 0, w, h);
                ctx.drawImage(img0, offsetX, offsetY, drawW, drawH);
                drawnFrameRef.current = 1;
              }
            }
          }

          requestAnimationFrame(() => {
            if (cancelled) return;
            setCanvasReady(true);
            startBgLoad();
          });
        }
      }
    };

    const skipOdd = isMobile;
    for (let i = 0; i < READY_THRESHOLD; i++) {
      if (skipOdd && i % 2 !== 0) { onLoad(i); continue; }
      const img = new Image();
      if (!isMobile) img.crossOrigin = "anonymous";
      img.decoding = "async";
      img.onload  = () => { onLoad(i); };
      img.onerror = () => { onLoad(i); };
      img.src     = getFramePath(i + 1);
      imgs[i]     = img;
    }

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobile]);

  /* ================================================================
     GSAP SCROLL SETUP
     ================================================================ */
  useEffect(() => {
    if (!canvasReady || !containerRef.current) return;

    startRafLoop();
    setTargetFrame(1);

    const stProxy = stProxyRef.current;

    const playSectionAnimation = (sectionIndex: number) => {
      if (activeTweenRef.current) { activeTweenRef.current.kill(); activeTweenRef.current = null; }
      tweenGenRef.current += 1;
      const myGeneration = tweenGenRef.current;
      loopingSectionRef.current = sectionIndex;

      const section = SECTIONS[sectionIndex];
      const total   = section.frameEnd - section.frameStart;
      let ready = 0;
      for (let i = section.frameStart; i < section.frameEnd; i++) {
        if (loadedRef.current[i]) ready++;
      }
      const ratio    = ready / total;
      const baseDur  = total / 17;
      const duration = ratio >= 0.8 ? baseDur : baseDur * (1 + (1 - ratio) * 3);

      proxyRef.current.frame = section.frameStart;
      setTargetFrame(section.frameStart);

      const runTween = () => {
        if (tweenGenRef.current !== myGeneration) return;
        proxyRef.current.frame = section.frameStart;
        activeTweenRef.current = gsap.to(proxyRef.current, {
          frame: section.frameEnd,
          duration,
          ease: "none",
          onUpdate() {
            if (tweenGenRef.current !== myGeneration) return;
            setTargetFrame(proxyRef.current.frame);
          },
          onComplete() {
            if (tweenGenRef.current !== myGeneration) return;
            activeTweenRef.current = null;
            if (loopingSectionRef.current === sectionIndex) runTween();
          },
        });
      };
      runTween();
    };

    playSectionAnimationRef.current = playSectionAnimation;

    const handleScrubUpdate = () => {
      const tl = tlRef.current;
      if (!tl) return;
      const currentTime = tl.time();
      const introTime   = tl.labels["intro_end"] || 9.0;

      if (currentTime < introTime) {
        const nf   = Math.round(stProxy.frame);
        const dotF = [...PAUSE_POINTS.map(p => p.at), INTRO_END_FRAME];
        let nearest = 0, minD = Infinity;
        dotF.forEach((f, i) => { const d = Math.abs(nf - f); if (d < minD) { minD = d; nearest = i; } });
        setCurrentDot(nearest);

        const isIntroComplete = nf >= INTRO_END_FRAME;
        introCompleteRef.current = isIntroComplete;
        setIntroComplete(isIntroComplete);
        setShowButtons(isIntroComplete);

        if (activeSectionRef.current !== null) {
          activeSectionRef.current  = null;
          loopingSectionRef.current = null;
          setActiveSection(null);
          if (activeTweenRef.current) { activeTweenRef.current.kill(); activeTweenRef.current = null; }
          tweenGenRef.current += 1;
        }
        setTargetFrame(nf);
      } else {
        introCompleteRef.current = true;
        setIntroComplete(true);
        setShowButtons(true);

        let newActiveSection = 0;
        if (currentTime >= tl.labels["section_2_start"])      newActiveSection = 2;
        else if (currentTime >= tl.labels["section_1_start"]) newActiveSection = 1;

        if (scrollingToSectionRef.current !== null) {
          if (activeSectionRef.current !== newActiveSection) {
            activeSectionRef.current = newActiveSection;
            setActiveSection(newActiveSection);
          }
          return;
        }

        if (activeSectionRef.current !== newActiveSection) {
          activeSectionRef.current = newActiveSection;
          setActiveSection(newActiveSection);
          playSectionAnimation(newActiveSection);
        }
      }
    };

    const gsapCtx = gsap.context(() => {
      const tl = gsap.timeline({
        onUpdate: handleScrubUpdate,
        scrollTrigger: {
          id: "scroll-frames-trigger",
          trigger: containerRef.current,
          start: "top top",
          end: `+=${SCROLL_DISTANCE}`,
          pin: true,
          pinSpacing: true,
          scrub: isMobile ? 0.05 : 0.08,
          anticipatePin: 1,
        },
      });
      tlRef.current = tl;

      const PLAY = 2.0, PAUSE = 1.5;
      let t = 0;
      PAUSE_POINTS.forEach(p => {
        tl.to(stProxy, { frame: p.at, duration: PLAY, ease: "none" }, t);
        tl.addLabel(`pause_${p.at}`, t + PLAY);
        t += PLAY + PAUSE;
      });
      tl.to(stProxy, { frame: INTRO_END_FRAME, duration: PLAY, ease: "none" }, t);
      tl.addLabel("intro_end", t + PLAY);
      t += PLAY;

      const SECTION_DUR = 1.2;
      SECTIONS.forEach((_, idx) => {
        tl.addLabel(`section_${idx}_start`, t);
        tl.to({ dummy: 0 }, { dummy: 1, duration: SECTION_DUR, ease: "none" }, t);
        tl.addLabel(`section_${idx}_end`, t + SECTION_DUR);
        t += SECTION_DUR;
      });
    }, containerRef);

    return () => {
      cancelAnimationFrame(rafRef.current);
      gsapCtx.revert();
      if (activeTweenRef.current) activeTweenRef.current.kill();
      if (hotspotTimerRef.current) clearTimeout(hotspotTimerRef.current);
      if (settleTimerRef.current)  clearTimeout(settleTimerRef.current);
      loopingSectionRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvasReady, setTargetFrame, startRafLoop, isMobile]);

  /* ================================================================
     DOT CLICK
     ================================================================ */
  const handleDotClick = useCallback((dotIndex: number) => {
    const st = ScrollTrigger.getAll().find(t => t.vars.id === "scroll-frames-trigger");
    if (!st || !tlRef.current) return;
    const dotF = [...PAUSE_POINTS.map(p => p.at), INTRO_END_FRAME];
    const f    = dotF[dotIndex];
    const time = f === INTRO_END_FRAME
      ? tlRef.current.labels["intro_end"]
      : tlRef.current.labels[`pause_${f}`];
    const progress = time / tlRef.current.duration();
    const s = st.start as number, e = st.end as number;
    gsap.to(window, {
      scrollTo: { y: s + progress * (e - s) + 10, autoKill: false },
      duration: 1.0, ease: "power2.inOut",
    });
    setHotspotVisible({});
    pendingHotspotRef.current = {};
  }, []);

  /* ================================================================
     SECTION CLICK
     ================================================================ */
  const handleSectionClick = useCallback((sectionIndex: number) => {
    const st = ScrollTrigger.getAll().find(t => t.vars.id === "scroll-frames-trigger");
    if (!st || !tlRef.current) return;

    reprioritizeBgQueue(sectionIndex);
    if (settleTimerRef.current) { clearTimeout(settleTimerRef.current); settleTimerRef.current = null; }

    scrollingToSectionRef.current = sectionIndex;
    activeSectionRef.current      = sectionIndex;
    setActiveSection(sectionIndex);
    playSectionAnimationRef.current(sectionIndex);

    const time     = tlRef.current.labels[`section_${sectionIndex}_start`];
    const progress = time / tlRef.current.duration();
    const s = st.start as number, e = st.end as number;

    gsap.to(window, {
      scrollTo: { y: s + progress * (e - s) + 10, autoKill: false },
      duration: 1.0,
      ease: "power2.inOut",
      onComplete: () => {
        settleTimerRef.current = setTimeout(() => {
          scrollingToSectionRef.current = null;
          settleTimerRef.current        = null;
        }, SCROLL_SETTLE_DELAY);
      },
    });

    setHotspotVisible({});
    pendingHotspotRef.current = {};
  }, [reprioritizeBgQueue]);

  const showScrollHint = !introComplete && canvasReady;

  /* ================================================================
     RENDER
     ================================================================ */
  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: "100vh",
        background: "#111",
        overflow: "hidden",
        position: "relative",
        touchAction: "pan-y",
        WebkitOverflowScrolling: "touch",
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          display: "block",
          opacity: canvasReady ? 1 : 0,
          transition: "opacity 0.4s ease",
          willChange: "transform",
          transform: "translateZ(0)",
        }}
      />

      {/* Hotspot Cards */}
      {HOTSPOTS.map(spot => (
        <HotspotCard key={spot.id} spot={spot} visible={hotspotVisible[spot.id] ?? false} bp={bp} />
      ))}

      {/* ── Section Annotations ─────────────────────────────────
          Desktop only → bottom-center cinematic subtitle
          Mobile skipped — hotspot cards appear bottom-center instead */}
    

      {/* Section Buttons */}
      <div style={{
        position: "absolute",
        top: isMobile ? 60 : 80,
        left: 0, right: 0, zIndex: 60,
        display: "flex", justifyContent: "center", pointerEvents: "none",
        opacity: showButtons ? 1 : 0,
        transform: showButtons ? "translateY(0)" : "translateY(-20px)",
        transition: "opacity 0.5s cubic-bezier(0.4,0,0.2,1), transform 0.5s cubic-bezier(0.34,1.56,0.64,1)",
      }}>
        <div style={{
          background: "rgba(255,255,255,0.95)", backdropFilter: "blur(12px)",
          borderRadius: 999, padding: "4px", display: "inline-flex", gap: 2,
          boxShadow: "0 4px 24px rgba(0,0,0,0.15)",
          pointerEvents: showButtons ? "auto" : "none",
        }}>
          {SECTIONS.map((section, idx) => (
            <button key={section.id} onClick={() => handleSectionClick(idx)} style={{
              padding: isMobile ? "6px 14px" : "8px 22px",
              borderRadius: 999,
              fontFamily: "var(--font-soehne), sans-serif",
              fontSize: isMobile ? 12 : 14,
              fontWeight: 500,
              letterSpacing: "0.03em",
              border: "none", cursor: "pointer", whiteSpace: "nowrap",
              transition: "background 0.3s ease, color 0.3s ease, box-shadow 0.3s ease",
              background: activeSection === idx ? "#dc2626" : "transparent",
              color: activeSection === idx ? "#fff" : "#333",
              boxShadow: activeSection === idx ? "0 2px 10px rgba(220,38,38,0.35)" : "none",
            }}>{section.name}</button>
          ))}
        </div>
      </div>

      {/* Dot Nav — intro */}
      <div style={{
        position: "absolute", right: 16, top: "50%",
        transform: "translateY(-50%)", zIndex: 50,
        display: "flex", flexDirection: "column", gap: 12,
        opacity: showScrollHint ? 1 : 0, transition: "opacity 0.5s ease",
        pointerEvents: showScrollHint ? "auto" : "none",
      }}>
        {Array.from({ length: TOTAL_DOT_STOPS }).map((_, idx) => (
          <button key={idx} onClick={() => handleDotClick(idx)} style={{
            width: currentDot === idx ? 12 : 10,
            height: currentDot === idx ? 12 : 10,
            borderRadius: "50%", border: "none", cursor: "pointer", padding: 0,
            transition: "all 0.3s ease",
            background: currentDot === idx ? "#dc2626" : "rgba(255,255,255,0.5)",
            boxShadow: currentDot === idx ? "0 0 0 3px rgba(220,38,38,0.25), 0 2px 8px rgba(220,38,38,0.4)" : "none",
          }} aria-label={`Go to stop ${idx + 1}`} />
        ))}
      </div>

      {/* Dot Nav — sections */}
      <div style={{
        position: "absolute", right: 16, top: "50%",
        transform: "translateY(-50%)", zIndex: 50,
        display: "flex", flexDirection: "column", gap: 12,
        opacity: showButtons ? 1 : 0, transition: "opacity 0.5s ease",
        pointerEvents: showButtons ? "auto" : "none",
      }}>
        {SECTIONS.map((section, idx) => (
          <button key={section.id} onClick={() => handleSectionClick(idx)} style={{
            width: activeSection === idx ? 12 : 10,
            height: activeSection === idx ? 12 : 10,
            borderRadius: "50%", border: "none", cursor: "pointer", padding: 0,
            transition: "all 0.3s ease",
            background: activeSection === idx ? "#dc2626" : "rgba(255,255,255,0.5)",
            boxShadow: activeSection === idx ? "0 0 0 3px rgba(220,38,38,0.25), 0 2px 8px rgba(220,38,38,0.4)" : "none",
          }} aria-label={`Play section: ${section.name}`} />
        ))}
      </div>

      <ScrollHint visible={showScrollHint} />
    </div>
  );
}