"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

const DREAM_SUGGESTIONS = [
  "Siberpunk bir şehirde yağmurun altında koşan bir android",
  "Uzayda yalnız bir astronot, Dünya'ya bakıyor",
  "Ormanın derinliklerinde sihirli bir göl",
  "Retro gelecekte uçan arabalar ve neon ışıklar",
  "Bir kafenin camında yağmur, sıcak kahve",
  "Dağ zirvesinde gün doğumu",
  "Sahilde atlı bir kahraman, gün batımı",
  "Eski bir kütüphanede tozlu kitaplar arasında ışık",
  "Buzul çağında mamutlar ve avcılar",
  "Su altı şehri, balıklar ve mercanlar",
];

export default function DreamPage() {
  const router = useRouter();
  const [dream, setDream] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = dream.trim();
    if (text) {
      router.push(`/create?prompt=${encodeURIComponent(text)}`);
    }
  };

  const pickSuggestion = (s: string) => {
    setDream(s);
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col pb-24 lg:pb-8">
      <header className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3 border-b border-white/10 bg-black/80 backdrop-blur-xl">
        <Link
          href="/"
          className="p-2 rounded-full hover:bg-white/10 transition-colors"
          aria-label="Geri"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-lg font-semibold">Hayal et, paylaş</h1>
      </header>

      <main className="flex-1 px-4 py-6 max-w-xl mx-auto w-full">
        <p className="text-xl sm:text-2xl font-bold text-white/95 mb-2">
          Ne hayal ettin?
        </p>
        <p className="text-sm text-white/60 mb-6">
          Hayalini kısaca yaz, videoya dönüştürelim.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <textarea
            value={dream}
            onChange={(e) => setDream(e.target.value)}
            placeholder="Örn: Bir kedi uzay gemisinde pilotluk yapıyor..."
            className="w-full min-h-[140px] px-4 py-4 rounded-2xl bg-white/5 border border-white/15 text-white placeholder:text-white/40 focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20 outline-none transition-all resize-none"
            maxLength={500}
            aria-label="Hayalin"
          />
          <div className="flex justify-between text-xs text-white/45">
            <span>{dream.length} / 500</span>
          </div>
          <button
            type="submit"
            disabled={!dream.trim()}
            className="w-full py-4 rounded-2xl font-semibold bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:pointer-events-none transition-colors"
          >
            Videoya dönüştür
          </button>
        </form>

        <div className="mt-8">
          <p className="text-sm font-medium text-white/70 mb-3">Öneriler</p>
          <div className="flex flex-wrap gap-2">
            {DREAM_SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => pickSuggestion(s)}
                className="px-4 py-2 rounded-full text-sm bg-white/10 hover:bg-white/20 border border-white/10 text-white/90 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
