"use client";

/**
 * Root segment hatalarını yakalar (layout hatası vb.).
 * Kendi html/body kullandığı için layout'tan bağımsız çalışır.
 * Gerçek hata konsola yazılır; sayfa patlamaz.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // Gerçek hatayı her zaman logla (Firebase / dosya yolu / vb. ayırt etmek için)
  if (typeof window !== "undefined") {
    console.error("[GlobalError] digest:", error?.digest, "message:", error?.message, "stack:", error?.stack, error);
  }

  const handleReset = () => {
    try {
      reset();
    } catch (e) {
      console.error("[GlobalError] reset failed:", e);
      window.location.href = "/";
    }
  };

  return (
    <html lang="tr">
      <body className="antialiased min-h-screen bg-[#050505] text-white flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <h1 className="text-xl font-bold mb-4">Kritik bir hata oluştu</h1>
          <p className="text-white/60 mb-6">
            Uygulama yüklenirken bir sorun oluştu. Sayfayı yenileyerek veya ana sayfaya dönerek tekrar deneyin.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <button
              type="button"
              onClick={handleReset}
              className="px-6 py-2 bg-cyan-600 rounded-lg hover:bg-cyan-500 transition-colors"
            >
              Tekrar Dene
            </button>
            <a
              href="/"
              className="px-6 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors inline-block"
            >
              Ana Sayfa
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
