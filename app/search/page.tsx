"use client";

import { Suspense, useEffect, useState, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, type User as AuthUser } from "firebase/auth";
import { searchAitube } from "@/lib/searchAitube";
import { isSearchViolation, SAFE_SEARCH_ALTERNATIVES, sanitizeSearchInput } from "@/lib/searchGuard";
import { getSearchHistory, addSearchHistory, removeSearchHistory } from "@/lib/searchHistory";
import { Sidebar } from "@/components/Sidebar";
import { Search, Video, User, History, X, Mic, Loader2 } from "lucide-react";

function useVoiceSearch(onResult: (text: string) => void) {
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const start = useCallback(() => {
    setError(null);
    const SpeechRecognition = typeof window !== "undefined" && (window.SpeechRecognition || (window as unknown as { webkitSpeechRecognition?: typeof SpeechRecognition })["webkitSpeechRecognition"]);
    if (!SpeechRecognition) {
      setError("Bu tarayıcı sesli aramayı desteklemiyor.");
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
    } catch (err) {
      setError("Mikrofon izni gerekli.");
      setListening(false);
    }
  }, [onResult]);

  useEffect(() => () => { recognitionRef.current?.abort?.(); }, []);
  return { start, listening, error };
}

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const q = searchParams.get("q") || "";
  const [user, setUser] = useState<AuthUser | null>(null);
  const [searchInput, setSearchInput] = useState(q);
  const [results, setResults] = useState<{ videos: any[]; channels: any[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(true);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const [attemptedForbidden, setAttemptedForbidden] = useState(false);

  const refreshHistory = useCallback(() => setSearchHistory(getSearchHistory()), []);

  const runSearch = useCallback((term: string) => {
    const val = term.trim();
    if (!val || isSearchViolation(val)) return;
    addSearchHistory(val);
    setShowHistory(false);
    router.push(`/search?q=${encodeURIComponent(val)}`);
  }, [router]);

  const { start: startVoice, listening, error: micError } = useVoiceSearch((text) => {
    const sanitized = sanitizeSearchInput(text);
    if (sanitized) {
      setSearchInput(sanitized);
      setAttemptedForbidden(false);
      runSearch(sanitized);
    }
  });

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, setUser);
    return () => unsub();
  }, []);

  useEffect(() => {
    setSearchInput(q);
    if (q.trim()) setShowHistory(false);
    else setShowHistory(true);
  }, [q]);

  useEffect(() => {
    refreshHistory();
  }, [refreshHistory, showHistory]);

  const handleSearchInputChange = (next: string) => {
    if (isSearchViolation(next)) {
      setAttemptedForbidden(true);
      return;
    }
    setAttemptedForbidden(false);
    setSearchInput(next);
  };

  useEffect(() => {
    if (!q.trim() || isSearchViolation(q)) {
      setResults(null);
      return;
    }
    setLoading(true);
    searchAitube(q)
      .then((data) => setResults(data))
      .finally(() => setLoading(false));
  }, [q]);

  const searchViolation = isSearchViolation(q);
  const showHistorySection = showHistory && !q.trim() && searchHistory.length > 0;

  return (
    <div className="relative flex min-h-screen min-w-full overflow-hidden bg-[#0d0d0d]">
      <div className="relative z-10 hidden lg:block">
        <Sidebar user={user} />
      </div>

      <main className="relative z-10 flex-1 min-w-0 lg:ml-56 flex flex-col min-h-screen text-white px-4 sm:px-6 pt-4 pb-24 lg:pb-6">
        {/* Arama çubuğu + mikrofon */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            runSearch(searchInput);
          }}
          className="mb-4"
        >
          <div className="flex gap-2 max-w-2xl">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40 pointer-events-none" />
              <input
                ref={inputRef}
                type="text"
                value={searchInput}
                onChange={(e) => handleSearchInputChange(e.target.value)}
                onFocus={() => setShowHistory(true)}
                onBlur={() => setTimeout(() => setShowHistory(false), 200)}
                onPaste={(e) => {
                  e.preventDefault();
                  const pasted = e.clipboardData.getData("text");
                  const sanitized = sanitizeSearchInput(pasted);
                  if (sanitized) {
                    setSearchInput(sanitized);
                    setAttemptedForbidden(false);
                  } else setAttemptedForbidden(true);
                }}
                placeholder="Ara"
                className="w-full bg-white/5 border border-white/10 rounded-full pl-10 pr-4 py-3 text-white placeholder:text-white/40 outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all"
                aria-label="Arama"
              />
            </div>
            <button
              type="button"
              onClick={startVoice}
              title={micError || "Sesli arama"}
              className="shrink-0 p-3 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors disabled:opacity-50"
              aria-label="Sesli arama"
            >
              <Mic className={`w-5 h-5 ${listening ? "text-red-400 animate-pulse" : "text-white/70"}`} />
            </button>
            <button
              type="submit"
              className="shrink-0 px-5 py-3 rounded-full bg-cyan-500 hover:bg-cyan-400 text-black font-medium transition-colors"
            >
              Ara
            </button>
          </div>
          {micError && (
            <p className="mt-2 text-xs text-amber-400">{micError}</p>
          )}
          {attemptedForbidden && (
            <div className="mt-3 flex flex-wrap gap-2">
              {SAFE_SEARCH_ALTERNATIVES.slice(0, 5).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => { setSearchInput(s); setAttemptedForbidden(false); runSearch(s); }}
                  className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/15 text-sm"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </form>

        {/* Arama geçmişi – altta, YouTube tarzı */}
        {showHistorySection && (
          <section className="max-w-2xl">
            <h2 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3 flex items-center gap-2">
              <History className="w-4 h-4" />
              Arama geçmişi
            </h2>
            <ul className="space-y-0.5">
              {searchHistory.map((item) => (
                <li key={item}>
                  <div className="flex items-center gap-2 group py-2.5 px-3 rounded-xl hover:bg-white/5 transition-colors">
                    <button
                      type="button"
                      onClick={() => runSearch(item)}
                      className="flex-1 min-w-0 text-left flex items-center gap-3"
                    >
                      <Search className="w-4 h-4 text-white/40 shrink-0" />
                      <span className="truncate text-white/90">{item}</span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); removeSearchHistory(item); refreshHistory(); }}
                      className="p-1.5 rounded-full text-white/40 hover:text-white hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label="Geçmişten kaldır"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Sonuçlar veya boş durum */}
        {searchViolation ? (
          <div className="mt-6">
            <p className="text-white/50 text-sm mb-3">Güvenli öneriler:</p>
            <div className="flex flex-wrap gap-2">
              {SAFE_SEARCH_ALTERNATIVES.slice(0, 6).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => runSearch(s)}
                  className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/15 text-sm"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : !q.trim() && !showHistorySection ? (
          <p className="text-white/40 text-sm mt-6">Aramak için yazın veya geçmişten seçin.</p>
        ) : !q.trim() && searchHistory.length === 0 ? (
          <p className="text-white/40 text-sm mt-6">Henüz arama geçmişi yok.</p>
        ) : loading ? (
          <div className="flex items-center gap-2 mt-8 text-white/50">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Aranıyor...</span>
          </div>
        ) : results ? (
          <div className="mt-6 space-y-8">
            {results.channels.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <User size={16} />
                  Kanallar
                </h2>
                <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                  {results.channels.map((c: any) => (
                    <Link
                      key={c.id}
                      href={`/channel/${c.id}`}
                      className="flex items-center gap-4 p-3 rounded-xl bg-white/5 border border-white/10 hover:border-cyan-500/30 transition-colors"
                    >
                      <img
                        src={c.photoURL || "/default-avatar.png"}
                        alt=""
                        className="w-11 h-11 rounded-full object-cover bg-white/10"
                      />
                      <span className="font-medium truncate">{c.displayName || "İsimsiz"}</span>
                    </Link>
                  ))}
                </div>
              </section>
            )}
            {results.videos.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Video size={16} />
                  Videolar
                </h2>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {results.videos.map((v: any) => (
                    <Link
                      key={v.id}
                      href={`/project/${v.id}`}
                      className="flex flex-col rounded-xl overflow-hidden bg-white/5 border border-white/10 hover:border-cyan-500/30 transition-colors group"
                    >
                      <div className="aspect-video bg-white/5 relative overflow-hidden">
                        {v.imageUrl ? (
                          <img src={v.imageUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        ) : null}
                      </div>
                      <div className="p-3">
                        <p className="font-medium text-sm truncate">{v.title || "İsimsiz"}</p>
                        <p className="text-xs text-white/50 truncate mt-0.5">
                          {v.channelName || v.createdBy || "NABZ-AI"}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}
            {results.videos.length === 0 && results.channels.length === 0 && (
              <p className="text-white/50 text-sm">Sonuç yok. Farklı kelimeler deneyin.</p>
            )}
          </div>
        ) : null}
      </main>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center">
          <Loader2 className="w-10 h-10 text-cyan-500 animate-spin" />
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
