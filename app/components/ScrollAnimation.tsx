"use client";
import React from "react";
import { useState,useEffect,useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Canvas} from '@react-three/fiber';


gsap.registerPlugin(ScrollTrigger);


export default function SportstechLanding() {
  


  return (
    <div className="relative bg-white" style={{ height: "1150vh" }}>
      {/* Fixed 3D Canvas - Right side on desktop */}
      <div className=" text-black">
        lorem
      </div>

      {/* ==================== COLOR SPECTRUM SECTION ==================== */}
      <section className="  w-full h-screen flex items-center px-8 md:px-16 lg:px-24 pointer-events-none z-10">
        <div className="max-w-xl">
          <div className="flex items-center gap-6 mb-8">
            <div className="w-40 h-40 rounded-full bg-[#e63946] flex items-center justify-center text-white text-center p-6 shadow-2xl">
              <div>
                <p className="font-bold text-lg">Farbspektrum</p>
                <p className="text-sm opacity-90">Rot, Grün oder Blau?</p>
                <p className="text-sm opacity-90">Wähle deine.</p>
              </div>
            </div>
            <div className="w-28 h-28 rounded-full border-2 border-gray-200 flex items-center justify-center bg-white shadow-lg">
              <svg viewBox="0 0 80 60" className="w-16 h-12">
                <rect x="10" y="20" width="60" height="8" rx="2" fill="#333" />
                <ellipse cx="40" cy="45" rx="25" ry="8" fill="#444" />
              </svg>
            </div>
          </div>

          <p className="text-gray-400 text-sm uppercase tracking-widest">
            Farbspektrum
          </p>
        </div>
      </section>

      {/* ==================== HEALTH FIRST SECTION ==================== */}
      <section className=" w-full h-screen flex items-center px-8 md:px-16 lg:px-24 pointer-events-none z-10">
        <div className="max-w-xl">
          <p className="text-gray-400 text-sm uppercase tracking-widest mb-6">
            Farbspektrum
          </p>

          <div className="space-y-6">
            {[1, 2, 3].map((_, i) => (
              <div
                key={i}
                className="flex items-start gap-4 py-6 border-t border-gray-200 bg-white/80 backdrop-blur-sm rounded-lg px-4"
              >
                <div>
                  <h3 className="font-bold text-gray-900 mb-2">Health first</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Als Runner weißt du genau: Laufen fördert deine Gesundheit!
                    Dabei unterstützt dich das sWalk individuell in deinem
                    Alltag.
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== SPECS SECTION ==================== */}
      <section className="w-full h-screen flex items-center px-8 md:px-16 lg:px-24 pointer-events-none z-10">
        <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-12 items-center">
          <div className="space-y-6">
            <h2
              className="text-3xl md:text-4xl font-bold leading-tight text-gray-900"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Die neueste Speedbike Generation ist da! Mit dem leistungsstarken
              sBike und der interaktiven Fitness
            </h2>

            {/* Trainers */}
            <div className="flex items-center gap-4 mt-8">
              <div className="flex -space-x-3">
                {[
                  "bg-gradient-to-br from-orange-300 to-pink-400",
                  "bg-gradient-to-br from-blue-300 to-purple-400",
                ].map((bg, i) => (
                  <div
                    key={i}
                    className={`w-12 h-12 rounded-full ${bg} border-4 border-white shadow-lg`}
                  />
                ))}
                <div className="w-12 h-12 rounded-full bg-[#e63946] border-4 border-white shadow-lg flex items-center justify-center"></div>
              </div>
              <p className="text-gray-900 font-medium">Speedbike Generation</p>
            </div>
          </div>
          <div className="hidden lg:block" /> {/* Spacer for 3D model */}
          <div className="space-y-10">
            {[
              { value: "70 m", label: "In 7 unterschiedlichen Farben." },
              { value: "12 kg", label: "In 7 unterschiedlichen Farben." },
              { value: "12 kg", label: "In 7 unterschiedlichen Farben." },
            ].map((spec, i) => (
              <div
                key={i}
                className="space-y-2 bg-white/80 backdrop-blur-sm rounded-lg p-4"
              >
                <p
                  className="text-5xl md:text-6xl font-bold text-[#e63946]"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  {spec.value}
                </p>
                <p className="text-gray-600">{spec.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== COMPETITION SECTION ==================== */}
      <section className="w-full h-screen flex items-center px-8 md:px-16 lg:px-24 pointer-events-none z-10">
        <div className="w-full max-w-7xl mx-auto">
          <div className="max-w-xl">
            <h2
              className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight text-gray-900 mb-8"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Motivation durch Wettkampf
            </h2>

            <p className="text-gray-600 leading-relaxed mb-8">
              Die neueste Speedbike Generation ist da! Mit dem leistungsstarken
              sBike und der interaktiven Fitness App von Sportstech Live pushst
              du deine Fitness aufs nächste Level.
            </p>

            {/* Leaderboard Card */}
            <div className="bg-white rounded-2xl shadow-xl p-6 max-w-xs">
              <p className="text-xs text-gray-500 mb-4 text-center font-medium">
                Leaderboard
              </p>
              <div className="space-y-3">
                {["James", "Henry", "Webb", "Alex"].map((name, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between text-sm py-2 border-b border-gray-100 last:border-0"
                  >
                    <span className="text-gray-600 font-medium">{name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-900 font-bold">1011</span>
                      <span className="text-[#e63946]">🔥</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== FOOTER SECTION ==================== */}
      <section className=" w-full h-screen flex items-center justify-center px-8 md:px-16 lg:px-24 pointer-events-none">
        <div className="max-w-4xl text-center text-white space-y-8">
          <h2
            className="text-4xl md:text-5xl lg:text-6xl font-bold"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Bereit für dein nächstes Level?
          </h2>
          <p className="text-xl opacity-90">
            Entdecke die neue Speedbike Generation und transformiere dein
            Training.
          </p>
          <button className="px-10 py-4 bg-white text-[#e63946] rounded-full font-bold text-lg hover:bg-gray-100 transition-colors shadow-xl pointer-events-auto">
            Jetzt entdecken
          </button>
        </div>
      </section>
    </div>
  );
}
