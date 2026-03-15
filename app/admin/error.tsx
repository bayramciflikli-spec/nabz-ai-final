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
    console.error("Admin error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white p-8">
      <div className="text-center max-w-md">
        <h1 className="text-xl font-bold mb-4">Kontrol Kulesi yüklenemedi</h1>
        <p className="text-white/60 mb-6">
          Bir hata oluştu. Önce ana sayfaya gidip giriş yaptığınızdan emin olun, sonra bu sayfayı yenileyin veya Tekrar Dene ile tekrar deneyin.
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <button
            type="button"
            onClick={() => reset()}
            className="px-6 py-2 bg-cyan-600 rounded-lg hover:bg-cyan-500 transition-colors"
          >
            Tekrar Dene
          </button>
          <Link
            href="/"
            className="px-6 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors inline-block"
          >
            Ana Sayfa
          </Link>
          <Link
            href="/admin"
            className="px-6 py-2 border border-white/20 rounded-lg hover:bg-white/10 transition-colors inline-block"
          >
            Admin&apos;i yenile
          </Link>
        </div>
      </div>
    </div>
  );
}
