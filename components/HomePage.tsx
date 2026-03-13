"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, type User } from "firebase/auth";
import { searchAitube } from "@/lib/searchAitube";
import { getInstantSuggestions } from "@/lib/searchUtils";
import { fetchTrendingContent, fetchNewContent, fetchByCategory, applyLegalFilter, fetchRecommendedForUser } from "@/lib/contentDiscovery";
import type { DiscoverProject } from "@/lib/contentDiscovery";
import { CATEGORY_TABS, getCategorySearchUrl } from "@/lib/categoryTabs";
import { SECTION_APPS } from "@/lib/sectionApps";
import { Sidebar } from "./Sidebar";
import { SectionHeader } from "./SectionHeader";
import { AIBackground } from "./AIBackground";
import { Mic, Search, Video } from "lucide-react";
import { UserMenu } from "./UserMenu";
import { NotificationBell } from "./NotificationBell";
import { useLocale } from "./LocaleProvider";
import { ProfileSetupModal, shouldShowProfileSetup } from "./ProfileSetupModal";
import { ContentCard } from "./ContentCard";
import { ScrollableCarousel } from "./ScrollableCarousel";
import { getSortedAiNews } from "@/lib/aiNews";
import { isSearchViolation, sanitizeSearchInput, SAFE_SEARCH_ALTERNATIVES } from "@/lib/searchGuard";
import { getWatchHistory } from "@/lib/engagement";
import { isAdmin } from "@/lib/isAdmin";

const SEARCH_HISTORY_KEY = "nabz.searchHistory.v1";
const SEARCH_HISTORY_MAX = 20;

