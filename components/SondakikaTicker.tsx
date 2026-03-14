"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useLocale } from "@/components/LocaleProvider";

const REFRESH_MS = 60 * 1000; // 1 dakikada bir güncel haberleri çek
const SCROLL_PX_PER_FRAME = 0.8;

export type SondakikaItem = { title?: string; url: string; date: string };

export function SondakikaTicker() {
  const { t } = useLocale();
  const [items, setItems] = useState<SondakikaItem[]>([]);
  const [paused, setPaused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const scrollRef = useRef(0);

  useEffect(() => {
    const fetchNews = async () => {
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
          setItems(list);
        }
      } catch {
        // fallback
      }
    };
    fetchNews();
    const id = setInterval(fetchNews, REFRESH_MS);
    return () => clearInterval(id);
  }, []);

  const tick = useCallback(() => {
    const el = containerRef.current;
    const content = contentRef.current;
    if (!el || !content || paused) return;
    const half = content.scrollWidth / 2;
    if (half <= 0) {
      rafRef.current = requestAnimationFrame(tick);
      return;
    }
    scrollRef.current += SCROLL_PX_PER_FRAME;
    if (scrollRef.current >= half) scrollRef.current -= half;
    el.scrollLeft = scrollRef.current;
    rafRef.current = requestAnimationFrame(tick);
  }, [paused]);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [tick]);

  const handlePointerDown = useCallback(() => {
    setPaused(true);
    const el = containerRef.current;
    if (el) scrollRef.current = el.scrollLeft;
  }, []);

  const handlePointerUp = useCallback(() => {
    setPaused(false);
    const el = containerRef.current;
    if (el) scrollRef.current = el.scrollLeft;
  }, []);

  const handlePointerLeave = useCallback(() => {
    setPaused(false);
    const el = containerRef.current;
    if (el) scrollRef.current = el.scrollLeft;
  }, []);

  if (items.length === 0) return null;

  return (
    <div className="shrink-0 h-12 flex items-center border-b border-white/10 bg-black/30 overflow-hidden">
      <div
        ref={containerRef}
        className="flex-1 min-w-0 overflow-x-auto overflow-y-hidden touch-pan-x no-scrollbar"
        style={{ scrollBehavior: paused ? "auto" : "unset" }}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onPointerLeave={handlePointerLeave}
      >
        <div
          ref={contentRef}
          className="flex w-max h-full items-center"
          style={{ minWidth: "max-content" }}
        >
          {[...items, ...items].map((haber, i) => (
            <Link
              key={`${i}-${haber.url}`}
              href={haber.url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 text-sm text-white/90 flex items-center gap-3 shrink-0 whitespace-nowrap hover:bg-white/5 active:bg-white/10 transition-colors touch-manipulation"
              title={haber.title}
              onClick={(e) => e.stopPropagation()}
            >
              <span className="shrink-0 px-2 py-0.5 rounded bg-red-500/80 text-xs font-bold text-white">
                {t("home.breakingNews")}
              </span>
              <span className="shrink-0 text-white/60 text-xs tabular-nums">
                {haber.date ? (
                  <>
                    {haber.date.split("-")[2]} {t(`home.month${parseInt(haber.date.split("-")[1], 10)}`)} {haber.date.split("-")[0]}
                  </>
                ) : null}
              </span>
              <span className="truncate max-w-[200px] sm:max-w-[300px]">{haber.title}</span>
            </Link>
          ))}
        </div>
      </div>
      <Link
        href="/haberler"
        className="shrink-0 px-4 py-2 h-full flex items-center bg-white/5 hover:bg-white/10 border-l border-white/10 text-sm font-semibold text-white/90 transition-colors"
      >
        Tümü
      </Link>
    </div>
  );
}
