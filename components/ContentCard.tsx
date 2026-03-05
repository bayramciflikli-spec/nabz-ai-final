"use client";

import Link from "next/link";
import { ThumbsUp, ThumbsDown, MessageCircle } from "lucide-react";
import { useLocale } from "@/components/LocaleProvider";

interface ContentCardProps {
  id: string | number;
  title: string;
  channel: string;
  variant?: "shorts" | "wide";
  likesCount?: number;
  dislikesCount?: number;
  commentsCount?: number;
  imageUrl?: string;
  progressPct?: number | null;
}

export function ContentCard({
  id,
  title,
  channel,
  variant = "wide",
  likesCount = 0,
  dislikesCount = 0,
  commentsCount = 0,
  imageUrl,
  progressPct,
}: ContentCardProps) {
  const { t } = useLocale();
  const isShorts = variant === "shorts";
  const cardWidth = isShorts ? "w-36 min-w-36 max-w-36 sm:w-44 sm:min-w-44 sm:max-w-44" : "w-56 min-w-56 max-w-56 sm:w-64 sm:min-w-64 sm:max-w-64";
  const aspectClass = isShorts ? "aspect-[9/16]" : "aspect-video";

  const href = isShorts ? `/shorts/${id}` : `/project/${id}`;
  return (
    <Link
      href={href}
      className={`group flex-shrink-0 ${cardWidth} flex flex-col transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]`}
    >
      <div
        className={`w-full ${aspectClass} bg-white/5 border border-white/10 rounded-lg mb-2 group-hover:border-red-500/30 transition-all duration-200 flex-shrink-0 overflow-hidden relative`}
      >
        {imageUrl ? (
          <img src={imageUrl} alt={title} className="w-full h-full object-cover" />
        ) : null}
        {progressPct != null && (
          <div className="absolute bottom-0 left-0 right-0 h-0.5 sm:h-1 bg-white/20">
            <div
              className="h-full bg-red-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        )}
      </div>
      <div className="min-h-[2.5rem] flex flex-col justify-end">
        <p className="font-semibold text-sm truncate">{title}</p>
        <p className="text-xs text-gray-500 mt-0.5 truncate">{channel}</p>
        <div className="flex items-center gap-3 mt-1.5 text-xs text-white/60">
          <span className="flex items-center gap-1" title={`${likesCount} ${t("project.like")}`}>
            <ThumbsUp size={12} />
            {likesCount}
          </span>
          <span className="flex items-center gap-1" title={t("project.dislike")}>
            <ThumbsDown size={12} />
            {dislikesCount}
          </span>
          <span className="flex items-center gap-1" title={`${commentsCount} ${t("project.comments")}`}>
            <MessageCircle size={12} />
            {commentsCount}
          </span>
        </div>
      </div>
    </Link>
  );
}
