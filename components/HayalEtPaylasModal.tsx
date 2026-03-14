"use client";

import { useCallback, useRef, useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "@/components/LocaleProvider";
import { Search, X } from "lucide-react";

type ShortcutGroupKey = "home.shortcutMuzik" | "home.shortcutVideo" | "home.shortcutGorsel" | "home.shortcutShorts";

const SHORTCUTS: { labelKey: ShortcutGroupKey; keywords: string[]; apps: { name: string; href: string }[] }[] = [
  {
    labelKey: "home.shortcutMuzik",
    keywords: ["müzik", "music", "şarkı", "ses", "suno", "udio", "elevenlabs", "vokal", "melodi"],
    apps: [
      { name: "Suno", href: "https://www.suno.ai" },
      { name: "ElevenLabs", href: "https://elevenlabs.io" },
      { name: "Udio", href: "https://www.udio.com" },
    ],
  },
  {
    labelKey: "home.shortcutVideo",
    keywords: ["video", "film", "kling", "runway", "capcut", "invideo", "montaj"],
    apps: [
      { name: "Kling", href: "https://www.klingai.com" },
      { name: "Runway", href: "https://runwayml.com" },
      { name: "CapCut", href: "https://www.capcut.com" },
    ],
  },
  {
    labelKey: "home.shortcutGorsel",
    keywords: ["görsel", "resim", "çizim", "visual", "image", "midjourney", "canva", "leonardo", "ideogram", "tasarım"],
    apps: [
      { name: "Midjourney", href: "https://www.midjourney.com" },
      { name: "Canva", href: "https://www.canva.com" },
      { name: "Leonardo", href: "https://www.leonardo.ai" },
    ],
  },
  {
    labelKey: "home.shortcutShorts",
    keywords: ["shorts", "reels", "tiktok", "kısa video", "dikey"],
    apps: [
      { name: "CapCut", href: "https://www.capcut.com" },
      { name: "Kling", href: "https://www.klingai.com" },
      { name: "InVideo", href: "https://invideo.io" },
    ],
  },
];

interface HayalEtPaylasModalProps {
  open: boolean;
  onClose: () => void;
}

export function HayalEtPaylasModal({ open, onClose }: HayalEtPaylasModalProps) {
  const { t } = useLocale();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [inputValue, setInputValue] = useState("");

  const filteredShortcuts = useMemo(() => {
    const q = inputValue.trim().toLowerCase();
    if (!q) return SHORTCUTS;
    const matched = SHORTCUTS.filter((group) =>
      group.keywords.some((kw) => q.includes(kw) || kw.includes(q))
    );
    return matched.length > 0 ? matched : SHORTCUTS;
  }, [inputValue]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const q = inputValue.trim();
      if (q) {
        onClose();
        setInputValue("");
        router.push(`/search?q=${encodeURIComponent(q)}`);
      }
    },
    [inputValue, onClose, router]
  );

  useEffect(() => {
    if (open) {
      setInputValue("");
      inputRef.current?.focus();
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <>
      {/* Tam ekran overlay – eski anasayfa arama görünmesin */}
      <div
        ref={overlayRef}
        role="button"
        tabIndex={-1}
        className="fixed inset-0 bg-slate-950/98 backdrop-blur-md z-[9998] animate-in fade-in duration-200"
        onClick={onClose}
        onKeyDown={(e) => e.key === "Escape" && onClose()}
        aria-label="Kapat"
      />
      <div
        className="fixed inset-x-0 bottom-0 top-[10vh] z-[9999] bg-slate-900 border-t border-white/10 rounded-t-3xl shadow-2xl animate-in slide-in-from-bottom duration-300 ease-out flex flex-col overflow-hidden"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 1rem)" }}
      >
        <div className="flex items-center justify-between px-4 pt-4 pb-2 shrink-0">
          <h2 className="text-lg font-bold text-white">{t("home.hayalinNe")}</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors"
            aria-label="Kapat"
          >
            <X size={22} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-4 pb-4 shrink-0">
          <div className="relative flex items-center gap-2 bg-black/40 border border-white/20 rounded-2xl pl-4 pr-3 py-2.5 focus-within:border-red-500/50 focus-within:ring-2 focus-within:ring-red-500/20 transition-all">
            <Search size={20} className="text-white/45 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={t("home.hayalinNe")}
              className="flex-1 min-w-0 bg-transparent text-white placeholder:text-white/45 outline-none text-base py-1"
              aria-label={t("home.hayalinNe")}
            />
            <button
              type="submit"
              className="shrink-0 px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold text-sm transition-colors"
            >
              {t("home.searchShort")}
            </button>
          </div>
        </form>

        <div className="px-4 pb-4 flex-1 min-h-0 overflow-y-auto">
          <p className="text-xs text-white/50 uppercase font-semibold tracking-wider mb-3">
            {inputValue.trim()
              ? t("home.shortcutsTitleFiltered")
              : t("home.shortcutsTitle")}
          </p>
          <div className="space-y-3">
            {filteredShortcuts.map((group) => (
              <div key={group.labelKey}>
                <p className="text-sm font-medium text-white/80 mb-1.5">{t(group.labelKey)}</p>
                <div className="flex flex-wrap gap-2">
                  {group.apps.map((app) => (
                    <a
                      key={app.name}
                      href={app.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={onClose}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-sm text-white transition-colors"
                    >
                      {app.name}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
