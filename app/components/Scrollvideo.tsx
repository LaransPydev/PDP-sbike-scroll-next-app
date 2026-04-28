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

const SECTIONS = [
  { id: 1, name: "Workout", start: 14.5, end: 34 },
  { id: 2, name: "Landscape", start: 34, end: 54 },
  { id: 3, name: "Gaming", start: 54, end: Infinity },
];

const HOTSPOTS = [
  {
    id: 1,
    showDuringSection: 1,
    title: "Precision Flywheel",
    desc: "18kg balanced flywheel for ultra-smooth, silent pedaling.",
    src: "https://s3.us-east-1.amazonaws.com/sportstech.team/dev_assets/incandescent-light-bulb-svgrepo-com%201.svg",
    cardStyle: { bottom: "20%", right: "17%" } as React.CSSProperties,
    lineFrom: "left" as const,
    showAtTime: { start: 3.5, end: 3.8 },
  }, {
    id: 3,
    showDuringSection: 2,
    title: "LED Resistance Ring",
    desc: "Ambient light indicator shows your current resistance level in real-time.",
    src: "https://s3.us-east-1.amazonaws.com/sportstech.team/dev_assets/incandescent-light-bulb-svgrepo-com%201.svg",
    cardStyle: { top: "25%", left: "6%" } as React.CSSProperties,
    lineFrom: "right" as const,
    showAtTime: { start: 8.0, end: 10.0 },
  }
];

const INTRO_END = 14.1;
const INTRO_SCROLL_DISTANCE = 5000;
const SECTION_SCROLL_DISTANCE = 800; // Reduced to minimize empty scroll space
const TOTAL_SCROLL_DISTANCE = INTRO_SCROLL_DISTANCE + (SECTIONS.length * SECTION_SCROLL_DISTANCE);

// How long (ms) buttons stay visible after user scrolls back into intro zone
const BUTTON_HIDE_DELAY = 1200;

/* ================================================================
   PAUSE POINTS CONFIG
   ================================================================ */
const PAUSE_POINTS: { at: number; holdPx: number }[] = [
  { at: 3.5, holdPx: 600 },
  { at: 8.0, holdPx: 600 },
];

const TOTAL_DOT_STOPS = PAUSE_POINTS.length + 1;

/* ================================================================
   SCROLL-PROGRESS → VIDEO-TIME MAPPING
   ================================================================ */
const totalPausePx = PAUSE_POINTS.reduce((s, p) => s + p.holdPx, 0);
const motionPx = INTRO_SCROLL_DISTANCE - totalPausePx;

function scrollPxToVideoTime(rawPx: number): number {
  let cursorPx = 0;
  let cursorT = 0;

  for (const pause of PAUSE_POINTS) {
    const segmentT = pause.at - cursorT;
    const segmentPx = (segmentT / INTRO_END) * motionPx;

    if (rawPx < cursorPx + segmentPx) {
      const localPx = rawPx - cursorPx;
      return cursorT + (localPx / segmentPx) * segmentT;
    }
    cursorPx += segmentPx;

    if (rawPx < cursorPx + pause.holdPx) return pause.at;
    cursorPx += pause.holdPx;
    cursorT = pause.at;
  }

  const remainT = INTRO_END - cursorT;
  const remainPx = (remainT / INTRO_END) * motionPx;
  if (remainPx <= 0) return INTRO_END;
  const localPx = rawPx - cursorPx;
  return Math.min(INTRO_END, cursorT + (localPx / remainPx) * remainT);
}

function videoTimeToScrollPx(targetT: number): number {
  let cursorPx = 0;
  let cursorT = 0;

  for (const pause of PAUSE_POINTS) {
    const segmentT = pause.at - cursorT;
    const segmentPx = (segmentT / INTRO_END) * motionPx;

    if (targetT <= pause.at) {
      const frac = segmentT > 0 ? (targetT - cursorT) / segmentT : 0;
      return cursorPx + frac * segmentPx;
    }
    cursorPx += segmentPx;

    if (targetT === pause.at) return cursorPx;

    cursorPx += pause.holdPx;
    cursorT = pause.at;
  }

  const remainT = INTRO_END - cursorT;
  const remainPx = (remainT / INTRO_END) * motionPx;
  if (remainT <= 0) return cursorPx;
  const frac = Math.min((targetT - cursorT) / remainT, 1);
  return cursorPx + frac * remainPx;
}

