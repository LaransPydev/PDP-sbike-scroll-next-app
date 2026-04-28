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

const framePath = (i: number) => `/frames/${i}.webp`;


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
    src: "https://s3.us-east-1.amazonaws.com/sportstech.team/dev_assets/incandescent-light-bulb-svgrepo-com%201.svg",
    cardStyle: { bottom: "20%", right: "17%" } as React.CSSProperties,
    lineFrom: "left" as const,
    showAtFrame: { start: 45, end: 57 },
  },
  {
    id: 2,
    showDuringSection: 2,
    title: "21.5 Display",
    desc: "With the 360-degree swiveling touch display,your workouts are more flexible than ever!",
    src: "https://s3.us-east-1.amazonaws.com/sportstech.team/dev_assets/incandescent-light-bulb-svgrepo-com%201.svg",
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
const READY_THRESHOLD = FRAME_COUNT;
const HOTSPOT_SHOW_DELAY = 100;

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
function lockScroll() {
  if (typeof window !== "undefined") {
    document.body.style.overflow = "hidden";
  }
}
function unlockScroll() {
  if (typeof window !== "undefined") {
    document.body.style.overflow = "";
  }
}

/* ================================================================
   PRELOADER
   ================================================================ */
const Preloader: React.FC<{ progress: number; visible: boolean; label: string }> = ({
  progress, visible, label,
}) => {
  const p = Math.min(100, Math.max(0, progress));
  const c = 2 * Math.PI * 54;
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      background: "#000", opacity: visible ? 1 : 0, pointerEvents: visible ? "all" : "none",
      transition: "opacity 0.7s cubic-bezier(0.4,0,0.2,1)",
    }}>
      <div style={{ position: "relative", width: 140, height: 140 }}>
        <svg width="140" height="140" style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }}>
          <circle cx="70" cy="70" r="54" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="5" />
          <circle cx="70" cy="70" r="54" fill="none" stroke="#dc2626" strokeWidth="5"
            strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c - (p / 100) * c}
            style={{ transition: "stroke-dashoffset 0.3s ease-out" }} />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
          <span style={{ fontFamily: "'DM Mono','Courier New',monospace", fontSize: 28, fontWeight: 700, color: "#fff", letterSpacing: "-1px", lineHeight: 1 }}>{Math.round(p)}</span>
          <span style={{ fontFamily: "'DM Mono','Courier New',monospace", fontSize: 11, color: "#666", letterSpacing: "0.1em", marginTop: 2 }}>%</span>
        </div>
      </div>
      <div style={{ marginTop: 28, textAlign: "center" }}>
        <p style={{ fontFamily: "'DM Mono','Courier New',monospace", fontSize: 11, letterSpacing: "0.25em", color: "#dc2626", textTransform: "uppercase", marginBottom: 6 }}>sBike</p>
        <p style={{ fontFamily: "'DM Mono','Courier New',monospace", fontSize: 11, letterSpacing: "0.12em", color: "#555", textTransform: "uppercase" }}>{label}</p>
      </div>
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 3, background: "rgba(255,255,255,0.05)" }}>
        <div style={{ height: "100%", width: `${p}%`, background: "linear-gradient(90deg,#dc2626,#ef4444)", transition: "width 0.3s ease-out", borderRadius: "0 2px 2px 0" }} />
      </div>
    </div>
  );
};

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
        <h3 style={{ margin: 0, fontSize: bp === "sm" ? 11 : 12, fontWeight: 700, fontFamily: "'DM Mono','Courier New',monospace", color: "#111", lineHeight: 1.3 }}>{spot.title}</h3>
      </div>
      <p style={{ margin: 0, fontSize: bp === "sm" ? 9 : 10, fontFamily: "'DM Mono','Courier New',monospace", color: "#555", lineHeight: 1.6, fontWeight: 600 }}>{spot.desc}</p>
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
      <span style={{ display: "block", fontFamily: "'DM Mono','Courier New',monospace", fontSize: 11, letterSpacing: "0.2em", color: "#fff", textTransform: "uppercase", textAlign: "center", marginBottom: 8 }}>Scroll to explore</span>
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
  const [readyToShow, setReadyToShow] = useState(false);
  const [showPreloader, setShowPreloader] = useState(true);
  const [loadProgress, setLoadProgress] = useState(0);
  const [preloaderLabel, setPreloaderLabel] = useState("Loading…");
  const [activeSection, setActiveSection] = useState<number | null>(null);
  const [introComplete, setIntroComplete] = useState(false);
  const [hotspotVisible, setHotspotVisible] = useState<Record<number, boolean>>({});
  const [currentDot, setCurrentDot] = useState(0);
  const [showButtons, setShowButtons] = useState(false);

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

  const activeSectionRef = useRef<number | null>(null);
  const introCompleteRef = useRef(false);
  const readyRef = useRef(false);

  const hotspotTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingHotspotRef = useRef<Record<number, boolean>>({});

  const bp = useBreakpoint();

  /* ================================================================
     RAF RENDER LOOP
     ================================================================ */
  const startRafLoop = useCallback(() => {
    const loop = () => {
      const target = Math.max(1, Math.min(FRAME_COUNT, Math.round(targetFrameRef.current)));
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
     SET TARGET FRAME
     ================================================================ */
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
      if (!introCompleteRef.current) {
        newVis[spot.id] = f >= spot.showAtFrame.start && f <= spot.showAtFrame.end;
      } else {
        newVis[spot.id] = false;
      }
    });

    const currentVis = pendingHotspotRef.current;
    let shouldHideNow = false;
    let shouldShowDelay = false;
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
     SMART LOADING STRATEGY
     ================================================================ */
  useEffect(() => {
    const imgs = imagesRef.current;
    const loaded = loadedRef.current;
    let phase1Done = 0;

    const onLoad = (i: number) => {
      loaded[i] = true;
      if (i < READY_THRESHOLD) {
        phase1Done++;
        setLoadProgress(Math.round((phase1Done / READY_THRESHOLD) * 100));
        if (phase1Done === READY_THRESHOLD && !readyRef.current) {
          readyRef.current = true;
          setPreloaderLabel("Ready!");
          setLoadProgress(100);
          setTimeout(() => { setShowPreloader(false); setReadyToShow(true); }, 400);
        }
      }
    };

    for (let i = 0; i < READY_THRESHOLD; i++) {
      const img = new Image();
      img.decoding = "async";
      img.onload = () => onLoad(i);
      img.onerror = () => onLoad(i);
      img.src = framePath(i + 1);
      imgs[i] = img;
    }
  }, []);

  /* ================================================================
     START RAF LOOP + GSAP SCROLL
     ================================================================ */
  useEffect(() => {
    if (!readyToShow || !containerRef.current) return;

    startRafLoop();
    setTargetFrame(1);

    const stProxy = stProxyRef.current;

    const playSectionAnimation = (sectionIndex: number) => {
      if (activeTweenRef.current) activeTweenRef.current.kill();
      const section = SECTIONS[sectionIndex];
      proxyRef.current.frame = section.frameStart;
      setTargetFrame(section.frameStart);

      const fastDuration = (section.frameEnd - section.frameStart) / 17;
      activeTweenRef.current = gsap.to(proxyRef.current, {
        frame: section.frameEnd,
        duration: fastDuration,
        ease: "none",
        onUpdate: () => setTargetFrame(proxyRef.current.frame),
      });
    };

    const handleScrubUpdate = () => {
      const tl = tlRef.current;
      if (!tl) return;

      const currentTime = tl.time();
      const introTime = tl.labels["intro_end"] || 9.0;

      // Intro part scrubbing
      if (currentTime < introTime) {
        const nf = Math.round(stProxy.frame);

        // Dot indicator
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
          setActiveSection(null);
          if (activeTweenRef.current) {
            activeTweenRef.current.kill();
            activeTweenRef.current = null;
          }
        }

        setTargetFrame(nf);
      } else {
        // Sections part scrolling (frames animated by gsap.to, not scrubbed)
        introCompleteRef.current = true;
        setIntroComplete(true);
        setShowButtons(true);

        let newActiveSection = 0;
        if (currentTime >= tl.labels["section_2_start"]) newActiveSection = 2;
        else if (currentTime >= tl.labels["section_1_start"]) newActiveSection = 1;
        else newActiveSection = 0;

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
      tl.addLabel(`intro_end`, t + PLAY);
      t += PLAY;

      const SECTION_DUR = 1.2;
      SECTIONS.forEach((sec, idx) => {
        tl.addLabel(`section_${idx}_start`, t);
        // Dummy tween to create timeline duration for scrubbing sections
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
    };
  }, [readyToShow, setTargetFrame, startRafLoop]);

  /* ================================================================
     DOT CLICK
     ================================================================ */
  const handleDotClick = useCallback((dotIndex: number) => {
    const st = ScrollTrigger.getAll().find(t => t.vars.id === "scroll-frames-trigger");
    if (!st || !tlRef.current) return;

    const dotF = [...PAUSE_POINTS.map(p => p.at), INTRO_END_FRAME];
    const f = dotF[dotIndex];

    let time = 0;
    if (f === INTRO_END_FRAME) {
      time = tlRef.current.labels['intro_end'];
    } else {
      time = tlRef.current.labels[`pause_${f}`];
    }

    const progress = time / tlRef.current.duration();
    const s = st.start as number, e = st.end as number;
    const targetY = s + progress * (e - s) + 10;

    gsap.to(window, {
      scrollTo: { y: targetY, autoKill: false },
      duration: 1.0,
      ease: "power2.inOut",
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

    const label = `section_${sectionIndex}_start`;
    const time = tlRef.current.labels[label];
    const progress = time / tlRef.current.duration();

    const s = st.start as number, e = st.end as number;
    const targetY = s + progress * (e - s) + 10;

    gsap.to(window, {
      scrollTo: { y: targetY, autoKill: false },
      duration: 1.0,
      ease: "power2.inOut",
    });

    setHotspotVisible({});
    pendingHotspotRef.current = {};
  }, []);

  const showScrollHint = !introComplete && readyToShow && !showPreloader;

  /* ================================================================
     RENDER
     ================================================================ */
  return (
    <>
      <Preloader progress={loadProgress} visible={showPreloader} label={preloaderLabel} />

      <div ref={containerRef} style={{ width: "100%", height: "100vh", background: "#000", overflow: "hidden", position: "relative" }}>

        <canvas ref={canvasRef} style={{
          position: "absolute", inset: 0, width: "100%", height: "100%",
          objectFit: "cover", opacity: readyToShow ? 1 : 0, transition: "opacity 0.5s ease",
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
                fontFamily: "'DM Mono','Courier New',monospace",
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
              width: currentDot === idx ? 12 : 10, height: currentDot === idx ? 12 : 10,
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
              width: activeSection === idx ? 12 : 10, height: activeSection === idx ? 12 : 10,
              borderRadius: "50%", border: "none", cursor: "pointer", padding: 0,
              transition: "all 0.3s ease",
              background: activeSection === idx ? "#dc2626" : "rgba(255,255,255,0.5)",
              boxShadow: activeSection === idx ? "0 0 0 3px rgba(220,38,38,0.25), 0 2px 8px rgba(220,38,38,0.4)" : "none",
            }} aria-label={`Play section: ${section.name}`} />
          ))}
        </div>


      </div>
    </>
  );
}