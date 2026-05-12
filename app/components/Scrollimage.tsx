// app/components/Scrollimage.tsx
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
   CONFIG
   ================================================================ */
const FRAME_COUNT = 900;
const CDN_BASE_URL = "https://do55ukdqgl59f.cloudfront.net";
const framePath = (i: number) => `${CDN_BASE_URL}/frames/${i}.webp`;

const SECTIONS = [
  { id: 1, name: "Workout", frameStart: 210, frameEnd: 433 },
  { id: 2, name: "Landscape", frameStart: 500, frameEnd: 666 },
  { id: 3, name: "Gaming", frameStart: 795, frameEnd: 900 },
];

const HOTSPOTS = [
  {
    id: 1,
    showDuringSection: 1,
    title: "Dynamic LED Light",
    desc: "color changing LED respond to your speed that enhances focus and energy",
    src: "https://do55ukdqgl59f.cloudfront.net/incandescent-light-bulb-svgrepo-com%201.svg",
    cardStyle: { bottom: "20%", right: "17%" } as React.CSSProperties,
    lineFrom: "left" as const,
    showAtFrame: { start: 45, end: 57 },
  },
  {
    id: 2,
    showDuringSection: 2,
    title: "21.5 Display",
    desc: "With the 360-degree swiveling touch display,your workouts are more flexible than ever!",
    src: "https://do55ukdqgl59f.cloudfront.net/incandescent-light-bulb-svgrepo-com%201.svg",
    cardStyle: { top: "25%", left: "6%" } as React.CSSProperties,
    lineFrom: "right" as const,
    showAtFrame: { start: 110, end: 150 },
  },
];

const SCROLL_DISTANCE = 6000;
const PAUSE_POINTS: { at: number; holdPx: number }[] = [
  { at: 50, holdPx: 300 },
  { at: 130, holdPx: 200 },
];
const INTRO_END_FRAME = 200;
const TOTAL_DOT_STOPS = PAUSE_POINTS.length + 1;
const READY_THRESHOLD = 100;
const HOTSPOT_SHOW_DELAY = 100;
const SCROLL_SETTLE_DELAY = 250;

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
const HotspotCard: React.FC<{
  spot: typeof HOTSPOTS[number]; visible: boolean; bp: Breakpoint;
}> = React.memo(({ spot, visible, bp }) => {
  const cardW = bp === "sm" ? 220 : 256;
  const lineLen = bp === "sm" ? 50 : 80;
  const isLeft = spot.lineFrom === "left";
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
      position: "absolute", ...spot.cardStyle, width: cardW, zIndex: 40,
      borderRadius: 16, display: "flex", flexDirection: "column", gap: 6,
      opacity: visible ? 1 : 0, pointerEvents: visible ? "auto" : "none",
      transform: visible ? "translateY(0) scale(1)" : "translateY(20px) scale(0.95)",
      transition: "opacity 0.35s cubic-bezier(0.4,0,0.2,1), transform 0.35s cubic-bezier(0.4,0,0.2,1)",
      background: "linear-gradient(135deg,rgba(255,255,255,0.72) 0%,rgba(255,255,255,0.48) 100%)",
      WebkitBackdropFilter: "blur(20px) saturate(180%)", backdropFilter: "blur(20px) saturate(180%)",
      border: "1px solid rgba(255,255,255,0.55)", borderTop: "1px solid rgba(255,255,255,0.80)",
      borderLeft: "1px solid rgba(255,255,255,0.80)",
      boxShadow: "0 8px 32px rgba(0,0,0,0.18), inset 0 1px 1px rgba(255,255,255,0.90)",
      isolation: "isolate", padding: "12px",
    }}>
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
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <img src={spot.src} alt={spot.title} style={{ width: 40, height: 40, objectFit: "contain", borderRadius: 8, flexShrink: 0 }} draggable={false} />
        <h3 style={{ margin: 0, fontSize: bp === "sm" ? 11 : 12, fontWeight: 500, fontFamily: "var(--font-soehne), sans-serif", color: "#111", lineHeight: 1.3 }}>{spot.title}</h3>
      </div>
      <p style={{ margin: 0, fontSize: bp === "sm" ? 9 : 10, fontFamily: "var(--font-soehne), sans-serif", color: "#555", lineHeight: 1.6, fontWeight: 400 }}>{spot.desc}</p>
    </div>
  );
});
HotspotCard.displayName = "HotspotCard";

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
   No internal preloader — SitePreloader in page.tsx handles it.
   This component mounts already visible and starts loading immediately.
   ================================================================ */
