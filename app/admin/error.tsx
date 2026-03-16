"use client";

import { useEffect } from "react";
import Link from "next/link";

/**
 * Admin segmenti hata bileşeni.
 * /admin sayfasında oluşan hatalar burada yakalanır; "missing required error components" önlenir.
 */
export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Admin Error] message:", error?.message, "digest:", error?.digest, "stack:", error?.stack, error);
  }, [error]);

  const handleReset = () => {
    try {
      reset();
    } catch (e) {
      console.error("[Admin Error] reset failed:", e);
      window.location.href = "/admin";
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white p-8">
      <div className="text-center max-w-md">
        <h1 className="text-xl font-bold mb-4">Kontrol Kulesi açılamadı</h1>
        <p className="text-white/60 mb-6">
          Ana sayfaya gidip Gmail ile giriş yaptıktan sonra Tekrar Dene veya Admin paneli linkine tıklayın.
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Link
            href="/"
            className="px-6 py-2 bg-cyan-600 rounded-lg hover:bg-cyan-500 transition-colors inline-block"
          >
            Ana sayfaya git (giriş yap)
          </Link>
          <button
            type="button"
            onClick={handleReset}
            className="px-6 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
          >
            Tekrar Dene
          </button>
          <Link
            href="/admin"
            className="px-6 py-2 border border-white/20 rounded-lg hover:bg-white/10 transition-colors inline-block"
          >
            Admin paneli
          </Link>
        </div>
      </div>
    </div>
  );
}
