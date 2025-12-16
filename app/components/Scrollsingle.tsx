"use client"
import { useEffect, useRef, useState, useCallback } from "react";

const Scrollsingle = () => {
    const canvasRefDesktop = useRef<HTMLCanvasElement | null>(null);
    const canvasRefMobile = useRef<HTMLCanvasElement | null>(null);
    const scrollZoneRef = useRef<HTMLDivElement | null>(null);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [currentSegment, setCurrentSegment] = useState(0);
    const [loadProgress, setLoadProgress] = useState(0);

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
        { time: [20, 21], title: "The Journey Continues and Evolves" }
    ];

    const TOTAL_SEGMENTS = SEGMENTS_DATA.length;
    const SCROLL_HEIGHT = 800;
    const PITSTOP_THRESHOLD = 0.80;

    const calculateScrollProgress = useCallback(() => {
        const zone = scrollZoneRef.current;
        if (!zone) return 0;

        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const sectionStart = zone.offsetTop;
        const sectionEnd = sectionStart + zone.offsetHeight - window.innerHeight;

        const raw = Math.min(Math.max(scrollTop, sectionStart), sectionEnd);
        return Math.max(0, Math.min(1, (raw - sectionStart) / (sectionEnd - sectionStart)));
    }, []);

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

    const animationRef = useRef<number | undefined>(undefined);
    const lastSegmentRef = useRef(0);

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
            if (ctxDesktop) {
                setCanvasSize(canvasDesktop, ctxDesktop);
            }
        }

        if (canvasMobile) {
            ctxMobile = canvasMobile.getContext("2d", {
                alpha: false,
                desynchronized: true,
            });
            if (ctxMobile) {
                setCanvasSize(canvasMobile, ctxMobile);
            }
        }

        video.src = "/banner.mp4";
        video.muted = true;
        video.playsInline = true;
        video.preload = "auto";
        video.crossOrigin = "anonymous";

        zone.style.height = `${SCROLL_HEIGHT}vh`;

        const handleCanPlay = () => {
            setIsLoaded(true);
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

        const animate = () => {
            const scrollProgress = calculateScrollProgress();
            const videoDuration = video.duration || 21;
            const targetTime = scrollProgress * videoDuration;

            if (Math.abs(targetTime - video.currentTime) > 0.1) {
                video.currentTime = targetTime;
            }

            if (canvasDesktop && ctxDesktop) {
                drawFrame(video, canvasDesktop, ctxDesktop);
            }
            if (canvasMobile && ctxMobile) {
                drawFrame(video, canvasMobile, ctxMobile);
            }

            const segmentSize = 1 / TOTAL_SEGMENTS;
            let potentialSegment = Math.floor(scrollProgress * TOTAL_SEGMENTS);
            potentialSegment = Math.min(potentialSegment, TOTAL_SEGMENTS - 1);

            const segmentProgress = (scrollProgress - (potentialSegment * segmentSize)) / segmentSize;

            if (potentialSegment > lastSegmentRef.current) {
                const previousSegmentProgress = (scrollProgress - ((potentialSegment - 1) * segmentSize)) / segmentSize;

                if (previousSegmentProgress >= PITSTOP_THRESHOLD) {
                    lastSegmentRef.current = potentialSegment;
                    setCurrentSegment(potentialSegment);
                }
            } else if (potentialSegment < lastSegmentRef.current) {
                lastSegmentRef.current = potentialSegment;
                setCurrentSegment(potentialSegment);
            }

            animationRef.current = requestAnimationFrame(animate);
        };

        animationRef.current = requestAnimationFrame(animate);

        const handleResize = () => {
            if (canvasDesktop && ctxDesktop) {
                setCanvasSize(canvasDesktop, ctxDesktop);
            }
            if (canvasMobile && ctxMobile) {
                setCanvasSize(canvasMobile, ctxMobile);
            }
        };

        window.addEventListener("resize", handleResize);

        return () => {
            window.removeEventListener("resize", handleResize);
            video.removeEventListener("canplay", handleCanPlay);
            video.removeEventListener("progress", handleProgress);
            video.removeEventListener("loadedmetadata", handleProgress);

            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [setCanvasSize, drawFrame, calculateScrollProgress, TOTAL_SEGMENTS, SCROLL_HEIGHT]);

    return (
        <div className="w-full min-h-screen bg-black">
            <div className="w-full h-full">
                <div ref={scrollZoneRef} className="relative w-full">
                    <div className="sticky top-0 h-screen flex items-center justify-center">
                        <div className="w-full h-full flex flex-col md:flex-row justify-center items-center">
                            {/* Mobile Layout */}
                            <div className="flex md:hidden flex-col justify-center items-center w-full h-full px-4 gap-6">
                                {/* Text Section - Mobile */}
                                <div className="w-full max-w-lg">
                                    {isLoaded && (
                                        <div className="space-y-1">
                                            {SEGMENTS_DATA.map((segment, index) => (
                                                <h2
                                                    key={`mobile-${index}`}
                                                    className={`text-md font-bold transition-colors duration-300 ${index === currentSegment
                                                        ? "text-white dark:text-white"
                                                        : "text-white dark:text-white"
                                                        }`}
                                                >
                                                    {segment.title}
                                                </h2>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                {/* Video Section - Mobile */}
                                <div className="w-full max-w-lg">
                                    <div className="relative w-full aspect-video rounded-xl bg-black overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.8)]">
                                        <canvas ref={canvasRefMobile} className="w-full h-full rounded-xl" />
                                    </div>
                                </div>
                            </div>
                            {/* Desktop Layout */}
                            <div className="hidden md:flex w-full h-full items-center">
                                {/* Center Video Area - Desktop */}
                                <div className="flex items-center justify-center h-full w-1/2 p-8">
                                    <div className="relative w-full aspect-video rounded-xl bg-black overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.8)]">
                                        <canvas ref={canvasRefDesktop} className="w-full h-full rounded-xl" />
                                    </div>
                                </div>
                                {/* Desktop Title List */}
                                <div className="flex flex-col justify-center items-start h-full p-8 w-1/2">
                                    <div className="w-full max-w-lg">
                                        {isLoaded && (
                                            <div className="space-y-1">
                                                {SEGMENTS_DATA.map((segment, index) => (
                                                    <h1
                                                        key={`desktop-${index}`}
                                                        className={`text-lg md:text-xl font-bold leading-tight transition-colors duration-300 ${index === currentSegment
                                                            ? "text-black dark:text-white"
                                                            : "text-white dark:text-black"
                                                            }`}
                                                    >
                                                        {segment.title}
                                                    </h1>
                                                ))}
                                            </div>
                                        )}
                                    </div>
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
        </div>
    );
};

export default Scrollsingle;