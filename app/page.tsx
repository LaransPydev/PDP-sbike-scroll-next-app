// app/page.tsx
"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import FooterSection from "./components/Footer";
import Hero from "./components/Hero";
import Productsection from "./components/Productsection";
import Topnav from "./components/Topnav";
import SitePreloader from "./components/SitePreloader";

const Scrollimage = dynamic(() => import("./components/Scrollimage"), { ssr: false });

export default function Home() {
  const [siteReady, setSiteReady] = useState(false);

  return (
    <>
      {/* Site-wide preloader — covers everything until critical assets are ready */}
      <SitePreloader onComplete={() => setSiteReady(true)} />

      {/* Main site — hidden via pointer-events and opacity until preloader completes */}
      <div
        style={{
          opacity: siteReady ? 1 : 0,
          transition: "opacity 0.5s ease",
          pointerEvents: siteReady ? "auto" : "none",
        }}
      >
        <div className="w-full">

          {/* ① Fixed topnav */}
          <Topnav />

          {/* ② Hero */}
          <div style={{ position: "relative", backgroundColor: "#fff" }}>
            <Hero />
          </div>

          {/* ③ Product section */}
          <div style={{ position: "relative", backgroundColor: "#fff" }}>
            <Productsection />
          </div>

          {/* ④ Scroll frames animation */}
          <Scrollimage src="/frames/" />

          {/* ⑤ Footer */}
          <div style={{ position: "relative", backgroundColor: "#fff" }}>
            <FooterSection />
          </div>

        </div>
      </div>
    </>
  );
}