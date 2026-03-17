"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { auth } from "@/lib/firebase";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { onAuthStateChanged, type User } from "firebase/auth";
import { CheckCircle, XCircle, Monitor } from "lucide-react";

interface PendingItem {
  id: string;
  title: string;
  authorName?: string;
  authorId?: string;
  status: string;
}

interface PendingRaw {
  id?: string;
  title?: string;
  authorName?: string;
  authorId?: string;
}

export default function AdminPage() {
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState({
    userCount: 0,
    pendingContent: 0,
    totalRevenue: 0,
  });
  const [pending, setPending] = useState<PendingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setInstalled(true);
    }
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === "accepted") setInstalled(true);
    setInstallPrompt(null);
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, setUser);
    return () => unsub();
  }, []);

  const loadData = async (showLoading = true) => {
    if (!user) return;
    if (showLoading) setLoading(true);
    try {
      const [statsRes, pendingRes] = await Promise.all([
        fetchWithAuth("/api/admin/stats"),
        fetchWithAuth("/api/admin/global-pending"),
      ]);
      const statsData = await statsRes.json().catch(() => ({}));
      const pendingData = await pendingRes.json().catch(() => ({}));
      if (statsData.ok) {
        setStats(statsData.stats ?? { userCount: 0, pendingContent: 0, totalRevenue: 0 });
      }
      if (pendingData.ok) {
        const items = (pendingData.pending ?? []).slice(0, 10).map((p: PendingRaw) => ({
          id: p.id ?? "",
          title: p.title ?? "",
          authorName: p.authorName,
          authorId: p.authorId,
          status: "Beklemede",
        }));
        setPending(items);
      }
    } catch (err) {
      console.error("[Admin] Dashboard yükleme hatası:", err);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  // Bilgisayar ve mobilde aynı anda görünsün: sekme görünürken her 20 saniyede veriyi yenile
  useEffect(() => {
    if (!user) return;
    const SYNC_INTERVAL_MS = 20000;
    const t = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        loadData(false);
      }
    }, SYNC_INTERVAL_MS);
    return () => clearInterval(t);
  }, [user]);

  const displayName = user?.displayName || "Kurucu";

  return (
    <div className="p-4 sm:p-6 lg:p-8">
          <header className="flex justify-between items-center border-b border-white/10 pb-4 mb-6">
            <h2 className="text-2xl font-bold">
              <span className="text-green-400">NABZ-AI</span>{" "}
              <span className="text-white/70 font-light">| Kontrol Kulesi</span>
            </h2>
            <div className="flex items-center gap-4">
            {!installed && (
              installPrompt ? (
                <button
                  type="button"
                  onClick={handleInstall}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500/20 border border-green-500/40 text-green-400 hover:bg-green-500/30 transition-colors text-sm"
                >
                  <Monitor size={18} />
                  Masaüstüne Ekle
                </button>
              ) : (
                <span className="text-xs text-white/40" title="Chrome/Edge: Adres çubuğundaki ⊕ veya menüden Uygulamayı yükle">
                  <Monitor size={18} className="inline align-middle mr-1" />
                  Masaüstüne eklemek için tarayıcı menüsünden &quot;Uygulamayı yükle&quot; seçin
                </span>
              )
            )}
            <span className="text-white/60">Hoş geldin, <span className="text-green-400 font-semibold">{displayName}</span></span>
          </div>
          </header>

          {/* İstatistik kartları */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-[#1a1a1a] p-6 rounded-lg border-l-4 border-blue-500">
              <p className="text-white/50 text-xs uppercase mb-2">TOPLAM ARCHITECT</p>
              <h3 className="text-3xl font-bold">
                {loading ? "--" : stats.userCount.toLocaleString()}
              </h3>
            </div>
            <div className="bg-[#1a1a1a] p-6 rounded-lg border-l-4 border-purple-500">
              <p className="text-white/50 text-xs uppercase mb-2">ONAY BEKLEYEN İÇERİK</p>
              <h3 className="text-3xl font-bold">
                {loading ? "--" : stats.pendingContent}
              </h3>
            </div>
            <div className="bg-[#1a1a1a] p-6 rounded-lg border-l-4 border-green-500">
              <p className="text-white/50 text-xs uppercase mb-2">TOPLAM REKLAM GELİRİ</p>
              <h3 className="text-3xl font-bold">
                $ {loading ? "0.00" : stats.totalRevenue.toFixed(2)}
              </h3>
            </div>
          </div>

          {/* Onay bekleyenler tablosu */}
          <section className="mt-8">
            <h4 className="text-yellow-400 text-lg font-semibold mb-4 flex items-center gap-2">
              <span>⚠️</span> Kural Kalkanı: Onay Bekleyenler
            </h4>
            <div className="bg-[#111] rounded-lg overflow-hidden border border-white/10">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-left">
                    <th className="p-4 text-white/70 font-medium">İçerik</th>
                    <th className="p-4 text-white/70 font-medium">Yükleyen</th>
                    <th className="p-4 text-white/70 font-medium">Durum</th>
                    <th className="p-4 text-white/70 font-medium">Aksiyon</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-white/50">
                        Yükleniyor...
                      </td>
                    </tr>
                  ) : pending.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-white/50">
                        Onay bekleyen içerik yok
                      </td>
                    </tr>
                  ) : (
                    pending.map((item) => (
                      <tr key={item.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="p-4">
                          <Link
                            href={`/project/${item.id}`}
                            target="_blank"
                            className="text-white hover:text-cyan-400 transition-colors"
                          >
                            {item.title}
                          </Link>
                        </td>
                        <td className="p-4 text-white/70">{item.authorName || "Bilinmiyor"}</td>
                        <td className="p-4">
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-400 border border-yellow-500/30">
                            {item.status}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            <Link
                              href={`/admin/global-control`}
                              className="px-3 py-1.5 rounded-lg bg-green-500 hover:bg-green-600 text-black font-semibold text-sm transition-colors flex items-center gap-1"
                            >
                              <CheckCircle size={14} />
                              Onayla
                            </Link>
                            <Link
                              href={`/admin/global-control`}
                              className="px-3 py-1.5 rounded-lg bg-red-500/80 hover:bg-red-500 text-white text-sm transition-colors flex items-center gap-1"
                            >
                              <XCircle size={14} />
                              Reddet
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {pending.length > 0 && (
              <div className="mt-4 text-right">
                <Link
                  href="/admin/global-control"
                  className="text-cyan-400 hover:underline text-sm"
                >
                  Tümünü gör →
                </Link>
              </div>
            )}
          </section>
    </div>
  );
}
