"use client";

import dynamic from "next/dynamic";
import FooterSection from "./components/Footer";
import Hero from "./components/Hero";
import Productsection from "./components/Productsection";
import Topnav from "./components/Topnav";
import ScrollVideo from "./components/Scrollimage";
const Scrollimage = dynamic(() => import("./components/Scrollimage"), { ssr: false });

const NAV_HEIGHT = 112;

// const videourl = "/0000-0400 3 (2).mkv"
const videourl = "/scrollanimation24mb.mp4";

export default function Home() {
  return (
    <div className="w-full">

      {/* ① Fixed topnav */}
      <Topnav />

      {/* ② Spacer so content starts below the fixed nav */}


      {/* ③ Hero — user scrolls past this normally */}
      <div style={{ position: "relative", backgroundColor: "#fff" }}>
        <Hero />
      </div>

      {/* ④ Product section */}
      <div style={{ position: "relative", backgroundColor: "#fff" }}>
        <Productsection />
      </div>

      {/* ⑤ 3D scroll zone — sticky wrapper + boundary gating is inside Scrollfinal */}
      {/* <Scrollfinal /> */}
      {/* <ScrollVersion/> */}
      {/* <Scrollfast/> */}
      {/* <Scroll3DCanvas/> */}
      <Scrollimage src="/frames/" />
      {/* <ScrollVideo src={videourl} /> */}
      {/* <ImageSection/> */}
      {/* <Scrollvideo src={videourl} /> */}

      {/* ⑥ Footer */}
      <div style={{ position: "relative", backgroundColor: "#fff" }}>
        <FooterSection />
      </div>

      {/* <Scroll3DCanvas/> */}

    </div>
  );
}