export default function ScrollFrames({ src }: { src?: string }) {
  const [activeSection, setActiveSection] = useState<number | null>(null);
  const [introComplete, setIntroComplete] = useState(false);
  const [hotspotVisible, setHotspotVisible] = useState<Record<number, boolean>>({});
  const [currentDot, setCurrentDot] = useState(0);
  const [showButtons, setShowButtons] = useState(false);
  const [canvasReady, setCanvasReady] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);

  const imagesRef = useRef<(HTMLImageElement | null)[]>(new Array(FRAME_COUNT).fill(null));
  const loadedRef = useRef<boolean[]>(new Array(FRAME_COUNT).fill(false));

  const targetFrameRef = useRef(1);
  const drawnFrameRef = useRef(-1);
  const rafRef = useRef(0);

  const stProxyRef = useRef({ frame: 1 });
  const proxyRef = useRef({ frame: 1 });
  const activeTweenRef = useRef<gsap.core.Tween | null>(null);

  const tweenGenRef = useRef(0);
  const scrollingToSectionRef = useRef<number | null>(null);
  const settleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loopingSectionRef = useRef<number | null>(null);

  const activeSectionRef = useRef<number | null>(null);
  const introCompleteRef = useRef(false);
  const readyRef = useRef(false);

  const hotspotTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingHotspotRef = useRef<Record<number, boolean>>({});

  const bgQueueRef = useRef<number[]>([]);
  const bgQueueIdxRef = useRef(0);
  const bgActiveReqRef = useRef(0);
  const bgLoadStartedRef = useRef(false);

  const playSectionAnimationRef = useRef<(idx: number) => void>(() => { });

  const bp = useBreakpoint();

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
      if (!newVis[numId] && currentVis[numId]) shouldHideNow = true;
      if (newVis[numId] && !currentVis[numId]) shouldShowDelay = true;
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
  const startRafLoop = useCallback(() => {
    const loop = () => {
      let target = Math.max(1, Math.min(FRAME_COUNT, Math.round(targetFrameRef.current)));
      if (!loadedRef.current[target - 1] || !imagesRef.current[target - 1]) {
        let lo = target - 2, hi = target, found = false;
        while (lo >= 0 || hi < FRAME_COUNT) {
          if (lo >= 0 && loadedRef.current[lo] && imagesRef.current[lo]) { target = lo + 1; found = true; break; }
          if (hi < FRAME_COUNT && loadedRef.current[hi] && imagesRef.current[hi]) { target = hi + 1; found = true; break; }
          lo--; hi++;
        }
        if (!found) { rafRef.current = requestAnimationFrame(loop); return; }
      }
      if (target !== drawnFrameRef.current) {
        const canvas = canvasRef.current;
        const img = imagesRef.current[target - 1];
        if (canvas && img && loadedRef.current[target - 1]) {
          const ctx = canvas.getContext("2d");
          if (ctx) {
            if (canvas.width !== img.naturalWidth || canvas.height !== img.naturalHeight) {
              canvas.width = img.naturalWidth;
              canvas.height = img.naturalHeight;
            }
            ctx.drawImage(img, 0, 0);
            drawnFrameRef.current = target;
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
  const MAX_BG_CONCURRENT = 32;

  const loadNextBg = useCallback(() => {
    const imgs = imagesRef.current, loaded = loadedRef.current;
    while (bgActiveReqRef.current < MAX_BG_CONCURRENT && bgQueueIdxRef.current < bgQueueRef.current.length) {
      const idx = bgQueueRef.current[bgQueueIdxRef.current++];
      if (loaded[idx]) continue;
      bgActiveReqRef.current++;
      const img = new Image();
      img.crossOrigin = "anonymous"; img.decoding = "async";
      img.onload = img.onerror = () => {
        loaded[idx] = true; imgs[idx] = img;
        bgActiveReqRef.current--;
        loadNextBg();
      };
      img.src = framePath(idx + 1); imgs[idx] = img;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const reprioritizeBgQueue = useCallback((sectionIndex: number) => {
    const section = SECTIONS[sectionIndex], loaded = loadedRef.current;
    const priority: number[] = [];
    for (let i = section.frameStart; i < section.frameEnd; i++) {
      if (!loaded[i]) priority.push(i);
    }
    if (!priority.length) return;
    const rest = bgQueueRef.current.slice(bgQueueIdxRef.current).filter(f => !priority.includes(f));
    bgQueueRef.current = [...priority, ...rest];
    bgQueueIdxRef.current = 0;
    loadNextBg();
  }, [loadNextBg]);

  /* ================================================================
     LOADING — starts immediately on mount, no gating needed
     ================================================================ */
  useEffect(() => {
    const imgs = imagesRef.current, loaded = loadedRef.current;
    let phase1Done = 0;

    const startBgLoad = () => {
      if (bgLoadStartedRef.current) return;
      bgLoadStartedRef.current = true;
      const allFramesToLoad = new Set<number>();
      
      // Intro and intermediate scrolling sections (load every 2nd frame)
      for (let i = READY_THRESHOLD; i < 200; i += 2) allFramesToLoad.add(i);
      for (let i = 200; i < 210; i += 2) allFramesToLoad.add(i);
      for (let i = 433; i < 500; i += 2) allFramesToLoad.add(i);
      for (let i = 666; i < 795; i += 2) allFramesToLoad.add(i);
      
      // Looping sections (load EVERY frame to prevent lag)
      for (let i = 210; i < 433; i++) allFramesToLoad.add(i);
      for (let i = 500; i < 666; i++) allFramesToLoad.add(i);
      for (let i = 795; i < 900; i++) allFramesToLoad.add(i);

      const q: number[] = [];
      const added = new Set<number>();

      const addPattern = (step: number) => {
        for (let i = READY_THRESHOLD; i < FRAME_COUNT; i += step) {
          if (allFramesToLoad.has(i) && !added.has(i)) {
            q.push(i);
            added.add(i);
          }
        }
      };

      addPattern(24);
      addPattern(12);
      addPattern(6);

      for (let i = READY_THRESHOLD; i < FRAME_COUNT; i++) {
        if (allFramesToLoad.has(i) && !added.has(i)) {
          q.push(i);
          added.add(i);
        }
      }

      bgQueueRef.current = q; bgQueueIdxRef.current = 0;
      loadNextBg();
    };

    const onLoad = (i: number) => {
      loaded[i] = true;
      if (i < READY_THRESHOLD) {
        phase1Done++;
        if (phase1Done === READY_THRESHOLD && !readyRef.current) {
          readyRef.current = true;

          const canvas = canvasRef.current, img0 = imagesRef.current[0];
          if (canvas && img0) {
            canvas.width = img0.naturalWidth; canvas.height = img0.naturalHeight;
            canvas.getContext("2d")?.drawImage(img0, 0, 0);
            drawnFrameRef.current = 1;
          }

          requestAnimationFrame(() => {
            setCanvasReady(true);
            startBgLoad();
          });
        }
      }
    };

    const loadNext = () => {
      for (let i = 0; i < READY_THRESHOLD; i++) {
        if (i % 2 !== 0) {
          onLoad(i);
          continue;
        }
        const img = new Image();
        img.crossOrigin = "anonymous"; img.decoding = "async";
        img.onload = img.onerror = () => { onLoad(i); };
        img.src = framePath(i + 1);
        imgs[i] = img;
      }
    };
    loadNext();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadNextBg]);

  /* ================================================================
     GSAP SCROLL SETUP — starts as soon as phase 1 frames are ready
     ================================================================ */
  useEffect(() => {
    if (!canvasReady || !containerRef.current) return;

    startRafLoop();
    setTargetFrame(1);

    const stProxy = stProxyRef.current;

    const playSectionAnimation = (sectionIndex: number) => {
      if (activeTweenRef.current) {
        activeTweenRef.current.kill();
        activeTweenRef.current = null;
      }

      tweenGenRef.current += 1;
      const myGeneration = tweenGenRef.current;
      loopingSectionRef.current = sectionIndex;

      const section = SECTIONS[sectionIndex];
      const total = section.frameEnd - section.frameStart;
      let ready = 0;
      for (let i = section.frameStart; i < section.frameEnd; i++) {
        if (loadedRef.current[i]) ready++;
      }
      const ratio = ready / total;
      const baseDur = total / 17;
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
      const introTime = tl.labels["intro_end"] || 9.0;

      if (currentTime < introTime) {
        const nf = Math.round(stProxy.frame);

        const dotF = [...PAUSE_POINTS.map(p => p.at), INTRO_END_FRAME];
        let nearest = 0, minD = Infinity;
        dotF.forEach((f, i) => { const d = Math.abs(nf - f); if (d < minD) { minD = d; nearest = i; } });
        setCurrentDot(nearest);

        const isIntroComplete = nf >= INTRO_END_FRAME;
        introCompleteRef.current = isIntroComplete;
        setIntroComplete(isIntroComplete);
        setShowButtons(isIntroComplete);

        if (activeSectionRef.current !== null) {
          activeSectionRef.current = null;
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
        if (currentTime >= tl.labels["section_2_start"]) newActiveSection = 2;
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
          scrub: 0.08,
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
      if (settleTimerRef.current) clearTimeout(settleTimerRef.current);
      loopingSectionRef.current = null;
    };
  }, [canvasReady, setTargetFrame, startRafLoop]);

  /* ================================================================
     DOT CLICK
     ================================================================ */
  const handleDotClick = useCallback((dotIndex: number) => {
    const st = ScrollTrigger.getAll().find(t => t.vars.id === "scroll-frames-trigger");
    if (!st || !tlRef.current) return;
    const dotF = [...PAUSE_POINTS.map(p => p.at), INTRO_END_FRAME];
    const f = dotF[dotIndex];
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
    activeSectionRef.current = sectionIndex;
    setActiveSection(sectionIndex);
    playSectionAnimationRef.current(sectionIndex);

    const time = tlRef.current.labels[`section_${sectionIndex}_start`];
    const progress = time / tlRef.current.duration();
    const s = st.start as number, e = st.end as number;

    gsap.to(window, {
      scrollTo: { y: s + progress * (e - s) + 10, autoKill: false },
      duration: 1.0,
      ease: "power2.inOut",
      onComplete: () => {
        settleTimerRef.current = setTimeout(() => {
          scrollingToSectionRef.current = null;
          settleTimerRef.current = null;
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
      style={{ width: "100%", height: "100vh", background: "#111", overflow: "hidden", position: "relative" }}
    >
      <canvas ref={canvasRef} style={{
        position: "absolute", inset: 0, width: "100%", height: "100%",
        objectFit: "cover",
        opacity: canvasReady ? 1 : 0,
        transition: "opacity 0.4s ease",
      }} />

      {HOTSPOTS.map(spot => (
        <HotspotCard key={spot.id} spot={spot} visible={hotspotVisible[spot.id] ?? false} bp={bp} />
      ))}

      {/* Section Buttons */}
      <div style={{
        position: "absolute", top: 80, left: 0, right: 0, zIndex: 60,
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
              padding: bp === "sm" ? "6px 16px" : "8px 22px", borderRadius: 999,
              fontFamily: "var(--font-soehne), sans-serif",
              fontSize: bp === "sm" ? 12 : 14, fontWeight: 500, letterSpacing: "0.03em",
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
        position: "absolute", right: bp === "sm" ? 12 : 16, top: "50%",
        transform: "translateY(-50%)", zIndex: 50,
        display: "flex", flexDirection: "column", gap: bp === "sm" ? 8 : 12,
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
        position: "absolute", right: bp === "sm" ? 12 : 16, top: "50%",
        transform: "translateY(-50%)", zIndex: 50,
        display: "flex", flexDirection: "column", gap: bp === "sm" ? 8 : 12,
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

    </div>
  );
}