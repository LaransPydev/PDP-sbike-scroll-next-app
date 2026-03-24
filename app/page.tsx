"use client";

import Scroll3DCanvas from "./components/3dcanvasss";
import FooterSection from "./components/Footer";
import Hero from "./components/Hero";
import ImageSection from "./components/Imagesection";
import Productsection from "./components/Productsection";
import Scrollfast from "./components/Scrollfast";
import Scrollfinal from "./components/Scrollfinal";
import Topnav from "./components/Topnav";
import ScrollVersion from "./components/scrollversion";

const NAV_HEIGHT = 112;

export default function Home() {
  return (
    <div className="w-full">

      {/* ① Fixed topnav */}
      <Topnav />

      {/* ② Spacer so content starts below the fixed nav */}
      <div style={{ height: NAV_HEIGHT }} />

      {/* ③ Hero — user scrolls past this normally */}
      <div style={{ position: "relative",  backgroundColor: "#fff" }}>
        <Hero />
      </div>

      {/* ④ Product section */}
      <div style={{ position: "relative", backgroundColor: "#fff" }}>
        <Productsection />
      </div>

      {/* ⑤ 3D scroll zone — sticky wrapper + boundary gating is inside Scrollfinal */}
      {/* <Scrollfinal /> */}
      {/* <ScrollVersion/> */}
      <Scrollfast/>
      {/* <Scroll3DCanvas/> */}

      {/* <ImageSection/> */}

      {/* ⑥ Footer */}
      <div style={{ position: "relative", backgroundColor: "#fff" }}>
        <FooterSection />
      </div>

      {/* <Scroll3DCanvas/> */}

    </div>
  );
}