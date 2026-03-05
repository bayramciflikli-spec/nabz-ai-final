"use client";

import Link from "next/link";
import { Sidebar } from "@/components/Sidebar";
import { getSortedAiNews } from "@/lib/aiNews";
import { useLocale } from "@/components/LocaleProvider";
import { useAuth } from "@/components/AuthProvider";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { ExternalLink } from "lucide-react";

export default function HaberlerPage() {
  const { t } = useLocale();
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const news = getSortedAiNews();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, () => {});
    setMounted(true);
    return () => unsub();
  }, []);

  return (
    <div className="min-h-screen bg-[#0d0f12] text-white flex">
      <div className="hidden sm:block">
        <Sidebar user={user} />
      </div>
      <main className="flex-1 sm:ml-56 p-6 max-w-4xl">
        <Link href="/" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">
          ← {t("home.backToHome")}
        </Link>
        <h1 className="text-2xl font-bold mb-2">Güncel AI Haberleri</h1>
        <p className="text-white/60 text-sm mb-8">
          Yapay zeka gelişmeleri, startup yatırımları ve sektör haberleri
        </p>

        <div className="space-y-3">
          {mounted &&
            news.map((haber, i) => (
              <a
                key={haber.titleKey}
                href={haber.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:border-red-500/30 hover:bg-white/10 transition-all group"
              >
                <span className="shrink-0 w-8 h-8 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center text-sm font-bold">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <h2 className="font-semibold text-white group-hover:text-red-400 transition-colors">
                    {t(haber.titleKey)}
                  </h2>
                  <p className="text-xs text-white/50 mt-0.5">
                    {haber.date.split("-")[2]} {t(`home.month${parseInt(haber.date.split("-")[1], 10)}`)} {haber.date.split("-")[0]}
                  </p>
                </div>
                <ExternalLink size={16} className="shrink-0 text-white/40 group-hover:text-red-400 transition-colors" />
              </a>
            ))}
        </div>
      </main>
    </div>
  );
}
