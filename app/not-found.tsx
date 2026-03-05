import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050505] text-white p-8">
      <div className="text-center max-w-md">
        <h1 className="text-4xl font-bold mb-2">404</h1>
        <p className="text-white/60 mb-6">Bu sayfa bulunamadı.</p>
        <Link
          href="/"
          className="inline-block px-6 py-3 bg-cyan-600 rounded-lg hover:bg-cyan-500 transition-colors"
        >
          Ana Sayfaya Dön
        </Link>
      </div>
    </div>
  );
}
