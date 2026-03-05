"use client";

import { useEffect, useState } from "react";
import { INTRO_AI_APPS } from "@/lib/introApps";

interface NabzIntroProps {
  onFinish: () => void;
}

export const NabzIntro = ({ onFinish }: NabzIntroProps) => {
  const [phase, setPhase] = useState<"draw" | "explode" | "logos" | "fade">("draw");
  const [mounted, setMounted] = useState(true);

  const LINE_DURATION = 3800; // çizgi süresi (ms)
  useEffect(() => {
    const t1 = setTimeout(() => setPhase("explode"), LINE_DURATION); // Çizgi bitiminde anında patlama
    const t2 = setTimeout(() => setPhase("logos"), LINE_DURATION + 600);
    const t3 = setTimeout(() => setPhase("fade"), LINE_DURATION + 3500);
    const t4 = setTimeout(() => {
      setMounted(false);
      onFinish();
    }, LINE_DURATION + 4500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [onFinish]);

  if (!mounted) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center transition-opacity duration-700 ${
        phase === "fade" ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
      style={{ backgroundColor: "#080808" }}
    >
      <button
        type="button"
        onClick={() => { setMounted(false); onFinish(); }}
        className="absolute top-4 right-4 px-4 py-2 text-sm text-white/60 hover:text-white border border-white/20 rounded-lg z-10"
      >
        Geç
      </button>

      <div className="relative w-full max-w-[1000px] min-h-[400px] h-[min(600px,75vh)] flex items-center justify-center mx-auto">
        {/* Final Evolution: 1000x600 scene */}
        <div className="relative w-full h-full flex items-center justify-center" style={{ fontFamily: "Orbitron, sans-serif" }}>
          <span
            className="block text-center font-black tracking-[0.3em] sm:tracking-[0.4em] text-6xl sm:text-7xl md:text-8xl"
            style={{
              background: "linear-gradient(90deg, #4ade80, #3b82f6, #a855f7)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              filter: "drop-shadow(0 0 15px rgba(59, 130, 246, 0.4))",
            }}
          >
            NABZ-AI
          </span>

          {/* Final Evolution: nabız + harf entegrasyonu, patlamada hattın kaybolması */}
          <svg
            className={`absolute left-0 top-0 w-full h-full transition-opacity duration-300 ${
              phase === "explode" || phase === "logos" || phase === "fade" ? "opacity-0" : "opacity-100"
            }`}
            viewBox="0 0 1000 600"
            fill="none"
            strokeWidth="4"
            strokeLinecap="round"
          >
            <path
              pathLength="1"
              className={phase === "draw" ? "intro-final-path" : "intro-final-done"}
              d="M 200,300 H 350 L 363,332 L 375,268 L 388,300 H 418 L 418,255 L 418,345 L 418,300 H 605"
              stroke="#00f2ff"
              strokeDasharray="1"
              strokeDashoffset={phase === "draw" ? 1 : 0}
              style={{ filter: "drop-shadow(0 0 12px #00f2ff)" }}
            />
          </svg>
        </div>

        {/* Patlama bölgesi - Final: left 73%, supernova + ai-particle */}
        <div
          className={`absolute left-[73%] top-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(90vw,32rem)] h-[min(90vw,32rem)] transition-opacity duration-300 ${
            phase === "explode" || phase === "logos" || phase === "fade" ? "opacity-100" : "opacity-0"
          }`}
          style={{ pointerEvents: "none" }}
        >
          {/* Supernova - Final: scale(30), 1s, 40% box-shadow */}
          <div
            className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-0.5 h-0.5 rounded-full bg-white ${
              phase === "explode" ? "intro-supernova" : ""
            }`}
            style={{
              boxShadow: "0 0 200px 100px white, 0 0 400px 200px #00f2ff",
            }}
          />
          {/* AI particle - Final: 250+random*150, 80ms delay, 3s, cubic-bezier(0.1, 0.8, 0.3, 1) */}
          {INTRO_AI_APPS.map((app, i) => {
            const angle = (i / INTRO_AI_APPS.length) * Math.PI * 2;
            const distance = 250 + (i % 10) * 12;
            const x = Math.cos(angle) * distance;
            const y = Math.sin(angle) * distance;
            return (
              <div
                key={app.name}
                className="absolute left-1/2 top-1/2 w-12 h-12 -translate-x-1/2 -translate-y-1/2 rounded-[30px] overflow-hidden flex items-center justify-center intro-ai-particle"
                style={{
                  ["--particle-x" as string]: `${x}px`,
                  ["--particle-y" as string]: `${y}px`,
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid #00f2ff",
                  boxShadow: "0 0 20px rgba(0,242,255,0.3)",
                  animation: phase === "explode" || phase === "logos" ? "intro-final-fly 3s cubic-bezier(0.1, 0.8, 0.3, 1) forwards" : "none",
                  animationDelay: `${i * 80}ms`,
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={app.logo}
                  alt={app.name}
                  className="w-6 h-6 object-contain"
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
