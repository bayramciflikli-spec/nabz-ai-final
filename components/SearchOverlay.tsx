"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSearchOverlay } from "./SearchOverlayContext";
import { searchAitube } from "@/lib/searchAitube";
import { isSearchViolation, sanitizeSearchInput, SAFE_SEARCH_ALTERNATIVES } from "@/lib/searchGuard";
import { MALL_STORES } from "@/lib/mallStores";

export function SearchOverlay() {
  const { isOpen, close } = useSearchOverlay();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ videos: any[]; channels: any[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [attemptedForbidden, setAttemptedForbidden] = useState(false);

  const handleQueryChange = (next: string) => {
    if (isSearchViolation(next)) {
      setAttemptedForbidden(true);
      return;
    }
    setAttemptedForbidden(false);
    setQuery(next);
  };

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setResults(null);
      setAttemptedForbidden(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim() || isSearchViolation(query)) {
      setResults(null);
      return;
    }
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await searchAitube(query);
        setResults(data);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  const q = query.toLowerCase().trim();
  const mallMatches = q
    ? MALL_STORES.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.category.toLowerCase().includes(q)
      )
    : MALL_STORES.slice(0, 4);

  const handleSelectMall = (href: string) => {
    close();
    window.open(href, "_blank");
  };

  const handleSelectVideo = (id: string) => {
    close();
    router.push(`/project/${id}`);
  };

  const handleSelectChannel = (id: string) => {
    close();
    router.push(`/channel/${id}`);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[10000] flex flex-col items-center pt-24 px-4 bg-black/80 backdrop-blur-md font-['Inter',sans-serif]"
      onClick={(e) => e.target === e.currentTarget && close()}
    >
      <div className="w-full max-w-[700px]" onClick={(e) => e.stopPropagation()}>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          onPaste={(e) => {
            e.preventDefault();
            const pasted = e.clipboardData.getData("text");
            const sanitized = sanitizeSearchInput(pasted);
            if (sanitized) {
              setQuery(sanitized);
              setAttemptedForbidden(false);
            } else {
              setAttemptedForbidden(true);
            }
          }}
          placeholder="Hangi AI aracını veya içeriği arıyorsun?"
          className="w-full bg-white/[0.03] border border-[#333] py-5 px-6 rounded-2xl text-white text-xl placeholder:text-gray-500 outline-none focus:border-cyan-400 focus:shadow-[0_0_40px_rgba(0,242,255,0.15)] transition-all shadow-[0_0_30px_rgba(0,0,0,0.5)]"
        />
        {(isSearchViolation(query) || attemptedForbidden) && (
          <div className="mt-3 p-4 rounded-xl bg-white/5 border border-white/10">
            <p className="text-gray-400 text-sm mb-3">Bunun yerine şunlara bakabilirsiniz:</p>
            <div className="space-y-1">
              {SAFE_SEARCH_ALTERNATIVES.slice(0, 6).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    setQuery(s);
                    setAttemptedForbidden(false);
                    close();
                    router.push(`/search?q=${encodeURIComponent(s)}`);
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/10 text-gray-200 text-sm transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-5 w-full bg-[#0f0f0f]/95 rounded-2xl border border-[#222] overflow-hidden">
          <div className="p-4 border-b border-[#222]">
            <div className="text-[11px] text-gray-500 uppercase tracking-widest mb-3">
              Mağazalar & Araçlar
            </div>
            <div className="space-y-1">
              {mallMatches.slice(0, 5).map((store) => (
                <button
                  key={store.id}
                  type="button"
                  onClick={() => handleSelectMall(store.href)}
                  className="w-full flex items-center gap-4 p-2.5 rounded-lg hover:bg-white/5 transition-colors text-left"
                >
                  <div
                    className="w-10 h-10 rounded-lg shrink-0 bg-[#222] flex items-center justify-center overflow-hidden"
                    style={{
                      background: store.logo
                        ? `url(${store.logo}) center/cover`
                        : "linear-gradient(135deg, #4ade80, #3b82f6)",
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-sm text-gray-200 truncate">
                        {store.name}
                      </h4>
                      <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                        MAĞAZA
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 truncate mt-0.5">
                      {store.desc.TR}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {(results?.videos?.length || results?.channels?.length || loading) && (
            <div className="p-4">
              <div className="text-[11px] text-gray-500 uppercase tracking-widest mb-3">
                {loading ? "Aranıyor..." : "Videolar & Kanallar"}
              </div>
              {loading ? (
                <div className="flex items-center gap-2 text-gray-500 py-4">
                  <div className="w-4 h-4 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
                  Yükleniyor...
                </div>
              ) : (
                <div className="space-y-1">
                  {results?.videos?.slice(0, 5).map((v: any) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => handleSelectVideo(v.id)}
                      className="w-full flex items-center gap-4 p-2.5 rounded-lg hover:bg-white/5 transition-colors text-left"
                    >
                      <div className="w-10 h-10 rounded-lg shrink-0 bg-[#1a1a1a] overflow-hidden flex items-center justify-center">
                        {v.imageUrl ? (
                          <img src={v.imageUrl} alt="" className="w-full h-full object-cover" />
                        ) : null}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm text-gray-200 truncate">
                          {v.title || "İsimsiz"}
                        </h4>
                        <p className="text-xs text-gray-500 truncate mt-0.5">
                          {v.channelName || v.createdBy || "NABZ-AI"} •{" "}
                          {((v.likedBy?.length ?? 0) * 100).toLocaleString("tr-TR")} görüntüleme
                        </p>
                      </div>
                    </button>
                  ))}
                  {results?.channels?.slice(0, 3).map((c: any) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => handleSelectChannel(c.id)}
                      className="w-full flex items-center gap-4 p-2.5 rounded-lg hover:bg-white/5 transition-colors text-left"
                    >
                      <img
                        src={c.photoURL || "/default-avatar.png"}
                        alt=""
                        className="w-10 h-10 rounded-lg shrink-0 object-cover bg-[#222]"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm text-gray-200 truncate">
                          {c.displayName || "İsimsiz"}
                        </h4>
                        <p className="text-xs text-gray-500 truncate mt-0.5">
                          Kanal
                        </p>
                      </div>
                    </button>
                  ))}
                  {results?.videos?.length === 0 &&
                    results?.channels?.length === 0 &&
                    query.trim() && (
                      <p className="text-sm text-gray-500 py-4">
                        Sonuç bulunamadı.
                      </p>
                    )}
                </div>
              )}
            </div>
          )}
        </div>

        <p className="text-xs text-gray-600 mt-4 text-center">
          <kbd className="px-1.5 py-0.5 rounded bg-white/5 font-mono">⌘K</kbd> veya{" "}
          <kbd className="px-1.5 py-0.5 rounded bg-white/5 font-mono">Ctrl+K</kbd> ile aç/kapat
        </p>
      </div>
    </div>
  );
}
