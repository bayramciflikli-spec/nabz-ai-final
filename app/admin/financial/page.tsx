"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { GripVertical, Check, X } from "lucide-react";
import { useToast } from "@/components/ToastContext";
import { COUNTRY_STATS } from "@/lib/financialData";
import { fetchWithAuth } from "@/lib/fetchWithAuth";

interface SponsorRow {
  id: string;
  companyName: string;
  package: string;
  globalSalesMonthly: string;
  commissionPercent: number;
  commissionAmount: string;
  paymentStatus: "completed" | "pending" | "rejected";
}

interface Summary {
  totalSponsorship: string;
  activeCompanies: number;
  pendingPayments: number;
}

export default function FinancialHubPage() {
  const toast = useToast();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [sponsorshipAmount, setSponsorshipAmount] = useState("$20,000");
  const [rulesAccepted, setRulesAccepted] = useState(false);
  const [sponsors, setSponsors] = useState<SponsorRow[]>([]);
  const [summary, setSummary] = useState<Summary>({ totalSponsorship: "$0", activeCompanies: 0, pendingPayments: 0 });
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetchWithAuth("/api/admin/sponsors");
        const data = await res.json();
        if (data.ok) {
          setSponsors(data.sponsors ?? []);
          setSummary(data.summary ?? { totalSponsorship: "$0", activeCompanies: 0, pendingPayments: 0 });
        } else {
          setSponsors([]);
        }
      } catch {
        setSponsors([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rulesAccepted) return;
    try {
      const res = await fetchWithAuth("/api/admin/sponsors", {
        method: "POST",
        body: JSON.stringify({
          companyName,
          package: `${sponsorshipAmount} (Yıllık)`,
          globalSalesMonthly: "$0",
          commissionPercent: 10,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        toast.success("Sponsor eklendi.");
        setShowOnboarding(false);
        setCompanyName("");
        setRulesAccepted(false);
        const loadRes = await fetchWithAuth("/api/admin/sponsors");
        const loadData = await loadRes.json();
        if (loadData.ok) {
          setSponsors(loadData.sponsors ?? []);
          setSummary(loadData.summary ?? summary);
        }
      } else {
        toast.error(data.error || "Eklenemedi");
      }
    } catch {
      toast.error("İşlem başarısız");
    }
  };

  const handlePaymentAction = async (row: SponsorRow, action: "approve" | "reject") => {
    setActing(row.id);
    try {
      const res = await fetchWithAuth(`/api/admin/sponsors/${row.id}`, {
        method: "PATCH",
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (data.ok) {
        setSponsors((prev) =>
          prev.map((s) =>
            s.id === row.id ? { ...s, paymentStatus: data.paymentStatus as "completed" | "rejected" } : s
          )
        );
        setSummary((s) => ({
          ...s,
          pendingPayments: Math.max(0, s.pendingPayments - (action === "approve" ? 1 : 0)),
        }));
      } else {
        toast.error(data.error || "İşlem başarısız");
      }
    } catch {
      toast.error("İşlem başarısız");
    } finally {
      setActing(null);
    }
  };

  const getEffectiveStatus = (row: SponsorRow): "completed" | "pending" | "rejected" => {
    return row.paymentStatus;
  };
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex">
      <aside className="hidden sm:flex w-[260px] bg-[#111] border-r border-white/10 flex-col p-6 shrink-0">
        <div className="font-['Orbitron'] font-black text-xl mb-12 bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
          NABZ-AI CTRL
        </div>
        <nav className="flex flex-col gap-2">
          {[
            { label: "Global Onay Kuyruğu", href: "/admin/global-control", active: false },
            { label: "Kullanıcı Yönetimi", href: "/admin/users", active: false },
            { label: "Financial Hub", href: "/admin/financial", active: true },
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
                item.active ? "bg-cyan-500/10 text-cyan-400" : "hover:bg-white/5 text-white/70"
              }`}
            >
              <GripVertical size={14} className="opacity-50" />
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="flex justify-between items-center mb-10">
          <h1 className="font-['Orbitron',sans-serif] text-2xl text-cyan-400">
            NABZ-AI // FINANCIAL HUB
          </h1>
          <div className="text-gray-500 text-sm">
            Şubat 2026 / Mali Dönem
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-[#151515] p-8 rounded-2xl border border-[#222]">
            <h4 className="text-gray-500 uppercase text-xs tracking-wider mb-4">
              Toplam Sponsorluk Geliri
            </h4>
            <span className="text-3xl font-bold text-[#ffcc00] block">
              {summary.totalSponsorship}
            </span>
            <div className="text-sm text-emerald-400 mt-2">
              {summary.activeCompanies} aktif şirket
            </div>
          </div>
          <div className="bg-[#151515] p-8 rounded-2xl border border-[#222]">
            <h4 className="text-gray-500 uppercase text-xs tracking-wider mb-4">
              Bekleyen Ödemeler
            </h4>
            <span className="text-3xl font-bold text-[#00ff88] block">
              {summary.pendingPayments}
            </span>
            <div className="text-sm text-emerald-400 mt-2">
              Onay bekleyen
            </div>
          </div>
          <div className="bg-[#151515] p-8 rounded-2xl border border-[#222]">
            <h4 className="text-gray-500 uppercase text-xs tracking-wider mb-4">
              Aktif Global Şirketler
            </h4>
            <span className="text-3xl font-bold block">
              {summary.activeCompanies}
            </span>
            <div className="w-full h-1.5 bg-[#333] rounded-full mt-4 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-400 to-blue-500 rounded-full transition-all"
                style={{ width: `${summary.activeCompanies ? Math.min(100, summary.activeCompanies * 5) : 0}%` }}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end mb-5">
          <button
            type="button"
            onClick={() => setShowOnboarding(true)}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-400 to-blue-500 text-black font-['Orbitron'] font-black cursor-pointer shadow-[0_0_20px_rgba(74,222,128,0.4)] hover:scale-105 transition-transform"
          >
            + YENİ ŞİRKET BAĞLA
          </button>
        </div>
        <h3 className="text-lg font-semibold mb-5">
          Sponsorluk ve Komisyon Detayları
        </h3>
        <div className="bg-[#151515] rounded-2xl overflow-hidden border border-[#222]">
          <table className="w-full">
            <thead>
              <tr className="bg-[#1c1c1c]">
                <th className="text-left py-5 px-5 text-gray-500 text-sm font-medium">
                  Şirket Adı
                </th>
                <th className="text-left py-5 px-5 text-gray-500 text-sm font-medium">
                  Sponsorluk Paketi
                </th>
                <th className="text-left py-5 px-5 text-gray-500 text-sm font-medium">
                  Global Satış (Aylık)
                </th>
                <th className="text-left py-5 px-5 text-gray-500 text-sm font-medium">
                  Senin Payın (%10)
                </th>
                <th className="text-left py-5 px-5 text-gray-500 text-sm font-medium">
                  Ödeme Durumu / İşlem
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-gray-500">
                    Yükleniyor...
                  </td>
                </tr>
              ) : sponsors.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-gray-500">
                    Henüz sponsor yok. &quot;+ YENİ ŞİRKET BAĞLA&quot; ile ekleyin.
                  </td>
                </tr>
              ) : sponsors.map((row) => {
                const status = getEffectiveStatus(row);
                return (
                  <tr
                    key={row.id}
                    className="border-b border-[#222] last:border-b-0"
                  >
                    <td className="py-5 px-5 font-semibold">{row.companyName}</td>
                    <td className="py-5 px-5">{row.package}</td>
                    <td className="py-5 px-5">{row.globalSalesMonthly}</td>
                    <td className="py-5 px-5">
                      <span className="inline-block px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold text-sm">
                        {row.commissionAmount}
                      </span>
                    </td>
                    <td className="py-5 px-5">
                      <div className="flex items-center gap-2">
                        <span
                          className={
                            status === "completed"
                              ? "text-emerald-400"
                              : status === "rejected"
                                ? "text-red-400"
                                : "text-[#ffcc00]"
                          }
                        >
                          {status === "completed"
                            ? "Tamamlandı"
                            : status === "rejected"
                              ? "Reddedildi"
                              : "Beklemede"}
                        </span>
                        {status === "pending" && (
                          <>
                            <button
                              type="button"
                              onClick={() => handlePaymentAction(row, "approve")}
                              disabled={acting === row.id}
                              className="p-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-400 transition-colors disabled:opacity-50"
                              title="Onayla"
                            >
                              <Check size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handlePaymentAction(row, "reject")}
                              disabled={acting === row.id}
                              className="p-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/40 text-red-400 transition-colors disabled:opacity-50"
                              title="Reddet"
                            >
                              <X size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap gap-4 mt-10">
          {COUNTRY_STATS.map((c) => (
            <div
              key={c.country}
              className="flex items-center gap-4 px-6 py-4 rounded-full bg-[#1c1c1c] border border-[#333]"
            >
              <span className="text-xl">{c.flag}</span>
              <span>
                {c.country}: {c.amount}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-10">
          <Link
            href="/admin/global-control"
            className="text-sm text-cyan-400 hover:text-cyan-300"
          >
            ← Global Merkeze Dön
          </Link>
        </div>

        {/* Onboarding Modal */}
        {showOnboarding && (
          <div
            className="fixed inset-0 z-[1000] flex justify-center items-center bg-black/90 backdrop-blur-md"
            onClick={() => setShowOnboarding(false)}
          >
            <div
              className="bg-[#151515] w-full max-w-md mx-4 p-10 rounded-2xl border border-[#333]"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="font-['Orbitron'] text-xl text-cyan-400 mt-0 mb-6">
                Sanal AVM Katılım Formu
              </h2>
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2">
                    ŞİRKET ADI
                  </label>
                  <input
                    type="text"
                    placeholder="Örn: OpenAI"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full bg-[#0a0a0a] border border-[#333] text-white px-3 py-2.5 rounded-lg focus:outline-none focus:border-cyan-500/50"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2">
                    SPONSORLUK BEDELİ
                  </label>
                  <input
                    type="text"
                    value={sponsorshipAmount}
                    onChange={(e) => setSponsorshipAmount(e.target.value)}
                    className="w-full bg-[#0a0a0a] border border-[#333] text-[#ffcc00] px-3 py-2.5 rounded-lg font-bold focus:outline-none focus:border-cyan-500/50"
                  />
                </div>
                <div className="mb-6">
                  <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2">
                    ETİK VE HUKUKİ TAAHHÜT
                  </label>
                  <div className="bg-[#1a1a1a] p-4 rounded-lg text-sm text-gray-300 border-l-4 border-red-500">
                    <label className="flex gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        required
                        checked={rulesAccepted}
                        onChange={(e) => setRulesAccepted(e.target.checked)}
                        className="mt-0.5"
                      />
                      <span>
                        İçeriklerimizde +18, kumar, çöpçatanlık veya dini değerleri
                        aşağılayan unsurlar bulunmadığını taahhüt ederiz.
                      </span>
                    </label>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowOnboarding(false)}
                    className="flex-1 py-3 px-4 bg-[#333] rounded-lg text-white hover:bg-[#444] transition-colors"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    className="flex-[2] py-3 px-4 bg-blue-500 rounded-lg text-white font-bold hover:bg-blue-600 transition-colors"
                  >
                    SÖZLEŞMEYİ ONAYLA VE BAĞLA
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
