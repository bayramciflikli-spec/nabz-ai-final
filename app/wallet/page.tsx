"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged, type User } from "firebase/auth";
import { Sidebar } from "@/components/Sidebar";
import { getUserAccess } from "@/lib/userAccess";
import { useToast } from "@/components/ToastContext";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { collection, query, where, limit, getDocs } from "firebase/firestore";
import { ArrowLeft, X } from "lucide-react";

type PayoutMethodType = "BANK_TRANSFER" | "WISE" | "PAYONEER";

interface Transaction {
  id: string;
  label: string;
  amount: number;
  type: "credit" | "debit";
}

export default function WalletPage() {
  const toast = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [totalBalance, setTotalBalance] = useState(0);
  const [monthlyEarnings, setMonthlyEarnings] = useState(0);
  const [commission, setCommission] = useState(10);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [payoutMethod, setPayoutMethod] = useState<PayoutMethodType>("BANK_TRANSFER");
  const [fullName, setFullName] = useState("");
  const [accountId, setAccountId] = useState("");
  const [swift, setSwift] = useState("");
  const [bankName, setBankName] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedPayout, setSavedPayout] = useState<{ type: string; status: string } | null>(null);
  const [kycStatus, setKycStatus] = useState<string | null>(null);
  const [showKycModal, setShowKycModal] = useState(false);
  const [kycIdFile, setKycIdFile] = useState<File | null>(null);
  const [kycSelfieFile, setKycSelfieFile] = useState<File | null>(null);
  const [kycSubmitting, setKycSubmitting] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, setUser);
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }
    const load = async () => {
      try {
        const [userSnap, access] = await Promise.all([
          getDoc(doc(db, "users", user.uid)),
          getUserAccess(user.uid),
        ]);
        const u = userSnap.data();
        setTotalBalance(u?.balance ?? u?.totalEarnings ?? 0);
        setCommission(access.commission ?? 10);
        if (u?.payoutMethod) {
          setSavedPayout({ type: u.payoutMethod.type, status: u.payoutMethod.status });
          setFullName(u.payoutMethod.beneficiaryName || "");
          setAccountId(u.payoutMethod.accountIdentifier || "");
          setSwift(u.payoutMethod.bankSwift || "");
          setBankName(u.payoutMethod.bankName || "");
        } else {
          setSavedPayout(null);
        }

        // Bu ayki görüntülenme tahmini (projelerden, en fazla 500)
        const q = query(
          collection(db, "projects"),
          where("authorId", "==", user.uid),
          limit(500)
        );
        const snap = await getDocs(q);
        let views = 0;
        snap.docs.forEach((d) => {
          const data = d.data();
          views += (data?.likedBy?.length ?? 0) + (data?.views ?? 0);
        });
        const impressions = views * 100;
        const monthly = (impressions / 1000) * 15 * ((access.commission ?? 10) / 100);
        setMonthlyEarnings(monthly);

        // Örnek işlemler (gerçek veri yoksa placeholder)
        setTransactions([
          { id: "1", label: "Runway Gen-3 Referans Geliri", amount: 8.5, type: "credit" },
          { id: "2", label: "Midjourney Üyelik Komisyonu", amount: 12.0, type: "credit" },
          { id: "3", label: "AdSense Reklam Geliri", amount: 4.2, type: "credit" },
        ]);
      } catch {
        setTransactions([
          { id: "1", label: "Runway Gen-3 Referans Geliri", amount: 8.5, type: "credit" },
          { id: "2", label: "Midjourney Üyelik Komisyonu", amount: 12.0, type: "credit" },
        ]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.uid]);

  const handleSavePayment = async () => {
    if (!fullName.trim() || !accountId.trim()) {
      toast.error("Ad Soyad ve hesap bilgisi gerekli");
      return;
    }
    setSaving(true);
    try {
      const res = await fetchWithAuth("/api/payment-info", {
        method: "POST",
        body: JSON.stringify({
          method: payoutMethod,
          details: {
            fullName: fullName.trim(),
            id: accountId.trim(),
            swift: swift.trim() || undefined,
            bankName: bankName.trim() || undefined,
          },
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setSavedPayout({ type: payoutMethod, status: "PENDING" });
        setShowPaymentModal(false);
      } else {
        toast.error(data.error || "Kaydedilemedi");
      }
    } catch {
      toast.error("Kaydedilemedi");
    } finally {
      setSaving(false);
    }
  };

  const handleKycSubmit = async () => {
    if (!kycIdFile || !kycSelfieFile) {
      toast.error("Kimlik ve selfie dosyası seçin");
      return;
    }
    setKycSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("idFile", kycIdFile);
      formData.append("selfieFile", kycSelfieFile);
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch("/api/kyc", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      const data = await res.json();
      if (data.ok) {
        setKycStatus("pending");
        setShowKycModal(false);
        setKycIdFile(null);
        setKycSelfieFile(null);
      } else {
        toast.error(data.error || "Başvuru gönderilemedi");
      }
    } catch {
      toast.error("Başvuru gönderilemedi");
    } finally {
      setKycSubmitting(false);
    }
  };

  const getAccountLabel = () => {
    switch (payoutMethod) {
      case "BANK_TRANSFER": return "IBAN";
      case "WISE": return "Wise IBAN veya E-posta";
      case "PAYONEER": return "Payoneer E-posta";
      default: return "Hesap Bilgisi";
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505]">
        <div className="w-10 h-10 border-2 border-cyan-500/50 border-t-cyan-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#050505] text-white">
      <div className="hidden sm:block">
        <Sidebar user={user} />
      </div>

      <main className="flex-1 sm:ml-56 p-4 sm:p-6 lg:p-10 max-w-3xl">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm mb-6"
        >
          <ArrowLeft size={18} />
          Dashboard&apos;a dön
        </Link>

        <div
          id="wallet-dashboard"
          className="bg-[#050505] text-white p-6 sm:p-8 rounded-[20px] font-['Inter'] border border-[#1a1a1a]"
        >
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 mb-8">
            <div>
              <p className="text-white/50 text-sm m-0">TOPLAM BAKİYE</p>
              <h1 className="text-green-400 text-4xl sm:text-5xl font-bold m-0 mt-1">
                {loading ? "..." : `$ ${totalBalance.toFixed(2)}`}
              </h1>
            </div>
            <button
              type="button"
              className="bg-green-500 text-black font-bold px-6 py-3 rounded-lg hover:bg-green-400 transition-colors cursor-pointer shrink-0"
              onClick={() => setShowPaymentModal(true)}
            >
              ÖDEME AL (IBAN)
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="bg-[#111] p-4 sm:p-5 rounded-xl flex-1">
              <span className="text-blue-400 text-xs font-medium">BU AYKİ KAZANÇ</span>
              <h3 className="text-xl font-bold mt-2 mb-0">
                {loading ? "..." : `$ ${monthlyEarnings.toFixed(2)}`}
              </h3>
            </div>
            <div className="bg-[#111] p-4 sm:p-5 rounded-xl flex-1">
              <span className="text-purple-400 text-xs font-medium">SPONSOR KOMİSYONU</span>
              <h3 className="text-xl font-bold mt-2 mb-0">% {commission}</h3>
            </div>
          </div>

          <section>
            <h4 className="text-white/90 border-b border-white/10 pb-3 mb-4 font-semibold">
              Son İşlemler
            </h4>
            <div className="space-y-0">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex justify-between items-center py-3 border-b border-[#111] text-sm"
                >
                  <span>{tx.label}</span>
                  <span className={tx.type === "credit" ? "text-green-400" : "text-red-400"}>
                    {tx.type === "credit" ? "+" : "-"} $ {tx.amount.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>

        <p className="text-white/40 text-xs mt-6">
          Gelirler reklam görüntülenmeleri ve referans komisyonlarından oluşur. Minimum ödeme eşiği: $ 50.
        </p>

        {savedPayout && (
          <div className="mt-4 p-4 rounded-xl bg-green-500/10 border border-green-500/30">
            <p className="text-sm text-green-400">
              Kayıtlı ödeme: {savedPayout.type} — Durum: {savedPayout.status === "VERIFIED" ? "Onaylı ✓" : savedPayout.status === "PENDING" ? "Onay bekleniyor" : "Reddedildi"}
            </p>
          </div>
        )}

        <div className="mt-4 p-4 rounded-xl bg-white/5 border border-white/10">
          <h4 className="text-sm font-semibold mb-2">Kimlik Doğrulama (KYC)</h4>
          {kycStatus === "approved" ? (
            <p className="text-sm text-green-400">✓ Onaylandı</p>
          ) : kycStatus === "pending" ? (
            <p className="text-sm text-amber-400">Beklemede</p>
          ) : kycStatus === "rejected" ? (
            <p className="text-sm text-red-400">Reddedildi. Yeniden başvurabilirsiniz.</p>
          ) : null}
          {kycStatus !== "approved" && (
            <button
              type="button"
              onClick={() => setShowKycModal(true)}
              className="mt-2 text-sm text-cyan-400 hover:underline"
            >
              {kycStatus ? "Başvuruyu güncelle" : "KYC başvurusu yap"}
            </button>
          )}
        </div>

        {showKycModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-[#111] border border-white/20 rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold">KYC Başvurusu</h3>
                <button onClick={() => setShowKycModal(false)} className="p-2 hover:bg-white/10 rounded-lg">
                  <X size={20} />
                </button>
              </div>
              <p className="text-sm text-white/70 mb-4">
                Ödeme alabilmek için kimlik doğrulama gereklidir. Kimlik kartı ve selfie yükleyin (JPG/PNG, max 5MB).
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-white/50 mb-1">Kimlik Kartı</label>
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png"
                    onChange={(e) => setKycIdFile(e.target.files?.[0] || null)}
                    className="w-full text-sm text-white/70 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-white/10 file:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-white/50 mb-1">Selfie (yüzünüz görünür)</label>
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png"
                    onChange={(e) => setKycSelfieFile(e.target.files?.[0] || null)}
                    className="w-full text-sm text-white/70 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-white/10 file:text-white"
                  />
                </div>
              </div>
              <div className="mt-6 flex gap-3">
                <button
                  onClick={handleKycSubmit}
                  disabled={kycSubmitting}
                  className="flex-1 py-3 rounded-lg bg-cyan-500 text-black font-bold hover:bg-cyan-400 disabled:opacity-50"
                >
                  {kycSubmitting ? "Gönderiliyor..." : "Gönder"}
                </button>
                <button
                  onClick={() => setShowKycModal(false)}
                  className="px-4 py-3 rounded-lg bg-white/10 hover:bg-white/20"
                >
                  İptal
                </button>
              </div>
            </div>
          </div>
        )}

        {showPaymentModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-[#111] border border-white/20 rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold">Ödeme Bilgileri</h3>
                <button onClick={() => setShowPaymentModal(false)} className="p-2 hover:bg-white/10 rounded-lg">
                  <X size={20} />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-white/50 mb-1">Ödeme Yöntemi</label>
                  <select
                    value={payoutMethod}
                    onChange={(e) => setPayoutMethod(e.target.value as PayoutMethodType)}
                    className="w-full px-4 py-2 rounded-lg bg-black/50 border border-white/20 text-white"
                  >
                    <option value="BANK_TRANSFER">Banka Havalesi (IBAN)</option>
                    <option value="WISE">Wise</option>
                    <option value="PAYONEER">Payoneer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-white/50 mb-1">Ad Soyad (Resmi Kimlikteki)</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Ahmet Yılmaz"
                    className="w-full px-4 py-2 rounded-lg bg-black/50 border border-white/20 text-white placeholder-white/30"
                  />
                </div>
                <div>
                  <label className="block text-xs text-white/50 mb-1">{getAccountLabel()}</label>
                  <input
                    type="text"
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    placeholder={payoutMethod === "BANK_TRANSFER" ? "TR00 0000 0000 0000 0000 0000 00" : "email@example.com"}
                    className="w-full px-4 py-2 rounded-lg bg-black/50 border border-white/20 text-white placeholder-white/30"
                  />
                </div>
                {(payoutMethod === "BANK_TRANSFER" || payoutMethod === "WISE") && (
                  <>
                    <div>
                      <label className="block text-xs text-white/50 mb-1">SWIFT Kodu (Uluslararası transfer için)</label>
                      <input
                        type="text"
                        value={swift}
                        onChange={(e) => setSwift(e.target.value)}
                        placeholder="TCZBTR2A"
                        className="w-full px-4 py-2 rounded-lg bg-black/50 border border-white/20 text-white placeholder-white/30"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-white/50 mb-1">Banka Adı (Opsiyonel)</label>
                      <input
                        type="text"
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        placeholder="Ziraat Bankası"
                        className="w-full px-4 py-2 rounded-lg bg-black/50 border border-white/20 text-white placeholder-white/30"
                      />
                    </div>
                  </>
                )}
              </div>
              <div className="mt-6 flex gap-3">
                <button
                  onClick={handleSavePayment}
                  disabled={saving}
                  className="flex-1 py-3 rounded-lg bg-green-500 text-black font-bold hover:bg-green-400 disabled:opacity-50"
                >
                  {saving ? "Kaydediliyor..." : "Kaydet"}
                </button>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-3 rounded-lg bg-white/10 hover:bg-white/20"
                >
                  İptal
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
