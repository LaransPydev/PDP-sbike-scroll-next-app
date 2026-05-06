// app/components/SitePreloader.tsx
"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";

const CDN_BASE_URL = "https://do55ukdqgl59f.cloudfront.net";

// Critical images to preload before showing the site
const CRITICAL_IMAGES = [
  // First 8 scroll frames (visible immediately)
  ...Array.from({ length: 8 }, (_, i) => `${CDN_BASE_URL}/frames/${i + 1}.webp`),
  // Hero section gallery images
  "/sBike_Gallery_01 (1).webp",
  "/sBike_Gallery_02_(1).webp",
  "/sBike_Gallery_03_(1).webp",
  "/sBike_Gallery_04_(1).webp",
  // Hotspot SVG icons
  `${CDN_BASE_URL}/incandescent-light-bulb-svgrepo-com%201.svg`,
];

// Non-critical — load after reveal but track for progress
const SECONDARY_IMAGES = [
  "/sBike_Gallery_05_(1).webp",
  "/sBike_Gallery_06_(1).webp",
  "/sBike_Gallery_07_(1).webp",
];

const HERO_VIDEO = "https://www.sportstech.de/media/36/57/da/1750176850/28_08_2024_sbike_short_desktop.mp4";

interface SitePreloaderProps {
  onComplete: () => void;
}

const SitePreloader: React.FC<SitePreloaderProps> = ({ onComplete }) => {
  const [progress, setProgress]   = useState(0);
  const [phase, setPhase]         = useState<"loading" | "ready" | "hidden">("loading");
  const [label, setLabel]         = useState("Initializing…");
  const completedRef              = useRef(false);
  const loadedCountRef            = useRef(0);
  const totalRef                  = useRef(CRITICAL_IMAGES.length + 1); // +1 for video

  const tick = useCallback(() => {
    loadedCountRef.current++;
    const pct = Math.round((loadedCountRef.current / totalRef.current) * 100);
    setProgress(Math.min(pct, 99)); // hold at 99 until fully done

    const labels: Record<number, string> = {
      10: "Loading assets…",
      30: "Preparing experience…",
      60: "Almost there…",
      85: "Finishing up…",
    };
    const key = Object.keys(labels).map(Number).reverse().find(k => pct >= k);
    if (key) setLabel(labels[key]);

    if (loadedCountRef.current >= totalRef.current && !completedRef.current) {
      completedRef.current = true;
      setProgress(100);
      setLabel("Ready!");
      setTimeout(() => {
        setPhase("ready");
        setTimeout(() => {
          setPhase("hidden");
          onComplete();
        }, 600);
      }, 300);
    }
  }, [onComplete]);

  useEffect(() => {
    // Load critical images
    CRITICAL_IMAGES.forEach(src => {
      const img = new Image();
      img.onload = img.onerror = tick;
      img.src = src;
    });

    // Probe video — just wait for metadata (don't download whole video)
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = tick;
    video.onerror = tick;
    video.src = HERO_VIDEO;

    // Load secondary images quietly after reveal
    setTimeout(() => {
      SECONDARY_IMAGES.forEach(src => {
        const img = new Image();
        img.src = src;
      });
    }, 2000);
  }, [tick]);

  const c = 2 * Math.PI * 54;
  const p = Math.min(100, Math.max(0, progress));

  if (phase === "hidden") return null;

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      zIndex: 99999,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      background: "#000",
      opacity: phase === "ready" ? 0 : 1,
      pointerEvents: phase === "ready" ? "none" : "all",
      transition: "opacity 0.6s cubic-bezier(0.4,0,0.2,1)",
    }}>

      {/* Radial progress ring */}
      <div style={{ position: "relative", width: 140, height: 140 }}>
        <svg
          width="140"
          height="140"
          style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }}
        >
          <circle cx="70" cy="70" r="54" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="5" />
          <circle
            cx="70" cy="70" r="54"
            fill="none"
            stroke="#dc2626"
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={c - (p / 100) * c}
            style={{ transition: "stroke-dashoffset 0.4s ease-out" }}
          />
        </svg>

        {/* Counter */}
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column",
        }}>
          <span style={{
            fontFamily: "'DM Mono','Courier New',monospace",
            fontSize: 32, fontWeight: 700, color: "#fff",
            letterSpacing: "-2px", lineHeight: 1,
          }}>
            {Math.round(p)}
          </span>
          <span style={{
            fontFamily: "'DM Mono','Courier New',monospace",
            fontSize: 11, color: "#555", letterSpacing: "0.1em", marginTop: 2,
          }}>
            %
          </span>
        </div>
      </div>

      {/* Brand + status */}
      <div style={{ marginTop: 32, textAlign: "center" }}>
        <p style={{
          fontFamily: "'DM Mono','Courier New',monospace",
          fontSize: 13, letterSpacing: "0.3em",
          color: "#dc2626", textTransform: "uppercase", marginBottom: 8,
        }}>
          sBike
        </p>
        <p style={{
          fontFamily: "'DM Mono','Courier New',monospace",
          fontSize: 11, letterSpacing: "0.15em",
          color: "#444", textTransform: "uppercase",
          transition: "opacity 0.3s ease",
        }}>
          {label}
        </p>
      </div>

      {/* Bottom progress bar */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        height: 3, background: "rgba(255,255,255,0.04)",
      }}>
        <div style={{
          height: "100%",
          width: `${p}%`,
          background: "linear-gradient(90deg,#dc2626,#ef4444)",
          transition: "width 0.4s ease-out",
          borderRadius: "0 2px 2px 0",
        }} />
      </div>

    </div>
  );
};

export default SitePreloader;