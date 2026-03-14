"use client";

import Link from "next/link";
import { Sidebar } from "@/components/Sidebar";
import { useLocale } from "@/components/LocaleProvider";
import { useAuth } from "@/components/AuthProvider";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { ExternalLink, Loader2 } from "lucide-react";

type NewsItem = { title: string; url: string; date: string };

export default function HaberlerPage() {
  const { t } = useLocale();
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, () => {});
    setMounted(true);
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const fetchNews = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/ai-news");
        if (!res.ok) return;
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const list = data.map((n: { title: string; url: string; date: string }) => ({
            title: n.title,
            url: n.url,
            date: (n.date || "").slice(0, 10),
          }));
          setNews(list);
        }
      } catch {
        setNews([]);
      } finally {
        setLoading(false);
      }
    };
    fetchNews();
  }, [mounted]);

  return (
    <div className="min-h-screen bg-[#0d0f12] text-white flex">
      <div className="hidden lg:block">
        <Sidebar user={user} />
      </div>
      <main className="flex-1 lg:ml-56 p-6 max-w-4xl">
        <Link href="/" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">
          ← {t("home.backToHome")}
        </Link>
        <h1 className="text-2xl font-bold mb-2">Güncel AI Haberleri</h1>
        <p className="text-white/60 text-sm mb-8">
          Son 1 haftanın en güncel yapay zeka gelişmeleri, startup yatırımları ve sektör haberleri
        </p>

        {loading ? (
          <div className="flex items-center justify-center py-16 gap-2 text-white/60">
            <Loader2 size={24} className="animate-spin" />
            <span>Haberler yükleniyor...</span>
          </div>
        ) : (
          <div className="space-y-3">
            {news.length === 0 ? (
              <p className="text-white/50 py-8">Şu an haber bulunamadı. Daha sonra tekrar deneyin.</p>
            ) : (
              news.map((haber, i) => (
                <a
                  key={`${haber.url}-${i}`}
                  href={haber.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:border-red-500/30 hover:bg-white/10 transition-all group"
                >
                  <span className="shrink-0 w-8 h-8 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center text-sm font-bold">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <h2 className="font-semibold text-white group-hover:text-red-400 transition-colors line-clamp-2">
                      {haber.title}
                    </h2>
                    <p className="text-xs text-white/50 mt-0.5">
                      {haber.date ? (
                        <>
                          {haber.date.split("-")[2]} {t(`home.month${parseInt(haber.date.split("-")[1], 10)}`)} {haber.date.split("-")[0]}
                        </>
                      ) : null}
                    </p>
                  </div>
                  <ExternalLink size={16} className="shrink-0 text-white/40 group-hover:text-red-400 transition-colors" />
                </a>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
}
