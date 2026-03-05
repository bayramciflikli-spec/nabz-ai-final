import { useState, type ReactNode } from "react";
import Link from "next/link";
import { useLocale } from "@/components/LocaleProvider";

interface VideoCardProps {
  footer?: ReactNode;
  video: {
    id: string;
    title: string;
    thumbnail?: string;
    previewUrl?: string;
    imageUrl?: string;
    videoUrl?: string;
    resolution?: string;
    authorAvatar?: string;
    authorImage?: string;
    authorName?: string;
    tool?: string;
    category?: string;
    views?: string;
    viewCount?: string;
    likesCount?: number;
    tags?: string[];
  };
}

export const VideoCard = ({ video, footer }: VideoCardProps) => {
  const { t } = useLocale();
  const [isHovered, setIsHovered] = useState(false);

  const thumbnail = video.thumbnail || video.imageUrl || video.videoUrl || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800";
  const previewUrl = video.previewUrl || video.videoUrl;
  const authorAvatar = video.authorAvatar || video.authorImage || "/default-avatar.png";
  const authorName = video.authorName || video.tool || video.category || "AI";
  const views = video.views || video.viewCount || (video.likesCount != null ? `${video.likesCount}` : "2.4K");
  const resolution = video.resolution || (video.videoUrl ? "HD" : "AI");
  const tags = video.tags || [];

  const cardContent = (
    <Link
      href={`/project/${video.id}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative group cursor-pointer block"
    >
      {/* CANLI ÇERÇEVE (Hover efekti) */}
      <div
        className={`absolute -inset-[2px] rounded-[2rem] bg-gradient-to-tr from-purple-600 via-pink-500 to-green-400 opacity-0 transition-opacity duration-500 blur-[2px] ${isHovered ? "opacity-100" : ""}`}
      />

      {/* ANA KART İÇERİĞİ */}
      <div className="relative bg-cyber-black rounded-[2rem] p-2 overflow-hidden border border-white/5 shadow-2xl">
        {/* VİDEO ALANI */}
        <div className="relative aspect-video rounded-[1.6rem] overflow-hidden bg-[#1a1a1a]">
          {isHovered && previewUrl ? (
            <video
              src={previewUrl}
              autoPlay
              muted
              loop
              playsInline
              className="w-full h-full object-cover transition-transform duration-700 scale-110"
            />
          ) : (
            <img
              src={thumbnail}
              alt={video.title}
              className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
            />
          )}

          {/* SOL ÜSTTEKİ AI KATMANI */}
          <div className="absolute top-3 left-3 flex gap-2">
            <span className="bg-black/60 backdrop-blur-md text-[10px] font-bold px-3 py-1 rounded-full border border-white/10 text-white uppercase tracking-widest">
              {resolution}
            </span>
            {isHovered && (
              <span className="bg-green-500/20 backdrop-blur-md text-[10px] font-bold px-3 py-1 rounded-full border border-green-500/30 text-green-400 animate-pulse">
                {t("video.aiAnalyzing")}
              </span>
            )}
          </div>
        </div>

        {/* BİLGİ ALANI */}
        <div className="mt-4 px-3 pb-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full border-2 border-purple-500 p-[2px]">
              <img src={authorAvatar} alt={authorName} className="w-full h-full rounded-full object-cover" />
            </div>
            <div>
              <h3 className="font-bold text-white text-md line-clamp-1 group-hover:text-green-400 transition-colors">
                {video.title}
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                {authorName} • {views} {t("video.views")}
              </p>
            </div>
          </div>

          {/* AKILLI ETİKETLER (Sadece Hover'da çıkar) */}
          <div
            className={`mt-3 flex flex-wrap gap-2 transition-all duration-500 ${isHovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}
          >
            {tags.map((tag) => (
              <span key={tag} className="text-[9px] font-medium text-gray-400 bg-white/5 px-2 py-1 rounded-md">
                #{tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Link>
  );

  if (footer) {
    return (
      <div className="flex flex-col gap-3">
        {cardContent}
        <div className="px-1">{footer}</div>
      </div>
    );
  }

  return cardContent;
};
