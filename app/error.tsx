"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[App Error] message:", error?.message, "digest:", error?.digest, "stack:", error?.stack, error);
  }, [error]);

  const handleReset = () => {
    try {
      reset();
    } catch (e) {
      console.error("[App Error] reset failed:", e);
      window.location.href = "/";
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050505] text-white p-8">
      <div className="text-center max-w-md">
        <h1 className="text-xl font-bold mb-4">Bir hata oluştu</h1>
        <p className="text-white/60 mb-6">
          Sayfayı yenileyerek veya ana sayfaya dönerek tekrar deneyin.
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <button
            type="button"
            onClick={handleReset}
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
        </div>
      </div>
    </div>
  );
}
