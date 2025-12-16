"use client";

import {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
  CSSProperties,
} from "react";

const ScrollVideos = () => {
  // ============ REFS ============
  const canvasRefDesktop = useRef<HTMLCanvasElement | null>(null);
  const canvasRefMobile = useRef<HTMLCanvasElement | null>(null);
  const scrollZoneRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const titleRef = useRef<HTMLDivElement | null>(null);
  const titleRefMobile = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // ============ STATE ============
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentSegment, setCurrentSegment] = useState(0);
  const [displayedSegment, setDisplayedSegment] = useState(0);
  const [loadProgress, setLoadProgress] = useState(0);

  // ============ ANIMATION STATE ============
  const animationStateRef = useRef({
    lastSegment: 0,
    lastScrollProgress: 0,   // 🔥 NEW
    lastFrameTime: 0,        // 🔥 NEW
  });

  // ============ SEGMENTS DATA ============
  const SEGMENTS_DATA = useMemo(
    () => [
      { time: [0, 1], title: "Introduction to Our Company and Vision" },
      { time: [1, 3], title: "Innovating for the Future of Technology" },
      { time: [3, 6], title: "Design Excellence and Aesthetic Innovation" },
      { time: [6, 8], title: "Focusing on Exceptional User Experience" },
      { time: [8, 10], title: "Achieving Technical Excellence through Expertise" },
      { time: [10, 11], title: "Building Strong and Effective Collaboration" },
      { time: [11, 12], title: "Our Innovation Hub: A Place for New Ideas" },
      { time: [12, 15], title: "Expanding Our Global Reach and Influence" },
      { time: [15, 17], title: "Commitment to Sustainability and Environmental Impact" },
      { time: [17, 18], title: "Prioritizing Security First in Every Aspect" },
      { time: [18, 20], title: "Customer Success: Empowering Our Clients" },
      { time: [20, 21], title: "The Journey Continues: Exciting Future Ahead" },
    ],
    []
  );

  const TOTAL_SEGMENTS = SEGMENTS_DATA.length;
  const SCROLL_HEIGHT = 700;
  const PITSTOP_THRESHOLD = 0.8; // 0–1
  const VIDEO_DURATION = 22;

  // After every 4th segment: 3, 7, 11, ...  (0-based)
  const isHardStopSegment = (index: number) => (index + 1) % 4 === 0;

  // ============ CANVAS SETUP ============
  const setCanvasSize = useCallback(
    (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;

      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    },
    []
  );

  // ============ DRAW FRAME ============
  const drawFrame = useCallback(
    (
      video: HTMLVideoElement,
      canvas: HTMLCanvasElement,
      ctx: CanvasRenderingContext2D
    ) => {
      const dpr = window.devicePixelRatio || 1;
      const canvasWidth = canvas.width / dpr;
      const canvasHeight = canvas.height / dpr;

      const videoAspect = video.videoWidth / video.videoHeight || 16 / 9;
      const canvasAspect = canvasWidth / canvasHeight;

      let drawWidth: number;
      let drawHeight: number;
      let offsetX: number;
      let offsetY: number;

      if (canvasAspect > videoAspect) {
        drawWidth = canvasWidth;
        drawHeight = canvasWidth / videoAspect;
        offsetX = 0;
        offsetY = (canvasHeight - drawHeight) / 2;
      } else {
        drawHeight = canvasHeight;
        drawWidth = canvasHeight * videoAspect;
        offsetX = (canvasWidth - drawWidth) / 2;
        offsetY = 0;
      }

      ctx.clearRect(0, 0, canvasWidth, canvasHeight);
      ctx.drawImage(video, offsetX, offsetY, drawWidth, drawHeight);
    },
    []
  );

  // ============ TEXT ANIMATION ============
  const applyTextAnimation = useCallback(
    (element: HTMLElement | null, progress: number) => {
      if (!element) return;

      const words = element.querySelectorAll<HTMLElement>(".word-reveal");
      const totalWords = words.length;
      if (!totalWords) return;

      const maxDelay = 0.6;

      words.forEach((word, index) => {
        const t = totalWords === 1 ? 0 : index / (totalWords - 1);
        const wordDelay = t * maxDelay;

        let wordProgress =
          progress <= wordDelay
            ? 0
            : (progress - wordDelay) / (1 - wordDelay);

        wordProgress = Math.max(0, Math.min(1, wordProgress));

        const opacity = wordProgress;
        const scale = 0.85 + wordProgress * 0.15;
        const rotation = (1 - wordProgress) * -8;

        word.style.opacity = `${opacity}`;
        word.style.transform = `scale(${scale}) rotateZ(${rotation}deg)`;
      });
    },
    []
  );

  const resetTextAnimation = useCallback((element: HTMLElement | null) => {
    if (!element) return;

    const words = element.querySelectorAll<HTMLElement>(".word-reveal");
    words.forEach((word) => {
      word.style.opacity = "0";
      word.style.transform = "scale(0.85) rotateZ(-8deg)";
    });
  }, []);

  // ============ SCROLL PROGRESS ============
  const calculateScrollProgress = useCallback(() => {
    if (!scrollZoneRef.current) return 0;

    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const sectionStart = scrollZoneRef.current.offsetTop;
    const sectionEnd =
      sectionStart + scrollZoneRef.current.offsetHeight - window.innerHeight;

    if (sectionEnd === sectionStart) return 0;

    return Math.max(
      0,
      Math.min(1, (scrollTop - sectionStart) / (sectionEnd - sectionStart))
    );
  }, []);

  // ============ MAIN ANIMATION LOOP ============
  useEffect(() => {
    const canvasDesktop = canvasRefDesktop.current;
    const canvasMobile = canvasRefMobile.current;
    const video = videoRef.current;
    const zone = scrollZoneRef.current;

    if (!video || !zone) return;

    let ctxDesktop: CanvasRenderingContext2D | null = null;
    let ctxMobile: CanvasRenderingContext2D | null = null;

    if (canvasDesktop) {
      ctxDesktop = canvasDesktop.getContext("2d", {
        alpha: false,
        desynchronized: true,
      });
      if (ctxDesktop) setCanvasSize(canvasDesktop, ctxDesktop);
    }

    if (canvasMobile) {
      ctxMobile = canvasMobile.getContext("2d", {
        alpha: false,
        desynchronized: true,
      });
      if (ctxMobile) setCanvasSize(canvasMobile, ctxMobile);
    }

    video.src = "/banner.mp4";
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";
    video.crossOrigin = "anonymous";

    zone.style.height = `${SCROLL_HEIGHT}vh`;

    const handleCanPlay = () => setIsLoaded(true);
    const handleProgress = () => {
      if (video.buffered.length > 0 && video.duration > 0) {
        const buffered = video.buffered.end(video.buffered.length - 1);
        setLoadProgress((buffered / video.duration) * 100);
      }
    };

    video.addEventListener("canplay", handleCanPlay);
    video.addEventListener("progress", handleProgress);
    video.addEventListener("loadedmetadata", handleProgress);

    let lastUpdateTime = 0;
    const segmentSize = 1 / TOTAL_SEGMENTS;

    const animate = (currentTime: number) => {
      if (currentTime - lastUpdateTime < 16.67) {
        requestAnimationFrame(animate);
        return;
      }
      lastUpdateTime = currentTime;

      const scrollProgress = calculateScrollProgress();
      const state = animationStateRef.current;

      // 🔥 1) SCROLL VELOCITY CALC
      const dt = state.lastFrameTime
        ? (currentTime - state.lastFrameTime) / 1000
        : 0.016; // ~60fps default
      const dScroll = scrollProgress - state.lastScrollProgress;
      const velocity = dt > 0 ? dScroll / dt : 0; // scroll progress per second
      state.lastScrollProgress = scrollProgress;
      state.lastFrameTime = currentTime;

      // 🔥 2) MAP VELOCITY TO EXTRA VIDEO SPEED
      // Base mapping: scrollProgress → videoTime
      let targetTime = scrollProgress * VIDEO_DURATION;

      // Extra speed factor for fast scroll (tune as needed)
      const speedFactor = 0.3; // higher = more aggressive
      const extraTime = velocity * VIDEO_DURATION * speedFactor;

      targetTime += extraTime;

      // Clamp to valid range
      targetTime = Math.max(0, Math.min(VIDEO_DURATION, targetTime));

      // Apply scrub
      if (Math.abs(targetTime - video.currentTime) > 0.02) {
        video.currentTime = targetTime;
      }

      if (canvasDesktop && ctxDesktop)
        drawFrame(video, canvasDesktop, ctxDesktop);
      if (canvasMobile && ctxMobile)
        drawFrame(video, canvasMobile, ctxMobile);

      // 3) SEGMENT + PITSTOP
      let potentialSegment = Math.floor(scrollProgress / segmentSize);
      potentialSegment = Math.max(
        0,
        Math.min(TOTAL_SEGMENTS - 1, potentialSegment)
      );

      const prevIndex = state.lastSegment;
      const prevStart = prevIndex * segmentSize;
      const prevEnd = prevStart + segmentSize;
      const prevProgress =
        prevEnd > prevStart
          ? (scrollProgress - prevStart) / (prevEnd - prevStart)
          : 0;

      // forward movement
      if (potentialSegment > state.lastSegment) {
        // 🔥 HARD STOP AFTER EVERY 4 SEGMENTS
        if (isHardStopSegment(prevIndex)) {
          // if we are at 3,7,11... do not auto jump until user scrolls well past
          if (prevProgress < 1) {
            // lock to this hard-stop segment
            potentialSegment = prevIndex;
          } else {
            // only after fully crossing its range, allow next
            state.lastSegment = potentialSegment;
            setCurrentSegment(potentialSegment);
            setDisplayedSegment(potentialSegment);
            resetTextAnimation(titleRef.current);
            resetTextAnimation(titleRefMobile.current);
          }
        } else {
          // normal pitstop behavior
          if (prevProgress >= PITSTOP_THRESHOLD) {
            state.lastSegment = potentialSegment;
            setCurrentSegment(potentialSegment);
            setDisplayedSegment(potentialSegment);
            resetTextAnimation(titleRef.current);
            resetTextAnimation(titleRefMobile.current);
          }
        }
      }

      // backward free
      if (potentialSegment < state.lastSegment) {
        state.lastSegment = potentialSegment;
        setCurrentSegment(potentialSegment);
        setDisplayedSegment(potentialSegment);
        resetTextAnimation(titleRef.current);
        resetTextAnimation(titleRefMobile.current);
      }

      // TEXT PROGRESS (based on active segment, not potential)
      const activeIndex =
        state.lastSegment >= 0 && state.lastSegment < TOTAL_SEGMENTS
          ? state.lastSegment
          : 0;
      const segStart = activeIndex * segmentSize;
      const segEnd = segStart + segmentSize;

      let segProgress =
        segEnd > segStart ? (scrollProgress - segStart) / (segEnd - segStart) : 0;
      segProgress = Math.max(0, Math.min(1, segProgress));

      const textAnimationDuration = 0.8;
      const textProgress = Math.max(
        0,
        Math.min(1, segProgress / textAnimationDuration)
      );

      applyTextAnimation(titleRef.current, textProgress);
      applyTextAnimation(titleRefMobile.current, textProgress);

      requestAnimationFrame(animate);
    };

    const animationId = requestAnimationFrame(animate);

    const handleResize = () => {
      if (canvasDesktop && ctxDesktop) setCanvasSize(canvasDesktop, ctxDesktop);
      if (canvasMobile && ctxMobile) setCanvasSize(canvasMobile, ctxMobile);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      video.removeEventListener("canplay", handleCanPlay);
      video.removeEventListener("progress", handleProgress);
      video.removeEventListener("loadedmetadata", handleProgress);
      cancelAnimationFrame(animationId);
    };
  }, [
    setCanvasSize,
    drawFrame,
    calculateScrollProgress,
    applyTextAnimation,
    resetTextAnimation,
    TOTAL_SEGMENTS,
    SCROLL_HEIGHT,
    VIDEO_DURATION,
  ]);

  const currentSegmentData = SEGMENTS_DATA[displayedSegment];

  return (
    <div
      ref={containerRef}
      className="w-full min-h-screen"
      style={{ WebkitOverflowScrolling: "touch" } as CSSProperties}
    >
      <div className="w-full h-full">
        <div
          ref={scrollZoneRef}
          className="relative w-full"
          style={{ WebkitOverflowScrolling: "touch" } as CSSProperties}
        >
          <div className="sticky top-0 h-screen flex items-center justify-center overflow-hidden">
            {/* MOBILE */}
            <div className="flex md:hidden flex-col justify-center items-center w-full h-full px-4 gap-6 py-8">
              <div className="w-full max-w-lg flex-shrink-0">
                {isLoaded && currentSegmentData && (
                  <div className="space-y-4 text-center">
                    <h1
                      ref={titleRefMobile}
                      className="text-xl sm:text-2xl font-bold leading-tight text-black dark:text-white"
                    >
                      {currentSegmentData.title.split(" ").map((word, i) => (
                        <span
                          key={`mobile-${displayedSegment}-${i}`}
                          className="word-reveal inline-block mr-1"
                        >
                          {word}
                        </span>
                      ))}
                    </h1>
                  </div>
                )}
              </div>

              <div className="w-full max-w-lg flex-shrink-0">
                <div className="relative w-full aspect-video rounded-xl bg-black overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.8)]">
                  <canvas
                    ref={canvasRefMobile}
                    className="w-full h-full rounded-xl"
                  />
                  {!isLoaded && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                      <div className="text-white text-sm">
                        Loading... {Math.round(loadProgress)}%
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* DESKTOP */}
            <div className="hidden md:flex w-full h-full items-center overflow-hidden">
              <div className="flex items-center justify-center h-full w-1/2 p-8 flex-shrink-0">
                <div className="relative w-full aspect-video rounded-xl bg-black overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.8)]">
                  <canvas
                    ref={canvasRefDesktop}
                    className="w-full h-full rounded-xl"
                  />
                  {!isLoaded && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                      <div className="text-white text-sm">
                        Loading... {Math.round(loadProgress)}%
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col justify-center items-start h-full p-8 w-1/2 flex-shrink-0">
                <div className="w-full max-w-lg">
                  {isLoaded && currentSegmentData && (
                    <div className="space-y-6">
                      <div className="space-y-4">
                        <h1
                          ref={titleRef}
                          className="text-2xl md:text-4xl font-bold leading-tight text-black dark:text-white"
                        >
                          {currentSegmentData.title.split(" ").map((word, i) => (
                            <span
                              key={`desktop-${displayedSegment}-${i}`}
                              className="word-reveal inline-block mr-1"
                            >
                              {word}
                            </span>
                          ))}
                        </h1>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <video
        ref={videoRef}
        preload="auto"
        muted
        playsInline
        crossOrigin="anonymous"
        className="hidden"
      />

      <style jsx>{`
        html,
        body {
          scroll-behavior: smooth;
          -webkit-overflow-scrolling: touch;
          overflow-x: hidden;
        }

        .word-reveal {
          opacity: 0;
          transform: scale(0.85) rotateZ(-8deg);
          transform-origin: center center;
          display: inline-block;
          will-change: opacity, transform;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }

        canvas {
          display: block;
          width: 100%;
          height: 100%;
        }

        * {
          -webkit-touch-callout: none;
        }

        @supports (scroll-behavior: smooth) {
          html {
            scroll-behavior: smooth;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .word-reveal {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default ScrollVideos;
