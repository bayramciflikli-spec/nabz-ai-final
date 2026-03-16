"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";

/**
 * Hata sonrası "Tekrar dene" – full reload yerine Next.js router.refresh() kullanır (sonsuz döngüyü önler).
 */
export function ErrorFallback() {
  const router = useRouter();

  const handleRetry = () => {
    try {
      router.refresh();
    } catch (e) {
      console.error("[ErrorFallback] refresh failed:", e);
      window.location.href = "/";
    }
  };

  return (
    <div className="flex flex-wrap gap-3 justify-center">
      <button
        type="button"
        onClick={handleRetry}
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
  );
}
