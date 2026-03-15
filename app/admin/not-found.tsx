import Link from "next/link";

export default function AdminNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white p-8">
      <div className="text-center max-w-md">
        <h1 className="text-4xl font-bold mb-2">404</h1>
        <p className="text-white/60 mb-6">Bu Kontrol Kulesi sayfası bulunamadı.</p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Link
            href="/admin"
            className="inline-block px-6 py-3 bg-cyan-600 rounded-lg hover:bg-cyan-500 transition-colors"
          >
            Kontrol Kulesi
          </Link>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
          >
            Ana Sayfa
          </Link>
        </div>
      </div>
    </div>
  );
}
