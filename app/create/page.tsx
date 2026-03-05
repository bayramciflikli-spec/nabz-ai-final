"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, type User } from "firebase/auth";
import { Sidebar } from "@/components/Sidebar";
import { SharePromptBanner } from "@/components/SharePromptBanner";
import { CreateMobileView } from "./mobile-view";
import Link from "next/link";

type AiModel = "ultra-real" | "anime-flow";

function CreateContent() {
  const searchParams = useSearchParams();
  const initialPrompt = searchParams.get("prompt") ?? "";
  const [user, setUser] = useState<User | null>(null);
  const [prompt, setPrompt] = useState(initialPrompt);
  const [selectedModel, setSelectedModel] = useState<AiModel>("ultra-real");
  const [motionPower, setMotionPower] = useState(50);
  const [detailLevel, setDetailLevel] = useState(50);
  const [lighting, setLighting] = useState("cinematic-night");
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, setUser);
    return () => unsub();
  }, []);

  const handleGenerate = () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setProgress(0);

    const duration = 5000;
    const interval = 50;
    let elapsed = 0;
    const timer = setInterval(() => {
      elapsed += interval;
      const p = Math.min(100, Math.round((elapsed / duration) * 100));
      setProgress(p);
      if (p >= 100) {
        clearInterval(timer);
        setTimeout(() => setIsGenerating(false), 300);
      }
    }, interval);
  };

  return (
    <>
      <SharePromptBanner />
      {/* MOBİL GÖRÜNÜM */}
      <CreateMobileView initialPrompt={initialPrompt} />

      {/* MASAÜSTÜ GÖRÜNÜM */}
      <div className="hidden lg:flex min-h-screen bg-black text-white">
        <div>
          <Sidebar user={user} />
        </div>

        <div className="flex-1 sm:ml-56 flex flex-col pt-20 pl-6 pr-6 pb-6 gap-6 overflow-auto">
        <div className="flex flex-col lg:flex-row h-full gap-6 flex-1 min-h-0">
          {/* SOL PANEL: PROMPT & AYARLAR */}
          <div className="w-full lg:w-1/3 flex flex-col gap-6 min-h-0">
            <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 flex flex-col h-full backdrop-blur-xl">
              <h2 className="text-2xl font-black mb-6 flex items-center gap-3">
                <span className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
                Yeni Üretim
              </h2>

              {/* PROMPT ALANI */}
              <div className="flex flex-col gap-2 mb-6">
                <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-gray-500 ml-2">
                  Hayalini Yaz
                </label>
                <textarea
                  placeholder="Siberpunk bir şehirde yağmurun altında koşan bir android..."
                  className="w-full h-40 bg-black/40 border border-white/5 rounded-3xl p-6 text-white placeholder:text-gray-600 focus:border-purple-500/50 outline-none transition-all resize-none"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                />
              </div>

              {/* AI MODEL SEÇİMİ */}
              <div className="grid grid-cols-2 gap-4 mb-8 text-center">
                <button
                  type="button"
                  onClick={() => setSelectedModel("ultra-real")}
                  className={`p-4 rounded-2xl cursor-pointer transition ${
                    selectedModel === "ultra-real"
                      ? "bg-white/5 border border-purple-500/30 hover:bg-purple-500/10"
                      : "bg-black/40 border border-white/5 hover:border-green-400/30"
                  }`}
                >
                  <p className="text-xs font-black">ULTRA-REAL</p>
                  <p className="text-[9px] text-gray-500">V.2.4 Engine</p>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedModel("anime-flow")}
                  className={`p-4 rounded-2xl cursor-pointer transition ${
                    selectedModel === "anime-flow"
                      ? "bg-white/5 border border-purple-500/30 hover:bg-purple-500/10"
                      : "bg-black/40 border border-white/5 hover:border-green-400/30"
                  }`}
                >
                  <p className="text-xs font-black">ANIME-FLOW</p>
                  <p className="text-[9px] text-gray-400">Stylized AI</p>
                </button>
              </div>

              {/* ÜRET BUTONU */}
              <button
                type="button"
                onClick={handleGenerate}
                disabled={!prompt.trim() || isGenerating}
                className="mt-auto w-full py-5 bg-gradient-to-r from-purple-600 to-green-500 rounded-full font-black text-lg shadow-[0_10px_40px_rgba(168,85,247,0.3)] hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {isGenerating ? "OLUŞTURULUYOR..." : "VİDEOYU OLUŞTUR"}
              </button>
            </div>
          </div>

          {/* SAĞ PANEL: ÖNİZLEME ALANI */}
          <div className="w-full lg:w-2/3 flex flex-col gap-6 min-h-[400px] lg:min-h-0">
            <div className="h-64 lg:h-3/4 bg-black rounded-[3rem] border border-white/5 overflow-hidden relative group flex-1 min-h-0">
              {/* RENDER BEKLEME EKRANI VEYA VİDEO */}
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-transparent to-purple-900/20">
                {!isGenerating && (
                  <p className="font-mono text-xs text-green-400 tracking-[0.3em]">
                    AWAITING PROMPT...
                  </p>
                )}
              </div>

              {/* RENDER OVERLAY - Sadece 'isGenerating' true olduğunda görünür. */}
              {isGenerating && (
                <div className="absolute inset-0 z-50 bg-cyber-black/90 backdrop-blur-xl rounded-[3rem] flex flex-col items-center justify-center overflow-hidden border border-purple-500/20">
                  {/* ARKA PLAN EFEKTİ: Kozmik Tozlar */}
                  <div
                    className="absolute inset-0 opacity-20 animate-pan-slow mix-blend-screen"
                    style={{
                      backgroundImage: "url('/subtle-space-dust.svg')",
                      backgroundRepeat: "repeat",
                    }}
                  />

                  {/* MERKEZİ NOVA ÇEKİRDEĞİ */}
                  <div className="relative w-64 h-64 flex items-center justify-center">
                    {/* 1. Dış Dönen Halka (İlerleme Göstergesi) */}
                    <svg
                      className="w-full h-full -rotate-90"
                      viewBox="0 0 100 100"
                    >
                      <circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke="#ffffff10"
                        strokeWidth="2"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke="url(#gradient)"
                        strokeWidth="4"
                        strokeDasharray={`${progress * 2.83} 283`}
                        strokeLinecap="round"
                        className="transition-all duration-300 ease-out shadow-[0_0_30px_#a855f7]"
                      />
                      <defs>
                        <linearGradient
                          id="gradient"
                          x1="0%"
                          y1="0%"
                          x2="100%"
                          y2="100%"
                        >
                          <stop offset="0%" stopColor="#a855f7" />
                          <stop offset="100%" stopColor="#4ade80" />
                        </linearGradient>
                      </defs>
                    </svg>

                    {/* 2. İçteki Parlayan Plazma Küresi */}
                    <div className="absolute inset-6 rounded-full bg-gradient-to-tr from-purple-900 via-fuchsia-600 to-cyber-cyan blur-md animate-pulse-fast flex items-center justify-center overflow-hidden shadow-[0_0_100px_rgba(168,85,247,0.6)]">
                      {/* İçerideki Enerji Akışı */}
                      <div
                        className="absolute inset-0 opacity-50 mix-blend-overlay animate-spin-slow"
                        style={{
                          backgroundImage: "url('/energy-flow.svg')",
                          backgroundSize: "cover",
                        }}
                      />
                      {/* Yüzde Sayacı */}
                      <span className="relative z-10 text-4xl font-black text-white tracking-tighter flex flex-col items-center leading-none">
                        {progress}
                        <span className="text-lg text-green-400">%</span>
                      </span>
                    </div>

                    {/* 3. Yörüngedeki Parçacıklar */}
                    <div className="absolute inset-[-10px] animate-spin-medium">
                      <div className="w-3 h-3 bg-green-400 rounded-full blur-[2px] absolute top-0 left-1/2 -translate-x-1/2 shadow-[0_0_25px_#4ade80]" />
                    </div>
                    <div className="absolute inset-[-30px] animate-spin-reverse-slow">
                      <div className="w-2 h-2 bg-purple-500 rounded-full blur-[2px] absolute bottom-0 left-1/2 -translate-x-1/2 shadow-[0_0_25px_#a855f7]" />
                    </div>
                  </div>

                  {/* DURUM METİNLERİ */}
                  <div className="mt-10 text-center relative z-10">
                    <h3 className="text-white font-bold text-2xl tracking-[0.1em] animate-pulse bg-clip-text text-transparent bg-gradient-to-r from-white via-purple-200 to-white">
                      NEURAL ENGINE ENGAGED
                    </h3>
                    <p className="text-green-400/80 font-mono text-xs mt-3 uppercase tracking-[0.3em] relative">
                      <span className="absolute -left-4 animate-ping">●</span>
                      {progress < 30
                        ? "Parsing Prompt Data..."
                        : progress < 70
                          ? "Synthesizing Latent Space..."
                          : "Rendering Final Pixels..."}
                    </p>
                  </div>
                </div>
              )}

              {/* VİDEO KONTROLLERİ (Overlay) */}
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-black/60 backdrop-blur-md px-6 py-3 rounded-full border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  Aspect: 16:9
                </span>
                <div className="w-px h-4 bg-white/10" />
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  FPS: 60
                </span>
              </div>
            </div>

            {/* ALT ŞERİT: PARAMETRELER */}
            <div className="h-auto lg:h-1/4 grid grid-cols-1 sm:grid-cols-3 gap-6 text-white">
              <div className="bg-white/5 rounded-[2rem] p-6 border border-white/5">
                <p className="text-[10px] text-gray-500 uppercase mb-2">Hareket Gücü</p>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={motionPower}
                  onChange={(e) => setMotionPower(Number(e.target.value))}
                  className="w-full accent-green-400"
                />
              </div>
              <div className="bg-white/5 rounded-[2rem] p-6 border border-white/5">
                <p className="text-[10px] text-gray-500 uppercase mb-2">Detay Seviyesi</p>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={detailLevel}
                  onChange={(e) => setDetailLevel(Number(e.target.value))}
                  className="w-full accent-purple-500"
                />
              </div>
              <div className="bg-white/5 rounded-[2rem] p-6 border border-white/5">
                <p className="text-[10px] text-gray-500 uppercase mb-2">Hava Durumu / Işık</p>
                <select
                  value={lighting}
                  onChange={(e) => setLighting(e.target.value)}
                  className="bg-transparent w-full text-xs font-bold outline-none cursor-pointer"
                >
                  <option value="cinematic-night">Sinematik Gece</option>
                  <option value="golden-hour">Altın Saat</option>
                  <option value="cyber-neon">Siber Neon</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <Link
          href="/upload"
          className="text-sm text-gray-400 hover:text-white transition-colors"
        >
          ← Proje olarak kaydetmek için Yükle sayfasına git
        </Link>
        </div>
      </div>
    </>
  );
}

export default function ProductionSuite() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center"><div className="w-10 h-10 border-2 border-green-500/50 border-t-green-500 rounded-full animate-spin" /></div>}>
      <CreateContent />
    </Suspense>
  );
}
