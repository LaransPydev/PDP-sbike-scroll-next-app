"use client";
import { Canvas } from "@react-three/fiber";
import gsap from "gsap";
import React, { useEffect, useRef, useState } from "react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Scene from "./Scene";

gsap.registerPlugin(ScrollTrigger);

export default function Scroll3DCanvas() {
  const mainRef = useRef(null);
  const sectionsRef = useRef(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: mainRef.current,
          start: "top top",
          end: "bottom bottom",
          scrub: 1,
          onUpdate: (self) => {
            setProgress(self.progress);
          },
        },
      });

      // Add the 5 section transitions
      tl.to(sectionsRef.current, {
        ease: "none",
        x: "0vw",
        y: "0vh",
      })
        .to(sectionsRef.current, {
          ease: "none",
          x: "0vw",
          y: "210vh",
        })
        .to(sectionsRef.current, {
          ease: "none",
          x: "25vw",
          y: "300vh",
        })
        .to(sectionsRef.current, {
          ease: "none",
          x: "0vw",
          y: "410vh",
        })
        .to(sectionsRef.current, {
          ease: "none",
          x: "-25vw",
          y: "500vh",
        });
    });

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={mainRef}
      className="relative h-[600vh] bg-white overflow-x-hidden"
    >
      {/* Fixed 3D Canvas */}
      <div className="w-full h-screen">
        <Canvas>
          <Scene progress={progress} />
        </Canvas>
      </div>

      {/* Scrollable content overlay */}
      <div ref={sectionsRef} className=" z-10 pointer-events-none">
        {/* Section 1 - Initial view */}
        <section className="w-full h-[100vh] flex items-center justify-center">
          <div className="w-60 bg-white/80 backdrop-blur-sm p-4 rounded-lg pointer-events-auto">
            <h1 className="text-3xl font-bold">Section 1</h1>
            <p className="mt-2 text-gray-700">
              Welcome to the experience.
            </p>
          </div>
        </section>

        {/* Section 2 - LED lights */}
        <section className="w-full h-[100vh] flex items-center justify-end px-8 md:px-16 lg:px-24">
          <div className="w-60 bg-white/80 backdrop-blur-sm p-4 rounded-lg pointer-events-auto">
            <h1 className="text-3xl font-bold">LED lights</h1>
            <p className="mt-2 text-gray-700">
              The LED lights adapt to your performance and give you motivating
              feedback.
            </p>
          </div>
        </section>

        {/* Section 3 */}
        <section className="w-full h-[100vh] flex items-center justify-start px-8 md:px-16 lg:px-24">
          <div className="w-60 bg-white/80 backdrop-blur-sm p-4 rounded-lg pointer-events-auto">
            <h1 className="text-3xl font-bold">Section 3</h1>
            <p className="mt-2 text-gray-700">
              Discover more features as you scroll.
            </p>
          </div>
        </section>

        {/* Section 4 */}
        <section className="w-full h-[100vh] flex items-center justify-end px-8 md:px-16 lg:px-24">
          <div className="w-60 bg-white/80 backdrop-blur-sm p-4 rounded-lg pointer-events-auto">
            <h1 className="text-3xl font-bold">Section 4</h1>
            <p className="mt-2 text-gray-700">
              Advanced capabilities at your fingertips.
            </p>
          </div>
        </section>

        {/* Section 5 */}
        <section className="w-full h-[100vh] flex items-center justify-center">
          <div className="w-60 bg-white/80 backdrop-blur-sm p-4 rounded-lg pointer-events-auto">
            <h1 className="text-3xl font-bold">Section 5</h1>
            <p className="mt-2 text-gray-700">
              The complete experience awaits.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}