/* ================================================================
   RESPONSIVE HELPERS
   ================================================================ */
type Breakpoint = "sm" | "md" | "lg";

function useBreakpoint(): Breakpoint {
  const [bp, setBp] = useState<Breakpoint>("lg");
  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      setBp(w < 640 ? "sm" : w < 1024 ? "md" : "lg");
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return bp;
}

function getCardWidth(bp: Breakpoint) {
  return bp === "sm" ? 220 : 256;
}

/* ================================================================
   PRELOADER
   ================================================================ */
const Preloader: React.FC<{ progress: number; visible: boolean }> = ({
  progress,
  visible,
}) => {
  const p = Math.min(100, Math.max(0, progress));
  const c = 2 * Math.PI * 54;
  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        background: "#000",
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? "all" : "none",
        transition: "opacity 0.7s cubic-bezier(0.4,0,0.2,1)",
      }}
    >
      <div style={{ position: "relative", width: 140, height: 140 }}>
        <svg width="140" height="140" style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }}>
          <circle cx="70" cy="70" r="54" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="5" />
          <circle
            cx="70" cy="70" r="54" fill="none" stroke="#dc2626" strokeWidth="5" strokeLinecap="round"
            strokeDasharray={c} strokeDashoffset={c - (p / 100) * c}
            style={{ transition: "stroke-dashoffset 0.3s ease-out" }}
          />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
          <span style={{ fontFamily: "'DM Mono','Courier New',monospace", fontSize: 28, fontWeight: 700, color: "#fff", letterSpacing: "-1px", lineHeight: 1 }}>
            {Math.round(p)}
          </span>
          <span style={{ fontFamily: "'DM Mono','Courier New',monospace", fontSize: 11, color: "#666", letterSpacing: "0.1em", marginTop: 2 }}>%</span>
        </div>
      </div>
      <div style={{ marginTop: 28, textAlign: "center" }}>
        <p style={{ fontFamily: "'DM Mono','Courier New',monospace", fontSize: 11, letterSpacing: "0.25em", color: "#dc2626", textTransform: "uppercase", marginBottom: 6 }}>
          sBike
        </p>
        <p style={{ fontFamily: "'DM Mono','Courier New',monospace", fontSize: 11, letterSpacing: "0.12em", color: "#555", textTransform: "uppercase" }}>
          {p < 100 ? "Loading video…" : "Preparing…"}
        </p>
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
  spot: typeof HOTSPOTS[number];
  visible: boolean;
  bp: Breakpoint;
}> = React.memo(({ spot, visible, bp }) => {
  const cardW = getCardWidth(bp);
  const lineLen = bp === "sm" ? 50 : 80;
  const isLeft = spot.lineFrom === "left";

  const svgStyle: React.CSSProperties = {
    position: "absolute",
    top: "50%",
    transform: "translateY(-50%)",
    ...(isLeft ? { right: "100%" } : { left: "100%" }),
    width: lineLen,
    height: 32,
    overflow: "visible",
    pointerEvents: "none",
  };

  const lx1 = isLeft ? lineLen : 0;
  const lx2 = isLeft ? 0 : lineLen;
  const dotCx = isLeft ? 0 : lineLen;
  const dotCy = 16;

  return (
    <div
      style={{
        position: "absolute",
        ...spot.cardStyle,
        width: cardW,
        zIndex: 40,
        borderRadius: 16,
        display: "flex",
        flexDirection: "column",
        gap: 6,
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? "auto" : "none",
        transform: visible ? "translateY(0) scale(1)" : "translateY(20px) scale(0.95)",
        transition: "opacity 0.35s cubic-bezier(0.4,0,0.2,1), transform 0.35s cubic-bezier(0.4,0,0.2,1)",
        background: "linear-gradient(135deg,rgba(255,255,255,0.72) 0%,rgba(255,255,255,0.48) 100%)",
        WebkitBackdropFilter: "blur(20px) saturate(180%)",
        backdropFilter: "blur(20px) saturate(180%)",
        border: "1px solid rgba(255,255,255,0.55)",
        borderTop: "1px solid rgba(255,255,255,0.80)",
        borderLeft: "1px solid rgba(255,255,255,0.80)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.18), inset 0 1px 1px rgba(255,255,255,0.90)",
        isolation: "isolate",
        padding: "12px",
      }}
    >
      <svg style={svgStyle}>
        <line
          x1={lx1} y1={16} x2={lx2} y2={16}
          stroke="#dc2626" strokeWidth="1.5" strokeLinecap="round"
          strokeDasharray={lineLen}
          strokeDashoffset={visible ? 0 : lineLen}
          style={{ transition: "stroke-dashoffset 0.6s cubic-bezier(0.4,0,0.2,1) 0.15s" }}
        />
        <g style={{ opacity: visible ? 1 : 0, transition: "opacity 0.3s ease 0.5s" }}>
          <circle cx={dotCx} cy={dotCy} r="5" fill="none" stroke="#dc2626" strokeWidth="1.5" opacity="0.4">
            <animate attributeName="r" values="5;11;5" dur="2s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.4;0;0.4" dur="2s" repeatCount="indefinite" />
          </circle>
          <circle cx={dotCx} cy={dotCy} r="4" fill="#dc2626" />
          <circle cx={dotCx} cy={dotCy} r="1.8" fill="#fff" />
        </g>
      </svg>

      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <img
          src={spot.src} alt={spot.title}
          style={{ width: 40, height: 40, objectFit: "contain", borderRadius: 8, flexShrink: 0 }}
          draggable={false}
        />
        <h3 style={{ margin: 0, fontSize: bp === "sm" ? 11 : 12, fontWeight: 700, fontFamily: "'DM Mono','Courier New',monospace", color: "#111", lineHeight: 1.3 }}>
          {spot.title}
        </h3>
      </div>
      <p style={{ margin: 0, fontSize: bp === "sm" ? 9 : 10, fontFamily: "'DM Mono','Courier New',monospace", color: "#555", lineHeight: 1.6, fontWeight: 600 }}>
        {spot.desc}
      </p>
    </div>
  );
});
HotspotCard.displayName = "HotspotCard";

