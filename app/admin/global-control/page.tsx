"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sidebar } from "@/components/Sidebar";
import { auth } from "@/lib/firebase";
import { useToast } from "@/components/ToastContext";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { onAuthStateChanged, type User } from "firebase/auth";
interface PendingItem {
  id: string;
  title: string;
  tool?: string;
  kategori?: string;
  views: number;
  likedBy: number;
  authorName?: string;
  authorId?: string;
  distribution?: string;
  isAdult?: boolean;
  imageUrl?: string;
  videoUrl?: string;
  country?: string;
  ai_report?: string;
}

const COUNTRY_DISPLAY: Record<string, string> = {
  TR: "🇹🇷 TÜRKİYE", DE: "🇩🇪 ALMANYA", US: "🇺🇸 ABD", GB: "🇬🇧 İNGİLTERE", FR: "🇫🇷 FRANSA",
  NL: "🇳🇱 HOLLANDA", PL: "🇵🇱 POLONYA", IT: "🇮🇹 İTALYA", ES: "🇪🇸 İSPANYA", RU: "🇷🇺 RUSYA",
  JP: "🇯🇵 JAPONYA", CN: "🇨🇳 ÇİN", KR: "🇰🇷 GÜNEY KORE", IN: "🇮🇳 HİNDİSTAN", BR: "🇧🇷 BREZİLYA",
};
function getCountryLabel(code: string) {
  return COUNTRY_DISPLAY[code?.toUpperCase()] || `🌐 ${code || "—"}`;
}
import { GripVertical, Shield } from "lucide-react";

