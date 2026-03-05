"use client";

import { Heart, Share2, Download, RefreshCw } from "lucide-react";

export interface FinalVideoMetadata {
  title: string;
  seed?: string;
  engine?: string;
}

interface FinalVideoViewProps {
  videoUrl: string;
  metadata: FinalVideoMetadata;
  aiInsight?: string;
  onDownload?: () => void;
  onRemix?: () => void;
  onShare?: () => void;
  onLike?: () => void;
}

export const FinalVideoView = ({
  videoUrl,
  metadata,
  aiInsight = "Bu videoda ışık dengesi siberpunk atmosferine uygun olarak %94 oranında optimize edildi. Karakter hareketleri akışkanlığı için 'Flow-Vector' teknolojisi kullanıldı.",
  onDownload,
  onRemix,
  onShare,
  onLike,
}: FinalVideoViewProps) => {
  return (
    <div className="relative w-full h-full animate-in">
      {/* VİDEO OYNATICI */}
      <div className="relative group rounded-[3rem] overflow-hidden shadow-[0_20px_80px_rgba(0,0,0,0.8)] border border-white/10">
        <video
          src={videoUrl}
          controls
          autoPlay
          className="w-full aspect-video object-cover"
        />

        {/* Nabız DİJİTAL FİLİGRAN (Watermark) */}
        <div className="absolute top-6 right-8 flex items-center gap-2 opacity-50 select-none pointer-events-none">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span className="text-xs font-black text-white tracking-[0.3em]">
            Nabız GENERATED
          </span>
        </div>

        {/* VİDEO BİLGİ OVERLAY (Alt Kısım) */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
          <div className="flex justify-between items-end">
            <div>
              <h2 className="text-2xl font-black text-white">{metadata.title}</h2>
              <p className="text-sm text-gray-400 mt-2 font-mono">
                Seed: {metadata.seed ?? "—"} | Engine: {metadata.engine ?? "ULTRA-REAL"}
              </p>
            </div>
            {/* HIZLI REAKSİYONLAR */}
            <div className="flex gap-4">
              <button
                type="button"
                onClick={onLike}
                className="p-4 bg-white/10 backdrop-blur-md rounded-2xl hover:bg-white/20 transition"
              >
                <Heart className="text-white" size={20} />
              </button>
              <button
                type="button"
                onClick={onShare}
                className="p-4 bg-white/10 backdrop-blur-md rounded-2xl hover:bg-white/20 transition"
              >
                <Share2 className="text-white" size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* AKSİYON PANELİ (Videonun Altında) */}
      <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-6">
        <div className="flex flex-wrap gap-4">
          {/* İNDİR BUTONU */}
          <button
            type="button"
            onClick={onDownload}
            className="flex items-center gap-3 px-8 py-4 bg-white text-black rounded-full font-black hover:bg-green-400 transition-colors shadow-lg"
          >
            <Download size={20} />
            YÜKSEK KALİTE İNDİR
          </button>

          {/* REMIX BUTONU (Yeniden Düzenle) */}
          <button
            type="button"
            onClick={onRemix}
            className="flex items-center gap-3 px-8 py-4 bg-white/5 border border-white/10 text-white rounded-full font-black hover:bg-white/10 transition-all"
          >
            <RefreshCw size={20} className="text-purple-400" />
            REMIX (AYARLARI DEĞİŞTİR)
          </button>
        </div>

        {/* TOPLULUKLA PAYLAŞ */}
        <button
          type="button"
          onClick={onShare}
          className="px-10 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-full font-black shadow-[0_0_30px_rgba(168,85,247,0.4)] hover:scale-105 transition-transform"
        >
          DÜNYAYA DUYUR (FEED&apos;DE PAYLAŞ)
        </button>
      </div>

      {/* AI ANALİZ NOTLARI */}
      <div className="mt-8 p-6 bg-green-500/5 border border-green-500/20 rounded-[2rem]">
        <p className="text-[10px] text-green-500 font-black uppercase tracking-[0.2em] mb-2">
          AI Creator Insight
        </p>
        <p className="text-sm text-gray-400 leading-relaxed italic">
          &quot;{aiInsight}&quot;
        </p>
      </div>
    </div>
  );
};
