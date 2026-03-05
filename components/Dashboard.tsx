"use client";

import { HomePage } from "@/components/HomePage";

/**
 * Ana ekran (Dashboard) – yetki bypass ile doğrudan gösterilir.
 * Güvenlik kontrolleri sonra adım adım eklenebilir.
 */
export default function Dashboard({
  adminUid,
  adminEmail,
}: {
  adminUid: string;
  adminEmail: string;
}) {
  return (
    <div className="emergency-bypass-wrapper min-h-screen">
      {/* Kurucu bypass aktif – sadece bilgi amaçlı, ekranı karartmaz */}
      <div className="fixed top-0 left-0 right-0 z-[100] bg-amber-500/20 border-b border-amber-500/40 px-3 py-1.5 text-center text-xs text-amber-200">
        Kurucu bypass aktif • {adminEmail} • Görsel önce, güvenlik sonra
      </div>
      <div className="pt-8">
        <HomePage />
      </div>
    </div>
  );
}