export function HomePage() {
  const { t } = useLocale();
  const [user, setUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, setUser);
    return () => unsub();
  }, []);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [instantSuggestions, setInstantSuggestions] = useState<string[]>([]);
  const [searchResults, setSearchResults] = useState<{ videos: any[]; channels: any[] } | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [attemptedForbidden, setAttemptedForbidden] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [listening, setListening] = useState(false);
  const longPressTimerRef = useRef<number | null>(null);
  const longPressFiredRef = useRef(false);

  const searchViolation = isSearchViolation(searchQuery);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(SEARCH_HISTORY_KEY);
      const parsed = raw ? (JSON.parse(raw) as unknown) : [];
      if (Array.isArray(parsed)) {
        setSearchHistory(parsed.filter((x) => typeof x === "string" && x.trim()).slice(0, SEARCH_HISTORY_MAX));
      }
    } catch {
      // ignore
    }
  }, []);

  const persistHistory = (next: string[]) => {
    setSearchHistory(next);
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  };

  const addToHistory = (q: string) => {
    const value = q.trim();
    if (!value) return;
    const next = [value, ...searchHistory.filter((x) => x !== value)].slice(0, SEARCH_HISTORY_MAX);
    persistHistory(next);
  };

  const removeFromHistory = (q: string) => {
    const next = searchHistory.filter((x) => x !== q);
    persistHistory(next);
  };

  const handleSearchInputChange = (next: string) => {
    if (isSearchViolation(next)) {
      setAttemptedForbidden(true);
      setSuggestionsOpen(true);
      return;
    }
    setAttemptedForbidden(false);
    setSearchQuery(next);
    setSuggestionsOpen(true);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (q && !searchViolation) {
      setSuggestionsOpen(false);
      addToHistory(q);
      router.push(`/search?q=${encodeURIComponent(q)}`);
    }
  };

  const selectSuggestion = (s: string) => {
    setSearchQuery(s);
    setSuggestionsOpen(false);
    setAttemptedForbidden(false);
    addToHistory(s);
    router.push(`/search?q=${encodeURIComponent(s)}`);
  };

  const startVoiceSearch = async () => {
    if (typeof window === "undefined") return;
    const SR: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    if (listening) return;
    try {
      setListening(true);
      // Trigger permission prompt
      await navigator.mediaDevices.getUserMedia({ audio: true });
      const recognition = new SR();
      recognition.lang = "tr-TR";
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      recognition.onresult = (event: any) => {
        const last = event.results?.[event.results.length - 1];
        const text = last?.[0]?.transcript ?? "";
        if (text) {
          handleSearchInputChange(text);
          if (last?.isFinal) {
            const final = text.trim();
            if (final && !isSearchViolation(final)) {
              setSearchQuery(final);
              addToHistory(final);
              setSuggestionsOpen(false);
              router.push(`/search?q=${encodeURIComponent(final)}`);
            }
          }
        }
      };
      recognition.onerror = () => {
        setListening(false);
      };
      recognition.onend = () => {
        setListening(false);
      };
      recognition.start();
    } catch {
      setListening(false);
    }
  };

  useEffect(() => {
    if (!searchQuery.trim()) {
      setInstantSuggestions([]);
      setSearchResults(null);
      return;
    }
    setInstantSuggestions(getInstantSuggestions(searchQuery));
  }, [searchQuery]);

  const fetchResults = useCallback(async (q: string) => {
    if (!q.trim()) return;
    setSearchLoading(true);
    try {
      const data = await searchAitube(q);
      setSearchResults(data);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      if (searchQuery.trim() && !isSearchViolation(searchQuery)) fetchResults(searchQuery);
      else setSearchResults(null);
    }, 300);
    return () => clearTimeout(t);
  }, [searchQuery, fetchResults]);

  useEffect(() => {
    const hide = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSuggestionsOpen(false);
      }
    };
    document.addEventListener("click", hide);
    return () => document.removeEventListener("click", hide);
  }, []);

  const [profileSetupDismissed, setProfileSetupDismissed] = useState(false);

  const showProfileSetupModal = user && shouldShowProfileSetup(user) && !profileSetupDismissed;

  const [trending, setTrending] = useState<DiscoverProject[]>([]);
  const [newContent, setNewContent] = useState<DiscoverProject[]>([]);
  const [recommended, setRecommended] = useState<DiscoverProject[]>([]);
  const [byCategory, setByCategory] = useState<Record<string, DiscoverProject[]>>({});
  const [contentLoading, setContentLoading] = useState(true);

  const [userCountry, setUserCountry] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/locale")
      .then((r) => r.json())
      .then((d) => setUserCountry(d?.country ?? null))
      .catch(() => setUserCountry(null));
  }, []);

  useEffect(() => {
    const load = async () => {
      setContentLoading(true);
      try {
        const [trend, newest, shorts, enler, video, muzik, animasyon, logo] = await Promise.all([
          fetchTrendingContent(16),
          fetchNewContent(16),
          fetchByCategory("shorts", 12),
          fetchByCategory("enler", 12),
          fetchByCategory("video", 12),
          fetchByCategory("muzik", 12),
          fetchByCategory("animasyon", 12),
          fetchByCategory("logo-tasarim", 12),
        ]);
        setTrending(trend);
        setNewContent(newest);
        setByCategory({
          shorts,
          enler,
          video,
          muzik,
          animasyon,
          "logo-tasarim": logo,
        });
      } finally {
        setContentLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (!user?.uid) return;
    const load = async () => {
      const ids = await getWatchHistory(user.uid);
      const data = await fetchRecommendedForUser(ids, 16);
      setRecommended(data);
    };
    load();
  }, [user?.uid]);


  const filteredTrending = useMemo(
    () => applyLegalFilter(trending, userCountry),
    [trending, userCountry]
  );
  const filteredRecommended = useMemo(
    () => applyLegalFilter(recommended, userCountry),
    [recommended, userCountry]
  );
  const filteredNewContent = useMemo(
    () => applyLegalFilter(newContent, userCountry),
    [newContent, userCountry]
  );
  const filteredByCategory = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(byCategory).map(([k, v]) => [k, applyLegalFilter(v, userCountry)])
      ) as Record<string, DiscoverProject[]>,
    [byCategory, userCountry]
  );

  const toCard = (p: DiscoverProject) => ({
    id: p.id,
    title: p.title,
    channel: p.authorName || t("home.channelStudio"),
    likesCount: p.likedBy?.length ?? 0,
    dislikesCount: p.dislikedBy?.length ?? 0,
    commentsCount: 0,
    imageUrl: p.imageUrl as string | undefined,
  });

  const videos = filteredTrending.length > 0 ? filteredTrending.map(toCard) : Array.from({ length: 12 }, (_, i) => ({
    id: `s${i + 1}`,
    title: `${t("home.fallbackShorts")} #${i + 1}`,
    channel: t("home.channelStudio"),
    likesCount: (i + 1) * 12,
    dislikesCount: (i + 1) * 2,
    commentsCount: (i + 1) * 3,
  }));

  const enler = (filteredByCategory.enler?.length ?? 0) > 0 ? filteredByCategory.enler.map(toCard) : filteredNewContent.slice(0, 8).map(toCard);
  const enlerFallback = enler.length === 0 ? Array.from({ length: 8 }, (_, i) => ({
    id: `e${i + 1}`,
    title: `${t("home.fallbackEnler")} #${i + 1}`,
    channel: t("home.channelStudio"),
    likesCount: (i + 1) * 24,
    dislikesCount: (i + 1) * 3,
    commentsCount: (i + 1) * 5,
  })) : enler;

  const videoList = (filteredByCategory.video?.length ?? 0) > 0 ? filteredByCategory.video.map(toCard) : filteredNewContent.slice(0, 8).map(toCard);
  const videoListFallback = videoList.length === 0 ? Array.from({ length: 8 }, (_, i) => ({
    id: `v${i + 1}`,
    title: `${t("home.fallbackVideo")} #${i + 1}`,
    channel: t("home.channelStudio"),
    likesCount: (i + 1) * 18,
    dislikesCount: (i + 1) * 2,
    commentsCount: (i + 1) * 4,
  })) : videoList;

  const musicList = (filteredByCategory.muzik?.length ?? 0) > 0 ? filteredByCategory.muzik.map(toCard) : Array.from({ length: 8 }, (_, i) => ({
    id: `m${i + 1}`,
    title: `${t("home.fallbackMuzik")} #${i + 1}`,
    channel: t("home.channelStudio"),
    likesCount: (i + 1) * 15,
    dislikesCount: (i + 1) * 1,
    commentsCount: (i + 1) * 2,
  }));

  const animasyonList = (filteredByCategory.animasyon?.length ?? 0) > 0 ? filteredByCategory.animasyon.map(toCard) : Array.from({ length: 8 }, (_, i) => ({
    id: `a${i + 1}`,
    title: `${t("home.fallbackAnimasyon")} #${i + 1}`,
    channel: t("home.channelStudio"),
    likesCount: (i + 1) * 20,
    dislikesCount: (i + 1) * 4,
    commentsCount: (i + 1) * 6,
  }));

  const logoTasarimList = (filteredByCategory["logo-tasarim"]?.length ?? 0) > 0 ? filteredByCategory["logo-tasarim"].map(toCard) : Array.from({ length: 8 }, (_, i) => ({
    id: `l${i + 1}`,
    title: `${t("home.fallbackLogoTasarim")} #${i + 1}`,
    channel: t("home.channelStudio"),
    likesCount: (i + 1) * 10,
    dislikesCount: (i + 1) * 1,
    commentsCount: (i + 1) * 2,
  }));

  const shortsList = (filteredByCategory.shorts?.length ?? 0) > 0 ? filteredByCategory.shorts.map(toCard) : videos;

  const sondakikaHaberler = getSortedAiNews();

  return (
    <div className="relative flex min-h-screen min-w-full overflow-hidden">
      {showProfileSetupModal && user && (
        <ProfileSetupModal
          user={{ uid: user.uid, email: user.email ?? undefined, displayName: user.displayName ?? undefined, photoURL: user.photoURL ?? undefined }}
          onClose={() => setProfileSetupDismissed(true)}
        />
      )}
      <AIBackground />
      <div className="relative z-10 hidden sm:block">
        <Sidebar user={user} />
      </div>

      <div className="relative z-10 flex-1 min-w-0 sm:ml-56 flex flex-col min-h-screen text-white">
        {/* Header: YouTube tarzı arama */}
        <header className="h-14 sm:h-16 px-3 sm:px-6 flex items-center gap-2 sm:gap-4 border-b border-white/10 shrink-0">
          <Link href="/" className="flex flex-col items-center gap-1 shrink-0 hover:opacity-90 transition-opacity">
            <span className="overflow-hidden shrink-0 w-11 h-9 sm:w-14 sm:h-11 flex items-center justify-center bg-black/40" style={{ borderRadius: "50%" }}>
              <img src="/logo.png" alt="" className="w-full h-full object-contain mix-blend-screen" />
            </span>
            <span className="font-['Orbitron'] font-black text-sm sm:text-base text-white leading-none">NABZ-AI</span>
          </Link>
          <div ref={searchRef} className="flex-1 flex items-center justify-center min-w-0 relative">
            <form onSubmit={handleSearch} className="relative flex items-center gap-2 w-full max-w-[520px] sm:max-w-2xl">
              <div className="relative flex-1 min-w-0">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/45" />
                <input
                  type="text"
                  placeholder={t("home.searchShort")}
                  value={searchQuery}
                  onChange={(e) => handleSearchInputChange(e.target.value)}
                  onPaste={(e) => {
                    e.preventDefault();
                    const pasted = e.clipboardData.getData("text");
                    const sanitized = sanitizeSearchInput(pasted);
                    if (sanitized) {
                      setSearchQuery(sanitized);
                      setAttemptedForbidden(false);
                      setSuggestionsOpen(true);
                    } else {
                      setAttemptedForbidden(true);
                      setSuggestionsOpen(true);
                    }
                  }}
                  onFocus={() => setSuggestionsOpen(true)}
                  className={`w-full min-w-0 bg-black/60 border pl-10 pr-4 py-2.5 sm:py-3 rounded-2xl text-sm sm:text-base text-white placeholder:text-white/45 outline-none focus:ring-2 transition-all duration-200 ${
                    searchViolation
                      ? "border-red-500/80 focus:border-red-500 focus:ring-red-500/20 shadow-[0_0_20px_rgba(255,0,60,0.2)]"
                      : "border-white/20 focus:border-red-500/50 focus:ring-red-500/20"
                  }`}
                  aria-label="Arama"
                  aria-expanded={suggestionsOpen}
                  aria-autocomplete="list"
                />
              </div>
              <button
                type="button"
                onClick={startVoiceSearch}
                className={`p-2.5 sm:p-3 rounded-full bg-black/60 border border-white/20 hover:bg-white/10 active:scale-95 transition-all duration-200 shrink-0 ${listening ? "ring-2 ring-red-500/30 border-red-500/40" : ""}`}
                aria-label="Sesli arama"
                title="Sesli arama"
              >
                <Mic size={20} className={listening ? "text-red-300" : "text-white/80"} />
              </button>
            </form>
            {suggestionsOpen && (attemptedForbidden || searchQuery.trim() || searchHistory.length > 0) && (
              <div className="absolute top-full left-0 right-0 sm:left-auto sm:right-auto sm:min-w-[320px] mt-1 py-2 bg-black/95 border border-white/20 rounded-xl shadow-2xl z-50 overflow-hidden max-h-64 sm:max-h-80 overflow-y-auto">
                {attemptedForbidden ? (
                  <div className="px-2 pb-2">
                    <p className="text-[10px] text-white/50 uppercase font-bold px-3 py-1.5">{t("home.suggestions")}</p>
                    {SAFE_SEARCH_ALTERNATIVES.slice(0, 6).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => selectSuggestion(s)}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-white/10 rounded-lg flex items-center gap-2"
                      >
                        <Search size={14} className="text-white/40 shrink-0" />
                        {s}
                      </button>
                    ))}
                  </div>
                ) : !searchQuery.trim() && searchHistory.length > 0 ? (
                  <div className="px-2 pb-2">
                    <p className="text-[10px] text-white/50 uppercase font-bold px-3 py-1.5">Geçmiş</p>
                    {searchHistory.map((h) => (
                      <button
                        key={h}
                        type="button"
                        onPointerDown={() => {
                          longPressFiredRef.current = false;
                          if (longPressTimerRef.current) window.clearTimeout(longPressTimerRef.current);
                          longPressTimerRef.current = window.setTimeout(() => {
                            longPressFiredRef.current = true;
                            removeFromHistory(h);
                          }, 650);
                        }}
                        onPointerUp={() => {
                          if (longPressTimerRef.current) window.clearTimeout(longPressTimerRef.current);
                          longPressTimerRef.current = null;
                        }}
                        onPointerCancel={() => {
                          if (longPressTimerRef.current) window.clearTimeout(longPressTimerRef.current);
                          longPressTimerRef.current = null;
                        }}
                        onClick={() => {
                          if (longPressFiredRef.current) return;
                          selectSuggestion(h);
                        }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-white/10 rounded-lg flex items-center gap-2"
                        title="Basılı tut: sil"
                      >
                        <Search size={14} className="text-white/40 shrink-0" />
                        <span className="truncate">{h}</span>
                      </button>
                    ))}
                  </div>
                ) : instantSuggestions.length > 0 ? (
                  <div className="px-2 pb-2 border-b border-white/10">
                    <p className="text-[10px] text-white/50 uppercase font-bold px-3 py-1.5">{t("home.suggestions")}</p>
                    {instantSuggestions.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => selectSuggestion(s)}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-white/10 rounded-lg flex items-center gap-2"
                      >
                        <Search size={14} className="text-white/40 shrink-0" />
                        {s}
                      </button>
                    ))}
                  </div>
                ) : null}
                {!attemptedForbidden && searchLoading && (
                  <div className="px-3 py-2 text-sm text-white/50 flex items-center gap-2">
                    <div className="w-3 h-3 border border-red-500/50 border-t-red-500 rounded-full animate-spin" />
                    {t("home.searching")}
                  </div>
                )}
                {!attemptedForbidden && searchResults && !searchLoading && (
                  <div className="px-2 pt-2">
                    {searchResults.channels.length > 0 && (
                      <div className="mb-2">
                        <p className="text-[10px] text-white/50 uppercase font-bold px-3 py-1.5">{t("home.channels")}</p>
                        {searchResults.channels.slice(0, 3).map((c: any) => (
                          <Link
                            key={c.id}
                            href={`/channel/${c.id}`}
                            onClick={() => setSuggestionsOpen(false)}
                            className="flex items-center gap-3 px-3 py-2 hover:bg-white/10 rounded-lg"
                          >
                            <img src={c.photoURL || "/default-avatar.png"} alt="" className="w-8 h-8 rounded-full object-cover bg-gray-800" />
                            <span className="text-sm truncate">{c.displayName || t("home.unnamed")}</span>
                          </Link>
                        ))}
                      </div>
                    )}
                    {searchResults.videos.length > 0 && (
                      <div>
                        <p className="text-[10px] text-white/50 uppercase font-bold px-3 py-1.5">{t("home.videos")}</p>
                        {searchResults.videos.slice(0, 4).map((v: any) => (
                          <Link
                            key={v.id}
                            href={`/project/${v.id}`}
                            onClick={() => setSuggestionsOpen(false)}
                            className="flex items-center gap-3 px-3 py-2 hover:bg-white/10 rounded-lg"
                          >
                            <Video size={16} className="text-white/40 shrink-0" />
                            <span className="text-sm truncate">{v.title || t("home.unnamed")}</span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {!attemptedForbidden && !searchLoading && searchResults && searchResults.videos.length === 0 && searchResults.channels.length === 0 && instantSuggestions.length === 0 && (
                  <p className="px-3 py-2 text-sm text-white/50">{t("home.noResults")}</p>
                )}
              </div>
            )}
          </div>
          <div className="ml-auto shrink-0 flex items-center gap-1 sm:gap-2">
            {user && isAdmin(user.uid) && (
              <>
                <Link
                  href="/admin"
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-400 hover:bg-amber-500/30 text-xs font-medium"
                >
                  Kontrol Kulesi
                </Link>
                <Link
                  href="/admin/ecosystem"
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/30 text-xs font-medium"
                >
                  Ekosistemim
                </Link>
              </>
            )}
            <NotificationBell userId={user?.uid ?? null} />
            <UserMenu user={user} />
          </div>
        </header>

        {/* Kategori başlıkları - tarayıcıda en güncel sonuçları bul */}
        <nav className="flex flex-row flex-wrap items-center gap-2 sm:gap-3 px-4 sm:px-6 py-3 sm:py-4 border-b border-white/10 shrink-0 overflow-x-auto no-scrollbar">
          {CATEGORY_TABS.map((tab) => (
            <a
              key={tab.labelKey}
              href={getCategorySearchUrl(tab.query)}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium bg-white/5 border border-white/20 hover:bg-white/10 hover:border-red-500/30 active:scale-95 transition-all duration-200 shrink-0"
            >
              {t(tab.labelKey)}
            </a>
          ))}
        </nav>

        {/* Sondakika AI - Sağdan sola kayan haber bandı + Tümü sekmesi */}
        <div className="shrink-0 h-12 flex items-center border-b border-white/10 bg-black/30 overflow-hidden">
          <div
            className="flex-1 min-w-0 overflow-hidden"
            onMouseEnter={(e) => {
              const marquee = e.currentTarget.querySelector(".sondakika-marquee");
              if (marquee) (marquee as HTMLElement).style.animationPlayState = "paused";
            }}
            onMouseLeave={(e) => {
              const marquee = e.currentTarget.querySelector(".sondakika-marquee");
              if (marquee) (marquee as HTMLElement).style.animationPlayState = "running";
            }}
          >
            <div className="flex w-max animate-sondakika-scroll sondakika-marquee">
              {[...sondakikaHaberler, ...sondakikaHaberler].map((haber, i) => (
                <a
                  key={i}
                  href={haber.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 text-sm text-white/90 flex items-center gap-3 shrink-0 whitespace-nowrap hover:bg-white/5 transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span className="shrink-0 px-2 py-0.5 rounded bg-red-500/80 text-xs font-bold text-white">
                    {t("home.breakingNews")}
                  </span>
                  <span className="shrink-0 text-white/60 text-xs tabular-nums">
                    {haber.date.split("-")[2]} {t(`home.month${parseInt(haber.date.split("-")[1], 10)}`)} {haber.date.split("-")[0]}
                  </span>
                  <span className="truncate max-w-[200px] sm:max-w-[300px]">{t(haber.titleKey)}</span>
                </a>
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

        <main className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col pb-8">
          {/* Sizin için önerilen - giriş yapmış kullanıcılar için */}
          {user && filteredRecommended.length > 0 && (
            <section className="shrink-0">
              <div className="px-4 sm:px-6 pt-[60px] pb-1">
                <h2 className="text-lg font-bold text-white/90 flex items-center gap-2">
                  {t("home.recommended")}
                </h2>
              </div>
              <ScrollableCarousel className="px-4 sm:px-6" contentClassName="gap-4 sm:gap-6 py-4" speed={55}>
                {filteredRecommended.map((p) => (
                  <ContentCard
                    key={`rec-${p.id}`}
                    id={p.id}
                    title={p.title}
                    channel={p.authorName || t("home.channelStudio")}
                    likesCount={p.likedBy?.length ?? 0}
                    dislikesCount={p.dislikedBy?.length ?? 0}
                    commentsCount={0}
                    imageUrl={p.imageUrl}
                  />
                ))}
              </ScrollableCarousel>
            </section>
          )}

          {/* Shorts - Dikey ekran, sağdan sola kayma */}
          <section className="shrink-0">
            <div className="px-4 sm:px-6 pt-[60px] pb-1">
              <SectionHeader section={SECTION_APPS[0]} />
            </div>
            <ScrollableCarousel className="px-4 sm:px-6" contentClassName="gap-4 sm:gap-6 py-4" speed={55}>
              {[...shortsList, ...shortsList].map((v, i) => (
                <ContentCard
                  key={`shorts-${v.id}-${i}`}
                  id={v.id}
                  title={v.title}
                  channel={v.channel}
                  variant="shorts"
                  likesCount={v.likesCount}
                  dislikesCount={v.dislikesCount}
                  commentsCount={v.commentsCount}
                  imageUrl={(v as { imageUrl?: string }).imageUrl}
                />
              ))}
            </ScrollableCarousel>
          </section>

          {/* Enler - Yatay kayan ekran */}
          <section className="shrink-0">
            <div className="px-4 sm:px-6 pt-4 sm:pt-6 pb-1">
              <SectionHeader section={SECTION_APPS[1]} />
            </div>
            <ScrollableCarousel className="px-4 sm:px-6" contentClassName="gap-4 sm:gap-6 py-4" speed={55}>
              {[...enlerFallback, ...enlerFallback].map((e, i) => (
                <ContentCard
                  key={`enler-${e.id}-${i}`}
                  id={e.id}
                  title={e.title}
                  channel={e.channel}
                  likesCount={e.likesCount}
                  dislikesCount={e.dislikesCount}
                  commentsCount={e.commentsCount}
                  imageUrl={(e as { imageUrl?: string }).imageUrl}
                />
              ))}
            </ScrollableCarousel>
          </section>

          {/* Video - Yatay kayan ekran */}
          <section className="shrink-0">
            <div className="px-4 sm:px-6 pt-4 sm:pt-6 pb-1">
              <SectionHeader section={SECTION_APPS[2]} />
            </div>
            <ScrollableCarousel className="px-4 sm:px-6" contentClassName="gap-4 sm:gap-6 py-4" speed={55}>
              {[...videoListFallback, ...videoListFallback].map((v, i) => (
                <ContentCard
                  key={`video-${v.id}-${i}`}
                  id={v.id}
                  title={v.title}
                  channel={v.channel}
                  likesCount={v.likesCount}
                  dislikesCount={v.dislikesCount}
                  commentsCount={v.commentsCount}
                  imageUrl={(v as { imageUrl?: string }).imageUrl}
                />
              ))}
            </ScrollableCarousel>
          </section>

          {/* Müzik - Yatay kayan ekran */}
          <section className="shrink-0">
            <div className="px-4 sm:px-6 pt-4 sm:pt-6 pb-1">
              <SectionHeader section={SECTION_APPS[3]} />
            </div>
            <ScrollableCarousel className="px-4 sm:px-6" contentClassName="gap-4 sm:gap-6 py-4" speed={55}>
              {[...musicList, ...musicList].map((m, i) => (
                <ContentCard
                  key={`music-${m.id}-${i}`}
                  id={m.id}
                  title={m.title}
                  channel={m.channel}
                  likesCount={m.likesCount}
                  dislikesCount={m.dislikesCount}
                  commentsCount={m.commentsCount}
                  imageUrl={(m as { imageUrl?: string }).imageUrl}
                />
              ))}
            </ScrollableCarousel>
          </section>

          {/* Animasyon - Yatay kayan ekran */}
          <section className="shrink-0">
            <div className="px-4 sm:px-6 pt-4 sm:pt-6 pb-1">
              <SectionHeader section={SECTION_APPS[4]} />
            </div>
            <ScrollableCarousel className="px-4 sm:px-6" contentClassName="gap-4 sm:gap-6 py-4" speed={55}>
              {[...animasyonList, ...animasyonList].map((a, i) => (
                <ContentCard
                  key={`animasyon-${a.id}-${i}`}
                  id={a.id}
                  title={a.title}
                  channel={a.channel}
                  likesCount={a.likesCount}
                  dislikesCount={a.dislikesCount}
                  commentsCount={a.commentsCount}
                  imageUrl={(a as { imageUrl?: string }).imageUrl}
                />
              ))}
            </ScrollableCarousel>
          </section>

          {/* Logo ve Tasarım - Yatay kayan ekran */}
          <section className="shrink-0">
            <div className="px-4 sm:px-6 pt-4 sm:pt-6 pb-1">
              <SectionHeader section={SECTION_APPS[5]} />
            </div>
            <ScrollableCarousel className="px-4 sm:px-6" contentClassName="gap-4 sm:gap-6 py-4" speed={55}>
              {[...logoTasarimList, ...logoTasarimList].map((l, i) => (
                <ContentCard
                  key={`logo-${l.id}-${i}`}
                  id={l.id}
                  title={l.title}
                  channel={l.channel}
                  likesCount={l.likesCount}
                  dislikesCount={l.dislikesCount}
                  commentsCount={l.commentsCount}
                  imageUrl={(l as { imageUrl?: string }).imageUrl}
                />
              ))}
            </ScrollableCarousel>
          </section>
        </main>
      </div>
    </div>
  );
}
