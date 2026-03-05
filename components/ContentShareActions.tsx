"use client";

import { useState, useRef, useEffect } from "react";
import { Share2, Bookmark, Copy, ExternalLink } from "lucide-react";
import { getShareUrl, getSaveUrl, SHARE_PLATFORMS, SAVE_PLATFORMS } from "@/lib/shareUtils";
import { useLocale } from "@/components/LocaleProvider";

const dropdownClass =
  "absolute right-0 bottom-full mb-2 z-50 min-w-[180px] py-1 rounded-lg bg-gray-900/95 border border-white/10 shadow-xl backdrop-blur-sm";

interface ContentShareActionsProps {
  url: string;
  title: string;
  buttonClass?: string;
  iconSize?: number;
  showLabels?: boolean;
}

export function ContentShareActions({
  url,
  title,
  buttonClass,
  iconSize = 24,
  showLabels = false,
}: ContentShareActionsProps) {
  const { t } = useLocale();
  const [shareOpen, setShareOpen] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const shareRef = useRef<HTMLDivElement>(null);
  const saveRef = useRef<HTMLDivElement>(null);

  const defaultBtnClass =
    "bg-white/10 p-3 rounded-full hover:bg-white/20 transition backdrop-blur-md flex flex-col items-center";
  const btnClass = buttonClass ?? defaultBtnClass;

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (shareRef.current && !shareRef.current.contains(e.target as Node)) setShareOpen(false);
      if (saveRef.current && !saveRef.current.contains(e.target as Node)) setSaveOpen(false);
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  const handleCopyLink = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard?.writeText(url);
    setShareOpen(false);
    setSaveOpen(false);
  };

  const handleSharePlatform = (platform: (typeof SHARE_PLATFORMS)[number]["id"]) => {
    window.open(getShareUrl(platform, url, title), "_blank", "noopener,noreferrer,width=600,height=400");
    setShareOpen(false);
  };

  const handleSavePlatform = (platform: (typeof SAVE_PLATFORMS)[number]["id"]) => {
    window.open(getSaveUrl(platform, url, title), "_blank", "noopener,noreferrer,width=600,height=400");
    setSaveOpen(false);
  };

  return (
    <>
      <div className="relative flex flex-col items-center" ref={shareRef}>
        <button
          type="button"
          className={btnClass}
          onClick={(e) => {
            e.stopPropagation();
            setShareOpen((o) => !o);
            setSaveOpen(false);
          }}
          aria-label={t("share.share")}
        >
          <Share2 size={iconSize} fill="white" />
          {showLabels && <span className="text-xs">{t("share.share")}</span>}
        </button>
        {shareOpen && (
          <div className={dropdownClass} onClick={(e) => e.stopPropagation()}>
            {SHARE_PLATFORMS.map((p) => (
              <button
                key={p.id}
                type="button"
                className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-white/90 hover:bg-white/10 transition-colors"
                onClick={() => handleSharePlatform(p.id)}
              >
                <ExternalLink size={14} className="text-white/60" />
                {p.name}
              </button>
            ))}
            <button
              type="button"
              className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-white/90 hover:bg-white/10 transition-colors border-t border-white/10"
              onClick={handleCopyLink}
            >
              <Copy size={14} className="text-white/60" />
              {t("share.copyLink")}
            </button>
          </div>
        )}
      </div>

      <div className="relative flex flex-col items-center" ref={saveRef}>
        <button
          type="button"
          className={btnClass}
          onClick={(e) => {
            e.stopPropagation();
            setSaveOpen((o) => !o);
            setShareOpen(false);
          }}
          aria-label={t("share.save")}
        >
          <Bookmark size={iconSize} fill="white" />
          {showLabels && <span className="text-xs">{t("share.save")}</span>}
        </button>
        {saveOpen && (
          <div className={dropdownClass} onClick={(e) => e.stopPropagation()}>
            {SAVE_PLATFORMS.map((p) => (
              <button
                key={p.id}
                type="button"
                className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-white/90 hover:bg-white/10 transition-colors"
                onClick={() => handleSavePlatform(p.id)}
              >
                <ExternalLink size={14} className="text-white/60" />
                {p.name}
              </button>
            ))}
            <button
              type="button"
              className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-white/90 hover:bg-white/10 transition-colors border-t border-white/10"
              onClick={handleCopyLink}
            >
              <Copy size={14} className="text-white/60" />
              {t("share.copyLink")}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
