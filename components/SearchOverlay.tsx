"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSearchOverlay } from "./SearchOverlayContext";
import { searchAitube } from "@/lib/searchAitube";
import { isSearchViolation, sanitizeSearchInput, SAFE_SEARCH_ALTERNATIVES } from "@/lib/searchGuard";
import { getSearchHistory, addSearchHistory } from "@/lib/searchHistory";
import { Search, History, Mic } from "lucide-react";

function useVoiceSearchOverlay(onResult: (text: string) => void) {
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const start = useCallback(() => {
    setError(null);
    const SpeechRecognition = typeof window !== "undefined" && (window.SpeechRecognition || (window as unknown as { webkitSpeechRecognition?: typeof SpeechRecognition })["webkitSpeechRecognition"]);
    if (!SpeechRecognition) {
      setError("Sesli arama desteklenmiyor.");
      return;
    }
    try {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = "tr-TR";
      rec.onresult = (e: SpeechRecognitionEvent) => {
        const t = e.results[0]?.[0]?.transcript?.trim();
        if (t) onResult(t);
        setListening(false);
      };
      rec.onend = () => setListening(false);
      rec.onerror = () => setListening(false);
      recognitionRef.current = rec;
      rec.start();
      setListening(true);
    } catch {
      setError("Mikrofon izni gerekli.");
      setListening(false);
    }
  }, [onResult]);

  useEffect(() => () => { recognitionRef.current?.abort?.(); }, []);
  return { start, listening, error };
}

export function SearchOverlay() {
  const { isOpen, close } = useSearchOverlay();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ videos: any[]; channels: any[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [attemptedForbidden, setAttemptedForbidden] = useState(false);

  const runSearch = useCallback((term: string) => {
    const val = term.trim();
    if (!val || isSearchViolation(val)) return;
    addSearchHistory(val);
    close();
    router.push(`/search?q=${encodeURIComponent(val)}`);
  }, [close, router]);

  const { start: startVoice, listening, error: micError } = useVoiceSearchOverlay((text) => {
    const sanitized = sanitizeSearchInput(text);
    if (sanitized) {
      setQuery(sanitized);
      setAttemptedForbidden(false);
      runSearch(sanitized);
    }
  });

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
      setSearchHistory(getSearchHistory());
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

  if (!isOpen) return null;

  const showHistory = !query.trim() && searchHistory.length > 0;

  return (
    <div
      className="fixed inset-0 z-[10000] flex flex-col items-center pt-20 px-4 pb-8 bg-black/85 backdrop-blur-md overflow-y-auto"
      onClick={(e) => e.target === e.currentTarget && close()}
    >
      <div className="w-full max-w-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
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
                } else setAttemptedForbidden(true);
              }}
              onKeyDown={(e) => {
                if (e.key === "Escape") close();
                if (e.key === "Enter" && query.trim() && !isSearchViolation(query)) runSearch(query);
              }}
              placeholder="Ara"
              className="w-full bg-white/5 border border-white/10 rounded-full pl-11 pr-4 py-3.5 text-white placeholder:text-white/40 outline-none focus:border-cyan-500/50 text-base"
            />
          </div>
          <button
            type="button"
            onClick={startVoice}
            title={micError || "Sesli arama"}
            className="shrink-0 p-3.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
            aria-label="Sesli arama"
          >
            <Mic className={`w-5 h-5 ${listening ? "text-red-400 animate-pulse" : "text-white/70"}`} />
          </button>
        </div>
        {micError && <p className="mt-2 text-xs text-amber-400">{micError}</p>}

        {attemptedForbidden && (
          <div className="mt-3 flex flex-wrap gap-2">
            {SAFE_SEARCH_ALTERNATIVES.slice(0, 5).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => runSearch(s)}
                className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/15 text-sm text-white/90"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Arama geçmişi – altta */}
        {showHistory && (
          <div className="mt-6">
            <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2 flex items-center gap-2">
              <History className="w-4 h-4" />
              Arama geçmişi
            </h3>
            <ul className="space-y-0.5">
              {searchHistory.slice(0, 8).map((item) => (
                <li key={item}>
                  <button
                    type="button"
                    onClick={() => runSearch(item)}
                    className="w-full flex items-center gap-3 py-2.5 px-3 rounded-xl hover:bg-white/5 text-left text-white/90"
                  >
                    <Search className="w-4 h-4 text-white/40 shrink-0" />
                    <span className="truncate">{item}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Yazarken sonuçlar */}
        {query.trim() && !showHistory && (
          <div className="mt-4 rounded-xl bg-white/5 border border-white/10 overflow-hidden">
            {loading ? (
              <div className="py-8 text-center text-white/50 text-sm">Aranıyor...</div>
            ) : results ? (
              <div className="divide-y divide-white/10">
                {results.videos.slice(0, 4).map((v: any) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => { close(); router.push(`/project/${v.id}`); }}
                    className="w-full flex items-center gap-4 p-3 hover:bg-white/5 text-left"
                  >
                    <div className="w-16 h-9 rounded bg-white/10 shrink-0 overflow-hidden">
                      {v.imageUrl && <img src={v.imageUrl} alt="" className="w-full h-full object-cover" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">{v.title || "İsimsiz"}</p>
                      <p className="text-xs text-white/50 truncate">{v.channelName || v.createdBy || "NABZ-AI"}</p>
                    </div>
                  </button>
                ))}
                {results.channels.slice(0, 2).map((c: any) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => { close(); router.push(`/channel/${c.id}`); }}
                    className="w-full flex items-center gap-4 p-3 hover:bg-white/5 text-left"
                  >
                    <img
                      src={c.photoURL || "/default-avatar.png"}
                      alt=""
                      className="w-10 h-10 rounded-full object-cover shrink-0 bg-white/10"
                    />
                    <p className="font-medium text-sm truncate">{c.displayName || "İsimsiz"}</p>
                  </button>
                ))}
                {results.videos.length === 0 && results.channels.length === 0 && (
                  <p className="py-4 px-3 text-sm text-white/50">Sonuç yok.</p>
                )}
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
