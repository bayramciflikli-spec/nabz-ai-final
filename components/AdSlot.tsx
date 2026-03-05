"use client";

import { useEffect, useRef, useState } from "react";
import { getAdSlotForCountry } from "@/lib/adConfig";

/**
 * Google AdSense reklam alanı - Ülkeye göre hedeflenmiş
 * .env.local: NEXT_PUBLIC_ADSENSE_CLIENT_ID=ca-pub-xxxxxxxxxx
 *
 * Bölgeye özel slot: NEXT_PUBLIC_ADSENSE_SLOT_TR, NEXT_PUBLIC_ADSENSE_SLOT_DE vb.
 * AdSense zaten IP ile otomatik hedefleme yapar; bölge slotları opsiyoneldir.
 */
interface AdSlotProps {
  /** Ad slot formatı: display, in-article, in-feed vb. */
  format?: "auto" | "rectangle" | "horizontal" | "vertical";
  /** Opsiyonel slot ID (varsayılan, ülke slotu yoksa kullanılır) */
  slotId?: string;
  /** Kanal sahibi - monetize değilse reklam gösterilmez */
  channelUserId?: string;
  /** Monetize durumu (server'dan gelebilir) */
  isMonetized?: boolean;
  className?: string;
}

export function AdSlot({
  format = "auto",
  slotId: defaultSlotId,
  channelUserId,
  isMonetized = false,
  className = "",
}: AdSlotProps) {
  const adRef = useRef<HTMLModElement>(null);
  const [country, setCountry] = useState<string | null>(null);
  const clientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;

  useEffect(() => {
    fetch("/api/locale")
      .then((r) => r.json())
      .then((d) => setCountry(d?.country ?? null))
      .catch(() => setCountry(null));
  }, []);

  const slotId = getAdSlotForCountry(country, defaultSlotId);

  useEffect(() => {
    if (!clientId || !isMonetized) return;
    if (channelUserId && !isMonetized) return;

    try {
      ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
    } catch (e) {
      console.warn("AdSense yükleme hatası:", e);
    }
  }, [clientId, isMonetized, channelUserId, slotId]);

  if (!clientId) {
    return (
      <div
        className={`flex items-center justify-center bg-white/5 border border-white/10 rounded-lg min-h-[90px] ${className}`}
        aria-hidden
      >
        <span className="text-xs text-white/40">Reklam alanı</span>
      </div>
    );
  }

  if (channelUserId && !isMonetized) {
    return null;
  }

  return (
    <div className={`overflow-hidden rounded-lg ${className}`}>
      <ins
        key={slotId}
        ref={adRef}
        className="adsbygoogle"
        style={{ display: "block", minHeight: 90 }}
        data-ad-client={clientId}
        data-ad-slot={slotId}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}
