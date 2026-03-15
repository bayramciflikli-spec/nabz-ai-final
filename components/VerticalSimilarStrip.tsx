"use client";

import React, { useRef, useEffect, useState } from "react";
import Link from "next/link";
import type { DiscoverProject } from "@/lib/contentDiscovery";
import { getProgressPercent } from "@/lib/watchProgress";
import { hasMallStore } from "@/lib/mallStores";

const ITEM_HEIGHT = 120;
const SCROLL_PX_PER_SEC = 28;

interface VerticalSimilarStripProps {
  items: DiscoverProject[];
  currentId: string | null;
  className?: string;
}

export function VerticalSimilarStrip({ items, currentId, className = "" }: VerticalSimilarStripProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef(0);
  const [paused, setPaused] = useState(false);

  const filtered = items.filter((p) => p.id !== currentId);
  if (filtered.length === 0) return null;

  const duplicated = [...filtered, ...filtered];

  const halfHeight = filtered.length * ITEM_HEIGHT;

  useEffect(() => {
    let rafId: number;
    let lastTime = performance.now();

    const tick = (now: number) => {
      rafId = requestAnimationFrame(tick);
      const el = containerRef.current;
      if (!el || halfHeight <= 0) return;
      if (paused) {
        offsetRef.current = el.scrollTop;
        lastTime = now;
        return;
      }
      const dt = (now - lastTime) / 1000;
      lastTime = now;
      offsetRef.current += SCROLL_PX_PER_SEC * dt;
      if (offsetRef.current >= halfHeight) offsetRef.current -= halfHeight;
      el.scrollTop = offsetRef.current;
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [paused, halfHeight]);

  useEffect(() => {
    const el = containerRef.current;
    if (el) offsetRef.current = el.scrollTop;
  }, [currentId]);

  return (
    <aside
      className={`flex flex-col min-w-0 ${className}`}
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
    >
      <h3 className="text-sm font-bold text-white/80 mb-2 px-1">Benzer içerikler</h3>
      <div
        ref={containerRef}
        className="overflow-y-auto overflow-x-hidden no-scrollbar max-h-[calc(100vh-12rem)] min-h-[320px]"
        style={{ scrollBehavior: paused ? "auto" : "unset" }}
      >
        <div ref={contentRef} className="pr-1" style={{ height: duplicated.length * ITEM_HEIGHT }}>
          {duplicated.map((p, i) => {
            const views = ((p.likedBy?.length ?? 0) * 100).toLocaleString("tr-TR");
            const hasShop = hasMallStore(p.tool);
            const progressPct = getProgressPercent(p.id);
            return (
              <Link
                key={`similar-${i}-${p.id}`}
                href={`/project/${p.id}`}
                className="flex gap-2 py-2 hover:bg-white/5 rounded-lg px-2 -mx-2 transition-colors h-[120px] shrink-0"
              >
                <div className="w-[168px] h-[94px] bg-[#1a1a1a] rounded-lg shrink-0 overflow-hidden relative">
                  <img
                    src={p.imageUrl || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=336"}
                    alt={p.title}
                    className="w-full h-full object-cover"
                  />
                  {progressPct != null && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                      <div className="h-full bg-red-500" style={{ width: `${progressPct}%` }} />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold line-clamp-2 leading-snug">{p.title}</p>
                  <p className="text-xs text-gray-400 mt-1">{p.authorName || "NABZ-AI"}</p>
                  <p className="text-xs text-gray-400">{views} görüntüleme</p>
                  {hasShop && (
                    <span className="inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-400 border border-blue-500/50">
                      MAĞAZA
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
