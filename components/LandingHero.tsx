"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { useSearchOverlay } from "./SearchOverlayContext";

export const LandingHero = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { open: openSearchOverlay } = useSearchOverlay();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const characters = "010101270849";
    const fontSize = 14;
    let columns = Math.floor(canvas.width / fontSize);
    const drops: number[] = Array(columns).fill(1);

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      columns = Math.floor(canvas.width / fontSize);
      drops.length = columns;
      drops.fill(1);
    };
    resize();

    const drawMatrix = () => {
      ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#00f2ff";
      ctx.font = `${fontSize}px Courier New`;

      for (let i = 0; i < drops.length; i++) {
        const text = characters.charAt(Math.floor(Math.random() * characters.length));
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);
        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) drops[i] = 0;
        drops[i]++;
      }
    };

    const interval = setInterval(drawMatrix, 50);
    window.addEventListener("resize", resize);
    return () => {
      clearInterval(interval);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050505] text-white">
      {/* Matrix Yağmur Arkaplan */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 z-[1] opacity-30"
        width={typeof window !== "undefined" ? window.innerWidth : 1920}
        height={typeof window !== "undefined" ? window.innerHeight : 1080}
      />

      {/* Navigasyon */}
      <header className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-6 py-8 sm:px-12 lg:px-16">
        <Link
          href="/"
          className="font-['Orbitron'] font-black text-2xl text-[#00f2ff]"
          style={{ textShadow: "0 0 10px #00f2ff" }}
        >
          NABZ-AI
        </Link>
        <nav className="flex items-center gap-6 sm:gap-8 text-sm tracking-wider">
          <Link href="/" className="text-[#ccc] hover:text-[#00f2ff] transition-colors">
            Ana Sayfa
          </Link>
          <Link href="/trending" className="text-[#ccc] hover:text-[#00f2ff] transition-colors">
            Keşfet
          </Link>
          <Link href="/mall" className="text-[#ccc] hover:text-[#00f2ff] transition-colors">
            AVM
          </Link>
          <Link href="/create" className="text-[#ccc] hover:text-[#00f2ff] transition-colors">
            Oluştur
          </Link>
          <button
            type="button"
            onClick={openSearchOverlay}
            className="text-[#ccc] hover:text-[#00f2ff] transition-colors p-1"
            aria-label="Ara"
          >
            <Search size={18} />
          </button>
        </nav>
      </header>

      {/* Hero İçerik */}
      <div className="relative z-[5] flex min-h-screen flex-col items-center justify-center px-4 text-center">
        {/* Parlayan Halka */}
        <div
          className="absolute w-[300px] h-[300px] sm:w-[400px] sm:h-[400px] lg:w-[500px] lg:h-[500px] rounded-full border-2 border-[#00f2ff]/20"
          style={{
            boxShadow:
              "0 0 50px rgba(0, 242, 255, 0.1), inset 0 0 30px rgba(0, 242, 255, 0.1)",
            animation: "landing-pulse 4s ease-in-out infinite",
          }}
        />

        {/* Ana Logo */}
        <div className="relative mb-5">
          <h1
            className="font-['Orbitron'] font-black text-5xl sm:text-6xl md:text-7xl lg:text-8xl tracking-tight"
            style={{
              background: "linear-gradient(90deg, #4ade80, #3b82f6, #a855f7)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              filter: "drop-shadow(0 0 15px rgba(59, 130, 246, 0.5))",
            }}
          >
            NABZ-AI
          </h1>
        </div>

        <p className="text-[#888] text-base sm:text-lg tracking-[0.2em] mb-1">Küresel İnovasyon</p>
        <p className="text-[#eee] text-sm sm:text-base max-w-md mx-auto mb-10 leading-relaxed">
          Yapay Zekanın Küresel İnovasyon Merkezi.
        </p>

        <Link
          href="/"
          className="inline-flex items-center justify-center px-12 py-4 rounded-full font-['Orbitron'] font-black text-lg bg-gradient-to-r from-[#00f2ff] to-[#6366f1] text-white transition-all duration-300 hover:scale-110 hover:shadow-[0_0_40px_rgba(0,242,255,0.6)]"
          style={{ boxShadow: "0 0 20px rgba(0, 242, 255, 0.4)" }}
        >
          KEŞFET
        </Link>
      </div>

    </div>
  );
};