/* ================================================================
   SCROLL HINT
   ================================================================ */
const ScrollHint: React.FC<{ visible: boolean }> = ({ visible }) => (
  <div
    style={{
      position: "absolute", bottom: 48, left: "50%", zIndex: 60,
      display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
      pointerEvents: "none",
      opacity: visible ? 0.9 : 0,
      transform: "translateX(-50%)",
      transition: "opacity 0.6s ease",
    }}
  >
    <style>{`
      @keyframes scrollBounce {
        0%,100%{transform:translateY(0);opacity:.9}
        50%{transform:translateY(8px);opacity:.4}
      }
    `}</style>
    <div style={{ animation: "scrollBounce 2s ease-in-out infinite" }}>
      <span style={{ display: "block", fontFamily: "'DM Mono','Courier New',monospace", fontSize: 11, letterSpacing: "0.2em", color: "#fff", textTransform: "uppercase", textAlign: "center", marginBottom: 8 }}>
        Scroll to explore
      </span>
      <svg width="18" height="26" viewBox="0 0 18 26" fill="none" style={{ display: "block", margin: "0 auto" }}>
        <rect x="5.5" y="0.5" width="7" height="15" rx="3.5" stroke="white" strokeOpacity="0.6" />
        <rect x="8" y="3" width="2" height="5" rx="1" fill="white" fillOpacity="0.8" />
        <path d="M3 18l6 7 6-7" stroke="white" strokeOpacity="0.6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  </div>
);

/* ================================================================
   HELPERS
   ================================================================ */
function isTimeInRange(time: number, range: { start: number; end: number }): boolean {
  return time >= range.start && time <= range.end;
}