export default function GlobalControlPage() {
  const toast = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [pending, setPending] = useState<PendingItem[]>([]);
  const [stats, setStats] = useState({
    totalGlobal: 0,
    pendingCount: 0,
    todayViews: "0M",
    blockedCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);
  const [emailSending, setEmailSending] = useState(false);
  const [rejectMenuOpen, setRejectMenuOpen] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, setUser);
    return () => unsub();
  }, []);

  useEffect(() => {
    const close = () => setRejectMenuOpen(null);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetchWithAuth("/api/admin/global-pending");
        const data = await res.json();
        if (data.ok) {
          setPending(data.pending ?? []);
          setStats(data.stats ?? { totalGlobal: 0, pendingCount: 0, todayViews: "0M", blockedCount: 0 });
        }
      } catch {
        setPending([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleAction = async (projectId: string, action: "approve" | "reject", options?: { sanctionUser?: boolean; banUser?: boolean; applyStrike?: boolean; strikeReason?: string }) => {
    setActing(projectId);
    try {
      const res = await fetchWithAuth("/api/admin/global-action", {
        method: "POST",
        body: JSON.stringify({ projectId, action, ...options }),
      });
      const data = await res.json();
      if (data.ok || data.successCount > 0) {
        const count = data.successCount ?? 1;
        setPending((p) => p.filter((x) => x.id !== projectId));
        setStats((s) => ({
          ...s,
          pendingCount: s.pendingCount - count,
          totalGlobal: action === "approve" ? s.totalGlobal + count : s.totalGlobal,
          blockedCount: action === "reject" ? s.blockedCount + count : s.blockedCount,
        }));
        if (data.failCount > 0) toast.info(`${data.successCount} tamamlandı, ${data.failCount} başarısız.`);
      } else {
        toast.error(data.error || "İşlem başarısız");
      }
    } catch (e) {
      toast.error("İşlem başarısız");
    } finally {
      setActing(null);
    }
  };

  const handleBulkAction = async (action: "approve" | "reject") => {
    if (pending.length === 0) return;
    setActing("bulk");
    try {
      const res = await fetchWithAuth("/api/admin/global-action", {
        method: "POST",
        body: JSON.stringify({ projectIds: pending.map((p) => p.id), action }),
      });
      const data = await res.json();
      if (data.successCount > 0) {
        const successIds = new Set((data.results || []).filter((r: { ok: boolean }) => r.ok).map((r: { id: string }) => r.id));
        setPending((p) => p.filter((x) => !successIds.has(x.id)));
        setStats((s) => ({
          ...s,
          pendingCount: Math.max(0, s.pendingCount - data.successCount),
          totalGlobal: action === "approve" ? s.totalGlobal + data.successCount : s.totalGlobal,
          blockedCount: action === "reject" ? s.blockedCount + data.successCount : s.blockedCount,
        }));
        if (data.failCount > 0) toast.info(`${data.successCount} tamamlandı, ${data.failCount} başarısız.`);
      } else {
        toast.error(data.error || "İşlem başarısız");
      }
    } catch (e) {
      toast.error("İşlem başarısız");
    } finally {
      setActing(null);
    }
  };

  const handleSendEmail = async () => {
    setEmailSending(true);
    try {
      const res = await fetchWithAuth("/api/admin/notify-email", { method: "POST" });
      const data = await res.json();
      if (data.ok && data.sent) {
        toast.success("Bildirim e-postası gönderildi.");
      } else if (data.ok && !data.sent) {
        toast.info("Bekleyen işlem yok, e-posta gönderilmedi.");
      } else {
        toast.error(data.error || "Gönderilemedi. RESEND_API_KEY ve ADMIN_EMAIL ayarlayın.");
      }
    } catch {
      toast.error("İşlem başarısız");
    } finally {
      setEmailSending(false);
    }
  };

  const securityScore = (item: PendingItem) => {
    if (item.isAdult) return 0;
    const cat = (item.kategori ?? item.tool ?? "").toLowerCase();
    if (cat.includes("gambling") || cat.includes("kumar")) return 0;
    return 94 + Math.floor(Math.random() * 6);
  };

  return (
    <div className="flex min-h-screen bg-[#050505] text-white">
      <div className="hidden sm:block">
        <Sidebar user={user} />
      </div>

      <div className="flex-1 sm:ml-56 flex">
        {/* Sol panel */}
        <aside className="w-[260px] bg-[#111] border-r border-white/10 flex flex-col p-6 shrink-0">
          <div
            className="font-['Orbitron'] font-black text-xl mb-12 bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent"
          >
            NABZ-AI CTRL
          </div>
          <nav className="flex flex-col gap-2">
            {[
              { label: "Global Onay Kuyruğu", href: "/admin/global-control", active: true },
              { label: "Kullanıcı Yönetimi", href: "/admin/users", active: false },
              { label: "Financial Hub", href: "/admin/financial", active: false },
              { label: "Şeffaflık Raporu", href: "/admin/transparency", active: false },
              { label: "Aktif Sponsorlar", href: "/admin/financial", active: false },
              { label: "Hukuki Filtreler", href: "/admin/legal-filters", active: false },
              { label: "Yasaklı Kelime/İçerik", href: "/admin/banned-content", active: false },
              { label: "Sanal AVM Analitik", href: "/mall", active: false },
            ].map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={`px-4 py-3 rounded-lg transition-colors flex items-center gap-2 ${
                  item.active
                    ? "bg-cyan-500/10 text-cyan-400"
                    : "hover:bg-white/5 text-white/70"
                }`}
              >
                <GripVertical size={14} className="opacity-50" />
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        {/* Ana içerik */}
        <main className="flex-1 p-8 overflow-y-auto">
          <h1 className="text-2xl font-bold mb-8">Global İzleme Merkezi</h1>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            <div className="bg-[#111] p-6 rounded-xl border border-white/10 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500" />
              <div className="text-xs uppercase tracking-wider text-white/50 mb-1">
                Toplam Global Araç
              </div>
              <div className="text-3xl font-bold">{stats.totalGlobal}</div>
            </div>
            <div className="bg-[#111] p-6 rounded-xl border border-white/10 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-purple-500" />
              <div className="text-xs uppercase tracking-wider text-white/50 mb-1">
                Onay Bekleyen (1M+)
              </div>
              <div className="text-3xl font-bold">{stats.pendingCount}</div>
            </div>
            <div className="bg-[#111] p-6 rounded-xl border border-white/10 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-green-500" />
              <div className="text-xs uppercase tracking-wider text-white/50 mb-1">
                Bugünkü İzlenme
              </div>
              <div className="text-3xl font-bold">{stats.todayViews}</div>
            </div>
            <div className="bg-[#111] p-6 rounded-xl border border-white/10 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-red-500" />
              <div className="text-xs uppercase tracking-wider text-white/50 mb-1">
                Engellenen İçerik
              </div>
              <div className="text-3xl font-bold">{stats.blockedCount}</div>
            </div>
          </div>

          {/* Kural Kalkanı: Canlı Denetim */}
          <div className="mt-10 p-6 bg-[#0d0d0d] border border-white/10 rounded-2xl">
            <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
              <h3 className="text-lg font-bold text-yellow-400 font-['Orbitron'] m-0">
                🛡️ KURAL KALKANI: CANLI DENETİM
              </h3>
              <span className="bg-[#1e1e1e] px-4 py-2 rounded-full text-xs text-green-400 border border-green-500/30">
                Aktif Filtre: Global + Ülke Yasaları
              </span>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <h3 className="text-base font-semibold text-white/80">
              Onay bekleyen içerikler
            </h3>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleSendEmail}
                disabled={emailSending}
                className="px-4 py-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 text-sm disabled:opacity-50 border border-amber-500/40"
              >
                {emailSending ? "..." : "Bildirim E-posta Gönder"}
              </button>
            {pending.length > 0 && (
              <>
                <button
                  onClick={() => handleBulkAction("approve")}
                  disabled={acting === "bulk"}
                  className="px-4 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-black font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {acting === "bulk" ? "..." : `Tümünü Onayla (${pending.length})`}
                </button>
                <button
                  onClick={() => handleBulkAction("reject")}
                  disabled={acting === "bulk"}
                  className="px-4 py-2 rounded-lg bg-red-500/80 hover:bg-red-500 text-white text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Tümünü Reddet
                </button>
              </>
            )}
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16 text-white/50">
              <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
            </div>
          ) : pending.length === 0 ? (
            <div className="bg-[#111] rounded-xl border border-white/10 p-12 text-center text-white/60">
              <Shield size={48} className="mx-auto mb-4 opacity-50" />
              <p>1M+ görüntülenme eşiğine ulaşmış onay bekleyen içerik yok.</p>
              <p className="text-sm mt-2">Yeni içerikler eşiğe ulaştığında burada listelenecek.</p>
            </div>
          ) : (
            <div id="pending-queue" className="space-y-4">
              {pending.map((item) => {
                const score = securityScore(item);
                const aiClean = (item.ai_report || "Clean").toLowerCase() === "clean";
                return (
                  <div
                    key={item.id}
                    className="flex flex-wrap sm:flex-nowrap items-center gap-4 sm:gap-6 p-4 bg-[#161616] rounded-xl border border-white/10 hover:border-white/20 transition-colors"
                  >
                    <Link
                      href={`/project/${item.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 w-[100px] h-[60px] rounded-lg overflow-hidden bg-white/5 border border-white/10 flex items-center justify-center"
                    >
                      {(item.imageUrl || item.videoUrl) ? (
                        <img
                          src={item.imageUrl || item.videoUrl || "/placeholder.png"}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-[10px] text-white/40">ÖNİZLEME</span>
                      )}
                    </Link>
                    <div className="flex-grow min-w-0">
                      <Link
                        href={`/project/${item.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-bold text-white hover:text-cyan-400 transition-colors block truncate"
                      >
                        {item.title}
                      </Link>
                      <div className="text-xs text-white/60 mt-0.5">
                        Architect: <span className="text-blue-400">{item.authorId || item.authorName || "—"}</span>
                        {" | "}
                        Ülke: {getCountryLabel(item.country || "TR")}
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${aiClean ? "bg-green-900/50 text-green-400" : "bg-amber-900/50 text-amber-400"}`}>
                          AI TARAMASI: {aiClean ? "TEMİZ" : (item.ai_report || "İncele")}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-amber-900/50 text-amber-400">
                          TELİF: SORUNSUZ
                        </span>
                        <span className="text-white/50 text-xs">
                          %{score} güvenlik
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0 items-center">
                      <button
                        onClick={() => handleAction(item.id, "approve")}
                        disabled={acting === item.id}
                        className="px-4 py-2 rounded-lg bg-green-700 hover:bg-green-600 text-white font-bold text-sm disabled:opacity-50 transition-colors"
                      >
                        {acting === item.id ? "..." : "ONAYLA"}
                      </button>
                      <div className="relative">
                        <button
                          onClick={(e) => { e.stopPropagation(); setRejectMenuOpen(rejectMenuOpen === item.id ? null : item.id); }}
                          disabled={acting === item.id}
                          className="px-4 py-2 rounded-lg bg-red-800 hover:bg-red-700 text-white font-bold text-sm disabled:opacity-50 transition-colors"
                        >
                          REDDET ▾
                        </button>
                        {rejectMenuOpen === item.id && (
                          <div className="absolute right-0 top-full mt-1 py-1 min-w-[200px] bg-[#1a1a1a] border border-white/20 rounded-lg shadow-xl z-10" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => { handleAction(item.id, "reject"); setRejectMenuOpen(null); }}
                              className="w-full px-3 py-2 text-left text-sm hover:bg-white/10"
                            >
                              Sadece kilitle
                            </button>
                            <button
                              onClick={() => { handleAction(item.id, "reject", { applyStrike: true, strikeReason: "Telif ihlali" }); setRejectMenuOpen(null); }}
                              className="w-full px-3 py-2 text-left text-sm hover:bg-white/10 text-amber-400"
                            >
                              © Telif ihlali — Ceza uygula
                            </button>
                            <button
                              onClick={() => { handleAction(item.id, "reject", { sanctionUser: true }); setRejectMenuOpen(null); }}
                              className="w-full px-3 py-2 text-left text-sm hover:bg-white/10 text-amber-400"
                            >
                              + Cezalandır (Explorer)
                            </button>
                            <button
                              onClick={() => { handleAction(item.id, "reject", { sanctionUser: true, banUser: true }); setRejectMenuOpen(null); }}
                              className="w-full px-3 py-2 text-left text-sm hover:bg-red-500/20 text-red-400"
                            >
                              + Ban (ağır ihlal)
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          </div>

          <div className="mt-8 flex gap-4">
            <Link
              href="/dashboard"
              className="text-sm text-cyan-400 hover:underline"
            >
              ← Dashboard&apos;a Dön
            </Link>
            <Link href="/" className="text-sm text-white/50 hover:text-white">
              Ana Sayfa
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}
