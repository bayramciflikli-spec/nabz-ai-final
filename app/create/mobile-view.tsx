"use client";

import { useState, useEffect } from "react";
import { NovaRenderCircle } from "@/components/NovaRenderCircle";

interface CreateMobileViewProps {
  initialPrompt?: string;
}

export function CreateMobileView({ initialPrompt = "" }: CreateMobileViewProps) {
  const [prompt, setPrompt] = useState(initialPrompt);

  useEffect(() => {
    if (initialPrompt) setPrompt(initialPrompt);
  }, [initialPrompt]);
  const [motionPower, setMotionPower] = useState(50);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);

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
        setTimeout(() => {
          setIsGenerating(false);
        }, 300);
      }
    }, interval);
  };

  return (
    <div className="flex flex-col min-h-screen bg-cyber-black text-white pb-24 lg:hidden">
      {/* 1. ÖNİZLEME (Üstte Sabit) */}
      <div className="aspect-square w-full bg-black relative border-b border-white/5 overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-transparent to-purple-900/20">
          {isGenerating ? (
            <NovaRenderCircle
              size="small"
              progress={progress}
              showProgress={true}
            />
          ) : (
            <p className="font-mono text-xs text-green-400 tracking-[0.3em]">
              AWAITING PROMPT...
            </p>
          )}
        </div>
      </div>

      {/* 2. PROMPT ALANI */}
      <div className="p-6 space-y-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
            Prompt
          </label>
          <textarea
            className="w-full bg-white/5 rounded-3xl p-5 text-sm border border-white/10 outline-none focus:border-green-400/50 text-white placeholder:text-gray-500 resize-none"
            placeholder="Hayalini buraya fısılda..."
            rows={3}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={isGenerating}
          />
        </div>

        {/* 3. HIZLI AYAR SLIDERLARI */}
        <div className="grid grid-cols-1 gap-6">
          <div className="bg-white/5 p-5 rounded-[2rem] border border-white/5">
            <div className="flex justify-between mb-3 text-[10px] font-bold">
              <span className="text-gray-400 uppercase">Hareket</span>
              <span className="text-green-400">
                {motionPower < 33 ? "Yumuşak" : motionPower < 66 ? "Dinamik" : "Yoğun"}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={motionPower}
              onChange={(e) => setMotionPower(Number(e.target.value))}
              className="w-full accent-green-400"
              disabled={isGenerating}
            />
          </div>
        </div>

        {/* 4. ANA BUTON */}
        <button
          type="button"
          onClick={handleGenerate}
          disabled={!prompt.trim() || isGenerating}
          className="w-full py-5 bg-gradient-to-r from-purple-600 to-green-500 rounded-full font-black text-lg shadow-xl shadow-purple-500/20 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGenerating ? "OLUŞTURULUYOR..." : "ŞİMDİ OLUŞTUR"}
        </button>
      </div>
    </div>
  );
}