/* ================================================================
   MAIN COMPONENT
   ================================================================ */
interface ScrollVideoProps {
  src: string;
}

export default function ScrollVideo({ src }: ScrollVideoProps) {
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const [showPreloader, setShowPreloader] = useState(true);
  const [activeSection, setActiveSection] = useState<number | null>(null);
  const [introComplete, setIntroComplete] = useState(false);
  const [hotspotVisibility, setHotspotVisibility] = useState<Record<number, boolean>>({});
  const [currentDot, setCurrentDot] = useState(0);

  // Separate state for button visibility — decoupled from introComplete
  // so we can delay the hide when scrolling back.
  const [showButtons, setShowButtons] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const durationRef = useRef(0);
  const activeSectionRef = useRef<number | null>(null);
  const introCompleteRef = useRef(false);
  const endTimeRef = useRef<number>(Infinity);
  const boundaryRafRef = useRef(0);
  const hotspotRafRef = useRef(0);
  const hideButtonsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const bp = useBreakpoint();

  /* ────────────────────────────────────────────────────────────
     SYNC REFS WITH STATE
     ──────────────────────────────────────────────────────────── */
  useEffect(() => { activeSectionRef.current = activeSection; }, [activeSection]);
  useEffect(() => { introCompleteRef.current = introComplete; }, [introComplete]);

  /* ────────────────────────────────────────────────────────────
     DELAYED BUTTON VISIBILITY
     Show immediately when intro completes.
     Hide only after BUTTON_HIDE_DELAY ms when scrolling back.
     ──────────────────────────────────────────────────────────── */
  useEffect(() => {
    if (introComplete) {
      // Cancel any pending hide timer and show right away
      if (hideButtonsTimerRef.current !== null) {
        clearTimeout(hideButtonsTimerRef.current);
        hideButtonsTimerRef.current = null;
      }
      setShowButtons(true);
    } else {
      // Delay hiding so buttons don't flash away on a quick scroll-back
      hideButtonsTimerRef.current = setTimeout(() => {
        setShowButtons(false);
        hideButtonsTimerRef.current = null;
      }, BUTTON_HIDE_DELAY);
    }

    return () => {
      if (hideButtonsTimerRef.current !== null) {
        clearTimeout(hideButtonsTimerRef.current);
      }
    };
  }, [introComplete]);

  /* ────────────────────────────────────────────────────────────
     CURRENT DOT
     ──────────────────────────────────────────────────────────── */
  const updateCurrentDot = useCallback((rawPx: number) => {
    const videoTime = scrollPxToVideoTime(rawPx);
    const dotTimes = [...PAUSE_POINTS.map(p => p.at), INTRO_END];
    let nearest = 0;
    let minDist = Infinity;
    dotTimes.forEach((t, i) => {
      const dist = Math.abs(videoTime - t);
      if (dist < minDist) { minDist = dist; nearest = i; }
    });
    setCurrentDot(nearest);
  }, []);

  /* ────────────────────────────────────────────────────────────
     DOT CLICK
     ──────────────────────────────────────────────────────────── */
  const handleDotClick = useCallback((dotIndex: number) => {
    const st = ScrollTrigger.getAll().find(t => t.vars.id === "scroll-video-trigger");
    if (!st) return;

    const dotTimes = [...PAUSE_POINTS.map(p => p.at), INTRO_END];
    const targetTime = dotTimes[dotIndex];
    const targetLocalPx = videoTimeToScrollPx(targetTime);
    const triggerStart = st.start as number;
    const targetScrollY = triggerStart + targetLocalPx;

    gsap.to(window, {
      scrollTo: { y: targetScrollY, autoKill: false },
      duration: 1.0,
      ease: "power2.inOut",
    });
  }, []);

  /* ────────────────────────────────────────────────────────────
     HOTSPOT VISIBILITY
     ──────────────────────────────────────────────────────────── */
  useEffect(() => {
    if (!videoLoaded) return;
    const video = videoRef.current;
    if (!video) return;

    const checkHotspots = () => {
      const currentTime = video.currentTime;
      const newVisibility: Record<number, boolean> = {};

      HOTSPOTS.forEach((spot) => {
        if (!introCompleteRef.current) {
          newVisibility[spot.id] = spot.showAtTime
            ? isTimeInRange(currentTime, spot.showAtTime)
            : false;
        } else {
          newVisibility[spot.id] = false;
        }
      });

      setHotspotVisibility((prev) => {
        const isDifferent = HOTSPOTS.some((spot) => prev[spot.id] !== newVisibility[spot.id]);
        return isDifferent ? newVisibility : prev;
      });

      hotspotRafRef.current = requestAnimationFrame(checkHotspots);
    };

    hotspotRafRef.current = requestAnimationFrame(checkHotspots);
    return () => cancelAnimationFrame(hotspotRafRef.current);
  }, [videoLoaded]);

  /* ────────────────────────────────────────────────────────────
     VIDEO LOAD + PRELOADER
     ──────────────────────────────────────────────────────────── */
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let fakeP = 0;
    let mounted = true;

    const interval = setInterval(() => {
      if (!mounted) return;
      fakeP = Math.min(fakeP + Math.random() * 12, 85);
      setLoadProgress(fakeP);
    }, 120);

    const onMeta = () => {
      if (mounted) durationRef.current = video.duration;
    };

    const onCanPlay = () => {
      clearInterval(interval);
      if (!mounted) return;
      setLoadProgress(100);
      setTimeout(() => {
        if (mounted) { setShowPreloader(false); setVideoLoaded(true); }
      }, 600);
    };

    video.addEventListener("loadedmetadata", onMeta);
    video.addEventListener("canplay", onCanPlay, { once: true });
    video.preload = "auto";
    video.load();

    if (video.readyState >= 1) onMeta();
    if (video.readyState >= 3) onCanPlay();

    return () => {
      mounted = false;
      clearInterval(interval);
      video.removeEventListener("loadedmetadata", onMeta);
      video.removeEventListener("canplay", onCanPlay);
    };
  }, [src]);

  /* ────────────────────────────────────────────────────────────
     SCROLL-DRIVEN INTRO
     ──────────────────────────────────────────────────────────── */
  useEffect(() => {
    if (!containerRef.current || !videoLoaded) return;
    const video = videoRef.current!;

    document.documentElement.style.overscrollBehavior = "none";
    document.body.style.overscrollBehavior = "none";

    const proxy = { raw: 0 };

    const ctx = gsap.context(() => {
      gsap.timeline({
        scrollTrigger: {
          id: "scroll-video-trigger",
          trigger: containerRef.current,
          start: "top top",
          end: `+=${TOTAL_SCROLL_DISTANCE}`,
          pin: true,
          pinSpacing: true,
          scrub: 0.5,
          anticipatePin: 1,
          onUpdate: (self) => {
            const rawPx = self.progress * TOTAL_SCROLL_DISTANCE;

            // Handle introComplete state
            const isIntroComplete = rawPx >= INTRO_SCROLL_DISTANCE - 10;
            if (isIntroComplete !== introCompleteRef.current) {
              introCompleteRef.current = isIntroComplete;
              setIntroComplete(isIntroComplete);
            }

            if (rawPx <= INTRO_SCROLL_DISTANCE) {
              // Intro Phase
              updateCurrentDot(rawPx);
              const videoTime = scrollPxToVideoTime(rawPx);

              if (activeSectionRef.current !== null) {
                if (!video.paused) video.pause();
                activeSectionRef.current = null;
                setActiveSection(null);
              }

              video.currentTime = Math.max(0, Math.min(videoTime, INTRO_END));
              if (progressRef.current) {
                progressRef.current.style.transform = `scaleX(${Math.min(videoTime / INTRO_END, 1)})`;
              }
            } else {
              // Sections Phase
              const sectionProgressRaw = (rawPx - INTRO_SCROLL_DISTANCE) / SECTION_SCROLL_DISTANCE;
              const sectionIndex = Math.min(
                Math.floor(sectionProgressRaw),
                SECTIONS.length - 1
              );

              if (activeSectionRef.current !== sectionIndex) {
                activeSectionRef.current = sectionIndex;
                setActiveSection(sectionIndex);

                const section = SECTIONS[sectionIndex];
                const duration = durationRef.current || 9999;
                endTimeRef.current = section.end === Infinity ? duration : section.end;

                video.currentTime = section.start;
                if (progressRef.current) progressRef.current.style.transform = "scaleX(0)";
                video.play().catch(() => { });
              }
            }
          },
        },
      }).to(proxy, { raw: 1, duration: 1, ease: "none" });
    }, containerRef);

    return () => {
      ctx.revert();
      document.documentElement.style.overscrollBehavior = "";
      document.body.style.overscrollBehavior = "";
    };
  }, [videoLoaded, updateCurrentDot]);

  /* ────────────────────────────────────────────────────────────
     RAF BOUNDARY ENFORCEMENT
     ──────────────────────────────────────────────────────────── */
  useEffect(() => {
    if (!videoLoaded) return;
    const video = videoRef.current;
    if (!video) return;

    const tick = () => {
      const currentActive = activeSectionRef.current;
      if (currentActive !== null && !video.paused) {
        const duration = durationRef.current || 9999;
        const endTime = endTimeRef.current === Infinity ? duration : endTimeRef.current;

        if (progressRef.current) {
          const sec = SECTIONS[currentActive];
          const secStart = sec.start;
          const secEnd = sec.end === Infinity ? duration : sec.end;
          const secLen = secEnd - secStart;
          const elapsed = video.currentTime - secStart;
          const pct = secLen > 0 ? Math.max(0, Math.min(elapsed / secLen, 1)) : 0;
          progressRef.current.style.transform = `scaleX(${pct})`;
        }

        if (video.currentTime >= endTime - 0.08) {
          video.pause();
          video.currentTime = Math.min(endTime, duration);
        }
      }
      boundaryRafRef.current = requestAnimationFrame(tick);
    };

    boundaryRafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(boundaryRafRef.current);
  }, [videoLoaded]);

  /* ────────────────────────────────────────────────────────────
     SECTION BUTTON CLICK
     ──────────────────────────────────────────────────────────── */
  const handleSectionClick = useCallback(
    (sectionIndex: number) => {
      const st = ScrollTrigger.getAll().find(t => t.vars.id === "scroll-video-trigger");
      if (!st) return;

      const triggerStart = st.start as number;
      const targetLocalPx = INTRO_SCROLL_DISTANCE + sectionIndex * SECTION_SCROLL_DISTANCE;
      const targetScrollY = triggerStart + targetLocalPx;

      gsap.to(window, {
        scrollTo: { y: targetScrollY, autoKill: false },
        duration: 1.0,
        ease: "power2.inOut",
      });
    },
    []
  );

  const showScrollHint = !introComplete && videoLoaded && !showPreloader;

  /* ================================================================
     RENDER
     ================================================================ */
  return (
    <>
      <Preloader progress={loadProgress} visible={showPreloader} />

      <div
        ref={containerRef}
        style={{ width: "100%", height: "100vh", background: "#000", overflow: "hidden", position: "relative" }}
      >
        {/* Video */}
        <video
          ref={videoRef}
          src={src}
          muted
          playsInline
          preload="auto"
          tabIndex={-1}
          style={{
            position: "absolute", inset: 0,
            width: "100%", height: "100%",
            objectFit: "cover", backgroundColor: "#000", zIndex: 1,
          }}
        />

        {/* Hotspot Cards */}
        {HOTSPOTS.map((spot) => (
          <HotspotCard
            key={spot.id}
            spot={spot}
            visible={hotspotVisibility[spot.id] ?? false}
            bp={bp}
          />
        ))}

        {/* ── Section Buttons ── */}
        <div
          style={{
            position: "absolute", top: 80, left: 0, right: 0, zIndex: 60,
            display: "flex", justifyContent: "center", pointerEvents: "none",
            opacity: showButtons ? 1 : 0,
            transform: showButtons ? "translateY(0)" : "translateY(-20px)",
            transition: "opacity 0.5s cubic-bezier(0.4,0,0.2,1), transform 0.5s cubic-bezier(0.34,1.56,0.64,1)",
          }}
        >
          <div
            style={{
              background: "rgba(255,255,255,0.95)", backdropFilter: "blur(12px)",
              borderRadius: 999, padding: "4px", display: "inline-flex", gap: 2,
              boxShadow: "0 4px 24px rgba(0,0,0,0.15)",
              pointerEvents: showButtons ? "auto" : "none",
            }}
          >
            {SECTIONS.map((section, idx) => (
              <button
                key={section.id}
                onClick={() => handleSectionClick(idx)}
                style={{
                  padding: bp === "sm" ? "6px 16px" : "8px 22px",
                  borderRadius: 999,
                  fontFamily: "'DM Mono','Courier New',monospace",
                  fontSize: bp === "sm" ? 12 : 14,
                  fontWeight: 500,
                  letterSpacing: "0.03em",
                  border: "none",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  transition: "background 0.3s ease, color 0.3s ease, box-shadow 0.3s ease",
                  background: activeSection === idx ? "#dc2626" : "transparent",
                  color: activeSection === idx ? "#fff" : "#333",
                  boxShadow: activeSection === idx ? "0 2px 10px rgba(220,38,38,0.35)" : "none",
                }}
              >
                {section.name}
              </button>
            ))}
          </div>
        </div>

        {/* ── Dot Nav — intro phase ── */}
        <div
          style={{
            position: "absolute",
            right: bp === "sm" ? 12 : 16,
            top: "50%",
            transform: "translateY(-50%)",
            zIndex: 50,
            display: "flex",
            flexDirection: "column",
            gap: bp === "sm" ? 8 : 12,
            opacity: showScrollHint ? 1 : 0,
            transition: "opacity 0.5s ease",
            pointerEvents: showScrollHint ? "auto" : "none",
          }}
        >
          {Array.from({ length: TOTAL_DOT_STOPS }).map((_, idx) => (
            <button
              key={idx}
              onClick={() => handleDotClick(idx)}
              style={{
                width: currentDot === idx ? 12 : 10,
                height: currentDot === idx ? 12 : 10,
                borderRadius: "50%",
                border: "none",
                cursor: "pointer",
                padding: 0,
                transition: "all 0.3s ease",
                background: currentDot === idx ? "#dc2626" : "rgba(255,255,255,0.5)",
                boxShadow: currentDot === idx
                  ? "0 0 0 3px rgba(220,38,38,0.25), 0 2px 8px rgba(220,38,38,0.4)"
                  : "none",
              }}
              aria-label={`Go to stop ${idx + 1}`}
            />
          ))}
        </div>

        {/* ── Dot Nav — section phase ── */}
        <div
          style={{
            position: "absolute",
            right: bp === "sm" ? 12 : 16,
            top: "50%",
            transform: "translateY(-50%)",
            zIndex: 50,
            display: "flex",
            flexDirection: "column",
            gap: bp === "sm" ? 8 : 12,
            opacity: showButtons ? 1 : 0,
            transition: "opacity 0.5s ease",
            pointerEvents: showButtons ? "auto" : "none",
          }}
        >
          {SECTIONS.map((section, idx) => (
            <button
              key={section.id}
              onClick={() => handleSectionClick(idx)}
              style={{
                width: activeSection === idx ? 12 : 10,
                height: activeSection === idx ? 12 : 10,
                borderRadius: "50%",
                border: "none",
                cursor: "pointer",
                padding: 0,
                transition: "all 0.3s ease",
                background: activeSection === idx ? "#dc2626" : "rgba(255,255,255,0.5)",
                boxShadow: activeSection === idx
                  ? "0 0 0 3px rgba(220,38,38,0.25), 0 2px 8px rgba(220,38,38,0.4)"
                  : "none",
              }}
              aria-label={`Play section: ${section.name}`}
            />
          ))}
        </div>
      </div>
    </>
  );
}