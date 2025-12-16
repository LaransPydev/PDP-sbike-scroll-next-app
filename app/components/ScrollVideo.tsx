"use client";

import { useEffect, useRef, useState } from "react";

export default function ScrollVideo() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const scrollZoneRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [isLoaded, setIsLoaded] = useState(false);
  const [currentSegment, setCurrentSegment] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [loadProgress, setLoadProgress] = useState(0);

  const animationRef = useRef<number | undefined>(undefined);
  const currentFrameRef = useRef(0);
  const targetFrameRef = useRef(0);
  const lastUiUpdateRef = useRef(0);
  const velocityRef = useRef(0); // Track scroll velocity
  const lastTargetRef = useRef(0); // Track last target for velocity

  // Time segments with corresponding text content
  const SEGMENTS_DATA = [
    { time: [0, 1], title: "Introduction and Vision" },
    { time: [1, 3], title: "Innovation and Creativity" },
    { time: [3, 6], title: "Design Excellence and Craftsmanship" },
    { time: [6, 8], title: "User Experience and Engagement" },
    { time: [8, 10], title: "Technical Excellence and Precision" },
    { time: [10, 11], title: "Collaboration and Synergy" },
    { time: [11, 12], title: "Innovation Hub and Future" },
    { time: [12, 15], title: "Global Reach and Impact" },
    { time: [15, 17], title: "Sustainability and Responsibility" },
    { time: [17, 18], title: "Security First and Trust" },
    { time: [18, 20], title: "Customer Success and Satisfaction" },
    { time: [20, 21], title: "The Journey Continues and Evolves" },
  ];

  const TOTAL_SEGMENTS = SEGMENTS_DATA.length;
  const SCROLL_HEIGHT = 1000;
  const TOTAL_DURATION = 21;

  // Adaptive lerp with velocity consideration
  const getAdaptiveLerpFactor = (velocity: number): number => {
    // Base lerp factor
    const baseLerp = 0.15;

    // Increase lerp factor based on velocity for responsive scrolling
    // Velocity ranges from 0 to 100, map to lerp 0.15 to 0.6
    const velocityInfluence = Math.min(velocity / 100, 1) * 0.45;

    return baseLerp + velocityInfluence;
  };

  const lerp = (start: number, end: number, factor: number): number => {
    return start + (end - start) * factor;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const zone = scrollZoneRef.current;

    if (!canvas || !video || !zone) return;

    const ctx = canvas.getContext("2d", {
      alpha: false,
      desynchronized: true,
    });
    if (!ctx) return;

    // Canvas size setup with DPR awareness
    const setCanvasSize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;

      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    };

    setCanvasSize();
    window.addEventListener("resize", setCanvasSize);

    video.preload = "auto";
    video.muted = true;
    video.playsInline = true;
    video.pause();

    zone.style.height = `${SCROLL_HEIGHT}vh`;

    const handleCanPlay = () => {
      setIsLoaded(true);
      setLoadProgress(100);
      drawFrame();
    };

    const handleProgress = () => {
      if (video.buffered.length > 0 && video.duration > 0) {
        const buffered = video.buffered.end(video.buffered.length - 1);
        const duration = video.duration;
        setLoadProgress((buffered / duration) * 100);
      }
    };

    video.addEventListener("canplay", handleCanPlay);
    video.addEventListener("progress", handleProgress);
    video.addEventListener("loadedmetadata", handleProgress);

    const drawFrame = () => {
      if (!video || !canvas) return;

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
    };

    const animate = () => {
      // Calculate velocity (difference between current and target)
      const frameDifference = targetFrameRef.current - currentFrameRef.current;
      velocityRef.current = Math.abs(frameDifference);

      // Get adaptive lerp factor based on velocity
      const adaptiveLerpFactor = getAdaptiveLerpFactor(velocityRef.current);

      // Apply smooth interpolation with adaptive factor
      currentFrameRef.current = lerp(
        currentFrameRef.current,
        targetFrameRef.current,
        adaptiveLerpFactor
      );

      // Calculate video time from frame progress (0-100)
      const targetTime = (currentFrameRef.current / 100) * TOTAL_DURATION;

      // Update video currentTime with small threshold to avoid unnecessary sets
      if (Math.abs(video.currentTime - targetTime) > 0.02) {
        video.currentTime = targetTime;
      }

      drawFrame();

      // UI updates less frequently to prevent jank (every ~50ms)
      const now = performance.now();
      if (now - lastUiUpdateRef.current > 50) {
        lastUiUpdateRef.current = now;

        // Calculate segment based on interpolated frame progress
        const rawProgress = currentFrameRef.current / 100;
        const segmentIndex = Math.min(
          Math.floor(rawProgress * TOTAL_SEGMENTS),
          TOTAL_SEGMENTS - 1
        );

        setCurrentSegment(segmentIndex);
        setCurrentTime(targetTime);
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    // Optimized scroll handler with velocity tracking
    let scrollTicking = false;
    let lastScrollProgress = 0;

    const handleScroll = () => {
      if (scrollTicking) return;
      scrollTicking = true;

      requestAnimationFrame(() => {
        const rect = zone.getBoundingClientRect();
        const scrolled = -rect.top;
        const total = rect.height - window.innerHeight;

        let progress = Math.max(0, Math.min(1, scrolled / total));
        const newTarget = progress * 100;

        // Calculate velocity for this frame
        const scrollDelta = Math.abs(newTarget - lastScrollProgress);
        lastScrollProgress = newTarget;

        targetFrameRef.current = newTarget;
        scrollTicking = false;
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", setCanvasSize);
      video.removeEventListener("canplay", handleCanPlay);
      video.removeEventListener("progress", handleProgress);
      video.removeEventListener("loadedmetadata", handleProgress);

      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  const currentSegmentData = SEGMENTS_DATA[currentSegment];

  return (
    <div className="w-full bg-black min-h-screen">
      <div className="w-full max-w-[1920px] mx-auto">
        <div ref={scrollZoneRef} className="relative w-full">
          <div className="sticky top-0 h-screen flex items-center">
            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full px-4 sm:px-6 lg:px-8">
              {/* Left Column - Video Player */}
              <div className="flex items-center justify-center">
                <div className="relative w-full aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl">
                  <video
                    ref={videoRef}
                    src="/banner.mp4"
                    className="hidden"
                    muted
                    playsInline
                    preload="auto"
                  />

                  <canvas ref={canvasRef} className="w-full h-full object-cover" />

                  {!isLoaded && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/95 backdrop-blur-xl">
                      <div className="relative w-20 h-20 mb-6">
                        <div className="absolute inset-0 border-[3px] border-white/10 rounded-full" />
                        <div
                          className="absolute inset-0 border-[3px] border-white border-t-transparent rounded-full animate-spin"
                          style={{ animationDuration: "0.8s" }}
                        />
                      </div>
                      <p className="text-white text-xl font-light mb-3">
                        Loading experience...
                      </p>
                      <div className="w-56 h-1 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-white transition-all duration-300 ease-out"
                          style={{ width: `${loadProgress}%` }}
                        />
                      </div>
                      <p className="text-white/50 text-sm mt-3 font-light">
                        {Math.round(loadProgress)}%
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column - Dynamic Text Content */}
              <div className="w-full max-w-lg">
                {isLoaded && (
                  <div className="space-y-1">
                    {SEGMENTS_DATA.map((segment, index) => (
                      <div
                        key={`desktop-${index}`}
                        className="transition-all duration-300"
                      >
                        <h1
                          className={`text-lg md:text-xl font-bold leading-tight ${
                            index === currentSegment
                              ? "text-black dark:text-white"
                              : "text-white dark:text-black"
                          }`}
                          style={{
                            opacity: index === currentSegment ? 1 : 0.3,
                            transform:
                              index === currentSegment
                                ? "translateX(0)"
                                : "translateX(-10px)",
                            transitionProperty:
                              "opacity, transform, color",
                            transitionDuration: "300ms",
                            transitionTimingFunction: "ease-out",
                          }}
                        >
                          {segment.title}
                        </h1>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
      `}</style>
    </div>
  );
}