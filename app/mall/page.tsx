"use client";

import { useState } from "react";
import Link from "next/link";
import {
  MALL_STORES,
  getMarketLabel,
  type MallLocale,
} from "@/lib/mallStores";

export default function MallPage() {
  const [market, setMarket] = useState<MallLocale>("TR");

  return (
    <div className="min-h-screen bg-[#050505] text-white overflow-x-hidden">
      <header className="sticky top-0 z-[100] px-6 py-5 flex justify-between items-center border-b border-[#222] backdrop-blur-xl bg-[#050505]/90">
        <Link
          href="/"
          className="font-['Orbitron',sans-serif] font-black text-2xl bg-gradient-to-r from-emerald-400 via-blue-500 to-purple-500 bg-clip-text text-transparent"
        >
          NABZ-AI MALL
        </Link>
        <div className="text-xs text-cyan-400 uppercase tracking-[0.2em]">
          📍 MARKET: {getMarketLabel(market)}
        </div>
      </header>

      <main className="p-8 md:p-12 pb-24 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {MALL_STORES.map((store) => (
          <a
            key={store.id}
            href={store.href}
            target="_blank"
            rel="noopener noreferrer"
            className="group block bg-[#121212] rounded-2xl overflow-hidden border border-[#222] hover:-translate-y-2.5 hover:border-cyan-400 hover:shadow-[0_10px_30px_rgba(0,242,255,0.15)] transition-all duration-300"
          >
            <div className="relative h-44 bg-[#1a1a1a] flex items-center justify-center">
              {store.logo && (
                <img
                  src={store.logo}
                  alt=""
                  className="w-16 h-16 object-contain opacity-80 group-hover:scale-110 transition-transform"
                />
              )}
              <span className="absolute top-4 right-4 px-2.5 py-1 rounded text-[10px] font-bold bg-black/60 border border-[#444] text-white">
                {store.compliance}
              </span>
            </div>
            <div className="p-6">
              <div className="font-['Orbitron',sans-serif] text-lg font-bold mb-2.5">
                {store.name}
              </div>
              <p className="text-sm text-gray-400 leading-relaxed mb-5 min-h-[2.5rem]">
                {store.desc[market]}
              </p>
              <span className="inline-block px-4 py-2 rounded-lg bg-blue-500/10 text-blue-400 font-bold">
                {store.price[market]}
              </span>
            </div>
          </a>
        ))}
      </main>

      <div className="fixed bottom-8 right-8 z-50 bg-[#121212] border border-cyan-400 rounded-full px-4 py-3 flex gap-3">
        {(["TR", "US", "DE"] as MallLocale[]).map((loc) => (
          <button
            key={loc}
            onClick={() => setMarket(loc)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              market === loc
                ? "bg-cyan-400 text-black"
                : "text-white hover:text-cyan-400"
            }`}
          >
            {loc === "US" ? "EN" : loc}
          </button>
        ))}
      </div>
    </div>
  );
}
