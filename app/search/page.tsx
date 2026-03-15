"use client";

import { Suspense, useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, type User as AuthUser } from "firebase/auth";
import { searchAitube } from "@/lib/searchAitube";
import { isSearchViolation, SAFE_SEARCH_ALTERNATIVES, sanitizeSearchInput } from "@/lib/searchGuard";
import { getSearchHistory, addSearchHistory, removeSearchHistory } from "@/lib/searchHistory";
import { getInstantSuggestions, normalizeQuery } from "@/lib/searchUtils";
import { Sidebar } from "@/components/Sidebar";
import { Search, Video, User, History, X, Mic } from "lucide-react";

type SpeechResultItem = { isFinal: boolean; 0?: { transcript?: string } };
type SpeechResultEvent = { results: Array<SpeechResultItem> };

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const q = searchParams.get("q") || "";
  const [user, setUser] = useState<AuthUser | null>(null);
  const [searchInput, setSearchInput] = useState(q);
  const [results, setResults] = useState<{ videos: any[]; channels: any[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [listening, setListening] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [attemptedForbidden, setAttemptedForbidden] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const refreshHistory = () => setSearchHistory(getSearchHistory());

  // YouTube tarzı: yazarken eşleşen geçmiş + akıllı öneriler
  const normalizedInput = normalizeQuery(searchInput);
  const matchingHistory = searchInput.trim()
    ? searchHistory.filter((h) => {
        const n = normalizeQuery(h);
        return n.includes(normalizedInput) || normalizedInput.includes(n) || n.startsWith(normalizedInput) || normalizedInput.startsWith(n);
      }).slice(0, 8)
    : searchHistory.slice(0, 10);
  const rawSuggestions = searchInput.trim() ? getInstantSuggestions(searchInput) : [];
  const historySet = new Set(matchingHistory.map((h) => normalizeQuery(h)));
  const instantSuggestions = rawSuggestions.filter((s) => !historySet.has(normalizeQuery(s)));
  const defaultSuggestions = !searchInput.trim() ? ["video", "müzik", "shorts", "animasyon", "yapay zeka"] : [];
  const hasSuggestions = matchingHistory.length > 0 || instantSuggestions.length > 0 || defaultSuggestions.length > 0 || attemptedForbidden;

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, setUser);
    return () => unsub();
  }, []);

  useEffect(() => {
    setSearchInput(q);
  }, [q]);

  useEffect(() => {
    refreshHistory();
  }, [showSuggestions, q]);

  const searchViolation = isSearchViolation(q);

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

  const runSearch = (val: string) => {
    const v = val.trim();
    if (v && !isSearchViolation(v)) {
      addSearchHistory(v);
      setShowSuggestions(false);
      router.push(`/search?q=${encodeURIComponent(v)}`);
    }
  };

  const selectSuggestion = (s: string) => {
    setSearchInput(s);
    setShowSuggestions(false);
    runSearch(s);
  };

  const startVoiceSearch = async () => {
    if (typeof window === "undefined") return;
    setMicError(null);
    const SR = (window as Window & { SpeechRecognition?: new () => unknown; webkitSpeechRecognition?: new () => unknown }).SpeechRecognition
      || (window as Window & { webkitSpeechRecognition?: new () => unknown }).webkitSpeechRecognition;
    if (!SR) {
      setMicError("Sesli arama bu tarayıcıda desteklenmiyor.");
      return;
    }
    if (listening) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      setListening(true);
      const recognition = new SR() as {
        lang: string;
        interimResults: boolean;
        maxAlternatives: number;
        onresult: (event: SpeechResultEvent) => void;
        onerror: (e: { error?: string }) => void;
        onend: () => void;
        start: () => void;
      };
      recognition.lang = "tr-TR";
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      recognition.onresult = (event: SpeechResultEvent) => {
        const res = event.results;
        const last = res[res.length - 1];
        const text = (last?.[0]?.transcript ?? "").trim();
        if (text) handleSearchInputChange(text);
        if (last?.isFinal && text) {
          const final = sanitizeSearchInput(text) || text;
          if (final && !isSearchViolation(final)) {
            setSearchInput(final);
            setListening(false);
            runSearch(final);
          }
        }
      };
      recognition.onerror = (e: { error?: string }) => {
        if (e?.error !== "aborted") setListening(false);
      };
      recognition.onend = () => setListening(false);
      recognition.start();
    } catch (e: unknown) {
      setListening(false);
      const err = e as { name?: string; message?: string };
      if (err?.name === "NotAllowedError" || String(err?.message || "").toLowerCase().includes("permission")) {
        setMicError("Mikrofon izni gerekli. İzin verip tekrar deneyin.");
      } else if (err?.name === "NotFoundError") {
        setMicError("Mikrofon bulunamadı.");
      } else {
        setMicError("Mikrofon açılamadı.");
      }
    }
  };

  return (
    <div className="relative flex min-h-screen min-w-full overflow-hidden bg-[#0d0f12]">
      <div className="relative z-10 hidden lg:block">
        <Sidebar user={user} />
      </div>

      <main className="relative z-10 flex-1 min-w-0 lg:ml-56 flex flex-col min-h-screen text-white px-4 sm:px-6 pb-24 lg:pb-6">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            runSearch(searchInput);
          }}
          className="pt-4 sm:pt-6 mb-4"
        >
          <div className="relative flex gap-2 max-w-2xl">
            <input
              ref={inputRef}
              type="text"
              value={searchInput}
              onChange={(e) => handleSearchInputChange(e.target.value)}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
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
              className="flex-1 bg-white/5 border border-white/10 px-4 py-3 rounded-full text-white placeholder:text-white/40 outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/30"
              aria-label="Arama"
            />
            <button
              type="button"
              onClick={startVoiceSearch}
              className={`p-3 rounded-full shrink-0 transition-all ${listening ? "bg-red-500/30 text-red-300 ring-2 ring-red-500/50" : "bg-white/5 border border-white/10 hover:bg-white/10 text-white/80"}`}
              aria-label="Sesli arama"
              title={micError || "Sesli arama"}
            >
              <Mic size={22} />
            </button>
            <button
              type="submit"
              className="px-5 py-3 rounded-full bg-red-600 hover:bg-red-500 text-white font-medium text-sm shrink-0"
            >
              Ara
            </button>
          </div>
          {micError && (
            <p className="mt-2 text-xs text-red-400">{micError}</p>
          )}

          {/* YouTube tarzı: odakta açılır – eski aramalar + yazarken benzer/akıllı öneriler */}
          {showSuggestions && hasSuggestions && (
            <div className="absolute top-full left-0 right-0 mt-2 py-2 bg-[#1a1d24] border border-white/10 rounded-xl shadow-xl z-30 max-h-80 overflow-y-auto max-w-2xl">
              {attemptedForbidden ? (
                <div className="px-2 pb-2">
                  <p className="text-[10px] text-white/50 uppercase font-semibold px-4 py-2">Öneriler</p>
                  {SAFE_SEARCH_ALTERNATIVES.slice(0, 6).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => { setSearchInput(s); setAttemptedForbidden(false); selectSuggestion(s); }}
                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-white/10 rounded-lg flex items-center gap-3"
                    >
                      <Search size={16} className="text-white/40 shrink-0" />
                      {s}
                    </button>
                  ))}
                </div>
              ) : (
                <>
                  {matchingHistory.length > 0 && (
                    <div className="pb-2">
                      <div className="flex items-center gap-2 px-4 py-2 border-b border-white/10">
                        <History size={16} className="text-white/50" />
                        <span className="text-xs text-white/50 uppercase font-semibold">
                          {searchInput.trim() ? "Eşleşen aramalar" : "Arama geçmişi"}
                        </span>
                      </div>
                      {matchingHistory.map((item) => (
                        <button
                          key={item}
                          type="button"
                          onClick={() => selectSuggestion(item)}
                          className="w-full flex items-center justify-between px-4 py-2.5 text-left text-sm hover:bg-white/10 transition group"
                        >
                          <span className="truncate flex-1 flex items-center gap-3">
                            <History size={14} className="text-white/40 shrink-0" />
                            {item}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeSearchHistory(item);
                              refreshHistory();
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-full hover:bg-white/20 transition"
                            aria-label="Kaldır"
                          >
                            <X size={14} />
                          </button>
                        </button>
                      ))}
                    </div>
                  )}
                  {(instantSuggestions.length > 0 || defaultSuggestions.length > 0) && (
                    <div>
                      <div className="flex items-center gap-2 px-4 py-2 border-b border-white/10">
                        <Search size={16} className="text-white/50" />
                        <span className="text-xs text-white/50 uppercase font-semibold">
                          {searchInput.trim() ? "Benzer aramalar" : "Önerilen aramalar"}
                        </span>
                      </div>
                      {(instantSuggestions.length > 0 ? instantSuggestions : defaultSuggestions).map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => selectSuggestion(s)}
                          className="w-full text-left px-4 py-2.5 text-sm hover:bg-white/10 rounded-lg flex items-center gap-3"
                        >
                          <Search size={14} className="text-white/40 shrink-0" />
                          <span className="truncate">{s}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {attemptedForbidden && (
            <div className="mt-3 flex flex-wrap gap-2">
              {SAFE_SEARCH_ALTERNATIVES.slice(0, 5).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    setSearchInput(s);
                    setAttemptedForbidden(false);
                    runSearch(s);
                  }}
                  className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-sm"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </form>

        {searchViolation ? (
          <div className="flex flex-wrap gap-2 mt-4">
            {SAFE_SEARCH_ALTERNATIVES.slice(0, 6).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => router.push(`/search?q=${encodeURIComponent(s)}`)}
                className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-sm"
              >
                {s}
              </button>
            ))}
          </div>
        ) : !q.trim() ? (
          <div className="flex-1 flex items-start justify-center pt-12">
            <p className="text-white/40 text-sm">Aramak için yazın veya mikrofonla sesli arayın.</p>
          </div>
        ) : loading ? (
          <div className="flex items-center gap-2 text-white/50 pt-8">
            <div className="w-5 h-5 border-2 border-red-500/50 border-t-red-500 rounded-full animate-spin" />
            <span className="text-sm">Aranıyor...</span>
          </div>
        ) : results ? (
          <div className="space-y-8 pt-4">
            {results.channels.length > 0 && (
              <section>
                <h2 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <User size={14} /> Kanallar
                </h2>
                <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                  {results.channels.map((c: any) => (
                    <Link
                      key={c.id}
                      href={`/channel/${c.id}`}
                      className="flex items-center gap-4 p-3 rounded-xl bg-white/5 border border-white/10 hover:border-red-500/30 transition-colors"
                    >
                      <img
                        src={c.photoURL || "/default-avatar.png"}
                        alt=""
                        className="w-11 h-11 rounded-full object-cover bg-gray-800"
                      />
                      <span className="font-medium truncate">{c.displayName || "İsimsiz"}</span>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {results.videos.length > 0 && (
              <section>
                <h2 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Video size={14} /> Videolar
                </h2>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {results.videos.map((v: any) => (
                    <Link
                      key={v.id}
                      href={`/project/${v.id}`}
                      className="flex flex-col rounded-xl overflow-hidden bg-white/5 border border-white/10 hover:border-red-500/30 transition-colors group"
                    >
                      <div className="aspect-video bg-white/5 relative overflow-hidden">
                        {v.imageUrl ? (
                          <img src={v.imageUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        ) : null}
                      </div>
                      <div className="p-3">
                        <p className="font-semibold text-sm truncate">{v.title || "İsimsiz"}</p>
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
              <p className="text-white/50 text-sm pt-4">Sonuç bulunamadı. Farklı kelimeler deneyin.</p>
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
        <div className="min-h-screen bg-[#0d0f12] flex items-center justify-center">
          <div className="w-10 h-10 border-2 border-red-500/50 border-t-red-500 rounded-full animate-spin" />
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
