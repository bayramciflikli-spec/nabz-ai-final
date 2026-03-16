"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

/**
 * Root ErrorBoundary için: /admin iken farklı mesaj gösterir (giriş yapıp tekrar dene).
 */
export function PathAwareErrorFallback() {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");

  const handleRetry = () => {
    try {
      if (typeof window !== "undefined") window.location.href = isAdmin ? "/admin" : "/";
    } catch {
      window.location.href = "/";
    }
  };

  if (isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505] text-white p-8">
        <div className="text-center max-w-md">
          <h1 className="text-xl font-bold mb-4">Kontrol Kulesi açılamadı</h1>
          <p className="text-white/60 mb-6">
            Ana sayfaya gidip Gmail ile giriş yaptıktan sonra bu sayfayı yenileyin veya aşağıdaki Admin linkine tıklayın.
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
              onClick={handleRetry}
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
      </div>
    </div>
  );
}
