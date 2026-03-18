"use client";

import { useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface FeatureCard {
  id: number;
  videoSrc: string;
  title: string;
  description: string;
  badge?: {
    icon: string;
    label: string;
  };
  overlay?: {
    primary: string;
    secondary?: string;
    icon?: string;
  };
}

const featureCards: FeatureCard[] = [
  {
    id: 1,
    videoSrc: "/sbike3d1-v2.mp4",
    title: '21,5" Display',
    description:
      "Mit dem 360 Grad schwenkbaren Touch-Display sind deine Workouts so flexibel wie nie!",
    badge: { icon: "monitor", label: "Vertical Tilt" },
  },
  {
    id: 2,
    videoSrc: "/sbike3d2-v2.mp4",
    title: "LED Lichter",
    description:
      "Die LED-Lichter passen sich deiner Leistung an und geben dir motivierendes Feedback.",
    overlay: { primary: "BPM", secondary: "100", icon: "heart" },
  },
  {
    id: 3,
    videoSrc: "/sbike3d3-v2.mp4",
    title: "Auto-Widerstand: Dein Coach steuert mit",
    description:
      "Der Widerstand passt sich automatisch an oder du steuerst ihn selbst.",
  },
  {
    id: 4,
    videoSrc: "/sbike3d4-v2.mp4",
    title: "Immersiver Sound",
    description:
      "Zwei integrierte Lautsprecher liefern kraftvollen Klang für jedes Workout.",
  },
  {
    id: 5,
    videoSrc: "/sbike3d1-v2.mp4",
    title: "Nahtlose Konnektivität",
    description:
      "Verbinde dich mit Bluetooth-Geräten und tracke deine Fortschritte in Echtzeit.",
  },
];

const ImageSection = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);

  // Scroll handler for the Next/Prev buttons
  const scrollTrack = (direction: "left" | "right") => {
    if (trackRef.current) {
      // Get the width of one card + gap to scroll exactly one item
      const scrollAmount = window.innerWidth > 768 ? 400 : window.innerWidth * 0.8;
      trackRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <section
      ref={sectionRef}
      className="relative w-full h-auto bg-[#0a0a0f] text-white overflow-hidden py-10 md:py-16"
    >
      {/* Header */}
      <div
        ref={headingRef}
        className="flex justify-between items-start px-6 pt-6 pb-4 md:px-12 md:pt-8 md:pb-5"
      >
        <div className="pr-4">
          <h2 className="text-2xl md:text-4xl lg:text-[42px] font-bold tracking-tight leading-tight mb-2">
            Detaillierte Ansicht
          </h2>
          <p className="text-xs md:text-base text-white/50 font-normal">
            Ein Bike. Unendliche Möglichkeiten. Erlebe Funktionen, die
            begeistern.
          </p>
        </div>

        {/* Desktop Buttons (Hidden on very small screens if needed, but left here for iPad/Mobile landscape) */}
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => scrollTrack("left")}
            className="w-9 h-9 md:w-11 md:h-11 rounded-full border border-white/20 bg-transparent text-white/70 flex items-center justify-center cursor-pointer transition-all duration-200 hover:border-white/50 hover:text-white hover:bg-white/5"
            aria-label="Previous"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <button
            onClick={() => scrollTrack("right")}
            className="w-9 h-9 md:w-11 md:h-11 rounded-full border border-white/20 bg-transparent text-white/70 flex items-center justify-center cursor-pointer transition-all duration-200 hover:border-white/50 hover:text-white hover:bg-white/5"
            aria-label="Next"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      </div>

      {/* Horizontal Track with Mobile Scrolling */}
      <div
        ref={trackRef}
        className="flex gap-4 md:gap-6 px-6 md:px-12 pb-4 overflow-x-auto snap-x snap-mandatory scroll-smooth"
        style={{
          scrollbarWidth: "none", /* Firefox */
          msOverflowStyle: "none", /* IE/Edge */
        }}
      >
        {/* Hide Scrollbar for Webkit (Chrome, Safari) */}
        <style>{`
          div::-webkit-scrollbar {
            display: none;
          }
        `}</style>

        {featureCards.map((card) => (
          <div
            key={card.id}
            // Added snap-start for smooth mobile alignment
            className="flex-none snap-start w-[85vw] min-w-[280px] md:w-[calc(33.333vw-48px)] md:min-w-[360px] md:max-w-[520px] rounded-2xl overflow-hidden bg-gradient-to-b from-[#141923e6] to-[#0a0c12] border border-white/[0.06] flex flex-col"
          >
            {/* Video Area */}
            <div className="relative w-full aspect-video overflow-hidden bg-[#0d1117]">
              <video
                src={card.videoSrc}
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover block"
              />

              {/* Pause button — card 1 */}
              {card.id === 1 && (
                <button
                  className="absolute top-4 right-4 w-8 h-8 md:w-10 md:h-10 rounded-full border border-white/35 bg-black/30 backdrop-blur-md text-white flex items-center justify-center cursor-pointer transition-all duration-200 hover:bg-white/10"
                  aria-label="Pause"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <rect x="6" y="4" width="4" height="16" rx="1" />
                    <rect x="14" y="4" width="4" height="16" rx="1" />
                  </svg>
                </button>
              )}

              {/* Badge overlay — card 1 */}
              {card.badge && (
                <div className="absolute bottom-3 left-3 md:bottom-4 md:left-4 flex items-center gap-2 px-2.5 py-1.5 md:px-3.5 md:py-2.5 rounded-xl bg-[#0f141ee0] backdrop-blur-xl border border-white/[0.08] text-white/80 text-[10px] md:text-xs font-medium">
                  {/* ... (SVG kept same) ... */}
                  <span className="tracking-wide">{card.badge.label}</span>
                </div>
              )}

              {/* BPM overlay — card 2 */}
              {card.overlay && (
                <div className="absolute bottom-3 left-3 md:bottom-4 md:left-4 flex items-center gap-1.5">
                  <span className="text-lg md:text-[22px] font-bold tracking-wider text-white/85">
                    {card.overlay.primary}
                  </span>
                  {card.overlay.secondary && (
                    <span className="text-2xl md:text-4xl font-bold text-white leading-none">
                      {card.overlay.secondary}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Text Area */}
            <div className="px-4 pt-3 pb-4 md:px-6 md:pt-4 md:pb-5">
              <h3 className="text-sm md:text-lg lg:text-xl font-bold tracking-tight leading-snug mb-1 md:mb-2">
                {card.title}
              </h3>
              <p className="text-[12px] md:text-sm lg:text-[15px] text-white/45 font-normal leading-relaxed m-0 line-clamp-2 md:line-clamp-none">
                {card.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default ImageSection;