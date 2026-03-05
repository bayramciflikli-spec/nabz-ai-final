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
import { Sidebar } from "@/components/Sidebar";
import { Search, Video, User, History, X } from "lucide-react";

type UploadDateFilter = "all" | "hour" | "today" | "week" | "month";

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const q = searchParams.get("q") || "";
  const [user, setUser] = useState<AuthUser | null>(null);
  const [searchInput, setSearchInput] = useState(q);
  const [results, setResults] = useState<{ videos: any[]; channels: any[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadDate, setUploadDate] = useState<UploadDateFilter>("all");
  const [showHistory, setShowHistory] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const refreshHistory = () => setSearchHistory(getSearchHistory());

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, setUser);
    return () => unsub();
  }, []);

  useEffect(() => {
    setSearchInput(q);
  }, [q]);

  useEffect(() => {
    refreshHistory();
  }, [showHistory]);

  const searchViolation = isSearchViolation(q);
  const [attemptedForbidden, setAttemptedForbidden] = useState(false);

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
    searchAitube(q, { uploadDate })
      .then((data) => {
        setResults(data);
      })
      .finally(() => setLoading(false));
  }, [q, uploadDate]);

  return (
    <div className="relative flex min-h-screen min-w-full overflow-hidden bg-[#0d0f12]">
      <div className="relative z-10 hidden sm:block">
        <Sidebar user={user} />
      </div>

      <main className="relative z-10 flex-1 min-w-0 sm:ml-56 flex flex-col min-h-screen text-white p-6">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const val = searchInput.trim();
            if (val && !isSearchViolation(val)) {
              addSearchHistory(val);
              setShowHistory(false);
              router.push(`/search?q=${encodeURIComponent(val)}`);
            }
          }}
          className="mb-6"
        >
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="text-sm text-white/60">Yükleme tarihi:</span>
            {(["all", "hour", "today", "week", "month"] as const).map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setUploadDate(opt)}
                className={`px-3 py-1.5 rounded-lg text-sm transition ${
                  uploadDate === opt
                    ? "bg-red-500/80 text-white"
                    : "bg-white/10 text-white/80 hover:bg-white/20"
                }`}
              >
                {opt === "all" ? "Tümü" : opt === "hour" ? "Son 1 saat" : opt === "today" ? "Bugün" : opt === "week" ? "Bu hafta" : "Bu ay"}
              </button>
            ))}
          </div>
          <div className="relative flex gap-2 max-w-xl">
            <input
              ref={inputRef}
              type="text"
              value={searchInput}
              onChange={(e) => handleSearchInputChange(e.target.value)}
              onFocus={() => setShowHistory(true)}
              onBlur={() => setTimeout(() => setShowHistory(false), 150)}
              onPaste={(e) => {
                e.preventDefault();
                const pasted = e.clipboardData.getData("text");
                const sanitized = sanitizeSearchInput(pasted);
                if (sanitized) {
                  setSearchInput(sanitized);
                  setAttemptedForbidden(false);
                } else setAttemptedForbidden(true);
              }}
              placeholder="Ara... (Yazım hataları otomatik düzeltilir)"
              className="flex-1 bg-black/60 border border-white/20 px-4 py-2 rounded-lg text-sm text-white placeholder:text-white/50 outline-none focus:border-red-500/50"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-red-500/80 hover:bg-red-500 text-white font-medium text-sm shrink-0"
            >
              Ara
            </button>
            {showHistory && searchHistory.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 py-2 bg-[#1a1d24] border border-white/10 rounded-lg shadow-xl z-30 max-h-60 overflow-y-auto">
                <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
                  <span className="text-xs text-white/60 flex items-center gap-2">
                    <History size={14} /> Arama geçmişi
                  </span>
                </div>
                {searchHistory.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => {
                      setSearchInput(item);
                      setShowHistory(false);
                      addSearchHistory(item);
                      router.push(`/search?q=${encodeURIComponent(item)}`);
                    }}
                    className="w-full flex items-center justify-between px-3 py-2.5 text-left text-sm hover:bg-white/10 transition group"
                  >
                    <span className="truncate flex-1">{item}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeSearchHistory(item);
                        refreshHistory();
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-white/20 transition"
                      aria-label="Kaldır"
                    >
                      <X size={14} />
                    </button>
                  </button>
                ))}
              </div>
            )}
          </div>
          {attemptedForbidden && (
            <div className="mt-3 p-3 rounded-lg bg-white/5 border border-white/10">
              <p className="text-white/70 text-sm mb-2">Bunun yerine şunlara bakabilirsiniz:</p>
              <div className="flex flex-wrap gap-2">
                {SAFE_SEARCH_ALTERNATIVES.slice(0, 6).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      setSearchInput(s);
                      setAttemptedForbidden(false);
                      router.push(`/search?q=${encodeURIComponent(s)}`);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-sm transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
        </form>
        <h1 className="text-xl font-bold mb-6 flex items-center gap-2">
          <Search size={22} className="text-red-500" />
          {q ? `"${q}" için sonuçlar` : "Uygulama içi arama"}
        </h1>

        {searchViolation ? (
          <div className="space-y-4">
            <p className="text-white/60">Bunun yerine şunlara bakabilirsiniz:</p>
            <div className="flex flex-wrap gap-2">
              {SAFE_SEARCH_ALTERNATIVES.slice(0, 8).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => router.push(`/search?q=${encodeURIComponent(s)}`)}
                  className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 hover:bg-white/20 text-sm transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : !q.trim() ? (
          <p className="text-white/60">Arama kutusuna bir şey yazın ve Enter&apos;a basın.</p>
        ) : loading ? (
          <div className="flex items-center gap-2 text-white/60">
            <div className="w-4 h-4 border-2 border-red-500/50 border-t-red-500 rounded-full animate-spin" />
            Aranıyor...
          </div>
        ) : results ? (
          <div className="space-y-8">
            {results.channels.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-white/70 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <User size={16} /> Kanallar
                </h2>
                <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                  {results.channels.map((c: any) => (
                    <Link
                      key={c.id}
                      href={`/channel/${c.id}`}
                      className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:border-red-500/30 transition-colors"
                    >
                      <img
                        src={c.photoURL || "/default-avatar.png"}
                        alt={c.displayName}
                        className="w-12 h-12 rounded-full object-cover bg-gray-800"
                      />
                      <span className="font-medium truncate">{c.displayName || "İsimsiz"}</span>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {results.videos.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-white/70 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Video size={16} /> Videolar
                </h2>
                <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                  {results.videos.map((v: any) => (
                    <Link
                      key={v.id}
                      href={`/project/${v.id}`}
                      className="flex flex-col rounded-xl overflow-hidden bg-white/5 border border-white/10 hover:border-red-500/30 transition-colors group"
                    >
                      <div className="aspect-video bg-white/5 group-hover:bg-white/10 transition-colors" />
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
              <p className="text-white/60">Sonuç bulunamadı. Farklı anahtar kelimeler deneyin.</p>
            )}
          </div>
        ) : null}
      </main>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0d0f12] flex items-center justify-center"><div className="w-10 h-10 border-2 border-red-500/50 border-t-red-500 rounded-full animate-spin" /></div>}>
      <SearchContent />
    </Suspense>
  );
}
