"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Sidebar } from "@/components/Sidebar";
import { auth } from "@/lib/firebase";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { onAuthStateChanged, type User } from "firebase/auth";
import { GripVertical, FileText, RefreshCw, Upload, Shield, Zap } from "lucide-react";

interface TransparencyReport {
  report_id: string;
  period: string;
  toplamDagitilan: number;
  nabzKasa: number;
  onayliArchitectSayisi: number;
  odemeSayisi: number;
  reddedilenIcerikSayisi: number;
  telifIhlaliCozulenSayisi: number;
  safety_rate: string;
  transparency_seal: string;
  raporTarihi: string;
  isFallback?: boolean;
}

export default function TransparencyReportPage() {
  const [user, setUser] = useState<User | null>(null);
  const [report, setReport] = useState<TransparencyReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState<{ ok: boolean; msg: string } | null>(null);
  const [claiming, setClaiming] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, setUser);
    return () => unsub();
  }, []);

  const loadReport = async () => {
    setLoading(true);
    setUploadMsg(null);
    const qs = period ? `?period=${encodeURIComponent(period)}` : "";
    try {
      let res = await fetchWithAuth(`/api/admin/transparency-report${qs}`);
      let data = await res.json();
      if (!data.ok && res.status === 401) {
        res = await fetch(`/api/transparency-report${qs}`);
        data = await res.json();
      }
      if (data.ok && data.report) {
        setReport(data.report);
      } else {
        setReport(null);
      }
    } catch {
      try {
        const res = await fetch(`/api/transparency-report${qs}`);
        const data = await res.json();
        if (data.ok && data.report) setReport(data.report);
        else setReport(null);
      } catch {
        setReport(null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) loadReport();
  }, [user, period]);

  const handleForceUpload = async (useOverdrive = false) => {
    const p = period || new Date().toISOString().slice(0, 7);
    const masterKey = useOverdrive ? prompt("Master Key girin (Overdrive modu):") : null;
    if (useOverdrive && !masterKey) return;
    setUploading(true);
    setUploadMsg(null);
    try {
      const res = await fetchWithAuth(
        `/api/admin/force-upload-transparency-report?period=${encodeURIComponent(p)}`,
        {
          method: "POST",
          headers: useOverdrive && masterKey ? { "X-NABZ-Master-Key": masterKey } : undefined,
          body: useOverdrive && masterKey ? JSON.stringify({ master_key: masterKey }) : undefined,
        }
      );
      const data = await res.json();
      if (data.ok) {
        setUploadMsg({ ok: true, msg: data.message || "Rapor yüklendi" });
      } else {
        setUploadMsg({ ok: false, msg: data.error || "Yükleme başarısız" });
      }
    } catch {
      setUploadMsg({ ok: false, msg: "Yükleme hatası" });
    } finally {
      setUploading(false);
    }
  };

  const handleClaimFounder = async () => {
    setClaiming(true);
    setUploadMsg(null);
    try {
      const res = await fetchWithAuth("/api/admin/claim-founder", { method: "POST" });
      const data = await res.json();
      if (data.ok) {
        setUploadMsg({ ok: true, msg: data.message || "Kurucu yetkisi alındı." });
      } else {
        setUploadMsg({ ok: false, msg: data.error || "Talep başarısız" });
      }
    } catch {
      setUploadMsg({ ok: false, msg: "Talep hatası" });
    } finally {
      setClaiming(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#050505] text-white">
      <div className="hidden sm:block">
        <Sidebar user={user} />
      </div>

      <div className="flex-1 sm:ml-56 flex">
        <aside className="w-[260px] bg-[#111] border-r border-white/10 flex flex-col p-6 shrink-0">
          <div className="font-['Orbitron'] font-black text-xl mb-12 bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
            NABZ-AI CTRL
          </div>
          <nav className="flex flex-col gap-2">
            {[
              { label: "Global Onay Kuyruğu", href: "/admin/global-control", active: false },
              { label: "Kullanıcı Yönetimi", href: "/admin/users", active: false },
              { label: "Financial Hub", href: "/admin/financial", active: false },
              { label: "Şeffaflık Raporu", href: "/admin/transparency", active: true },
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
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <FileText size={24} className="text-cyan-400" />
              Şeffaflık Raporu
            </h1>
            <div className="flex items-center gap-2 flex-wrap">
              <input
                type="month"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="px-3 py-2 rounded-lg bg-black/40 border border-white/20 text-white text-sm"
              />
              <button
                onClick={loadReport}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-50"
              >
                <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                Yenile
              </button>
              <button
                onClick={handleClaimFounder}
                disabled={claiming}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:opacity-50"
              >
                <Shield size={16} className={claiming ? "animate-pulse" : ""} />
                {claiming ? "Talep ediliyor…" : "Kurucu Ol"}
              </button>
              <button
                onClick={() => handleForceUpload(false)}
                disabled={loading || uploading || report?.isFallback}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Upload size={16} className={uploading ? "animate-pulse" : ""} />
                {uploading ? "Yükleniyor…" : "Raporu Yükle"}
              </button>
              <button
                onClick={() => handleForceUpload(true)}
                disabled={loading || uploading || report?.isFallback}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Master Key ile root yetkisiyle yükle (sunucu izinleri manuel resetlendiğinde)"
              >
                <Zap size={16} />
                Overdrive
              </button>
            </div>
          </div>

          {uploadMsg && (
            <div className={`p-4 rounded-xl ${uploadMsg.ok ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-200" : "bg-red-500/10 border border-red-500/30 text-red-200"} text-sm`}>
              {uploadMsg.msg}
            </div>
          )}
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
            </div>
          ) : report ? (
            <div className="space-y-6 max-w-2xl">
              {report.isFallback && (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-sm">
                  Firestore Admin yapılandırılmamış. Gerçek veri için <code className="bg-black/30 px-1 rounded">FIREBASE_SERVICE_ACCOUNT_KEY</code> ekleyin.
                </div>
              )}
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                <p className="text-xs text-white/60 uppercase mb-1">Rapor ID</p>
                <p className="font-mono text-white">{report.report_id}</p>
                <p className="text-xs text-emerald-400 mt-1">{report.transparency_seal}</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-6 rounded-xl bg-[#111] border border-white/10">
                  <p className="text-white/50 text-xs uppercase mb-1">Toplam Dağıtılan Ödeme</p>
                  <p className="text-2xl font-bold text-green-400">$ {(Number(report.toplamDagitilan) || 0).toFixed(2)}</p>
                  <p className="text-xs text-white/40 mt-1">{report.odemeSayisi} ödeme</p>
                </div>
                <div className="p-6 rounded-xl bg-[#111] border border-white/10">
                  <p className="text-white/50 text-xs uppercase mb-1">NABZ Kasa</p>
                  <p className="text-2xl font-bold text-cyan-400">$ {(Number(report.nabzKasa) || 0).toFixed(2)}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-6 rounded-xl bg-[#111] border border-white/10">
                  <p className="text-white/50 text-xs uppercase mb-1">Reddedilen İçerik</p>
                  <p className="text-2xl font-bold text-red-400">{report.reddedilenIcerikSayisi}</p>
                </div>
                <div className="p-6 rounded-xl bg-[#111] border border-white/10">
                  <p className="text-white/50 text-xs uppercase mb-1">Telif İhlali Çözülen</p>
                  <p className="text-2xl font-bold text-amber-400">{report.telifIhlaliCozulenSayisi}</p>
                </div>
              </div>
              <div className="p-6 rounded-xl bg-[#111] border border-white/10">
                <p className="text-white/50 text-xs uppercase mb-1">Filtreleme Başarı Oranı</p>
                <p className="text-2xl font-bold text-white">{report.safety_rate}</p>
              </div>
              <div className="p-6 rounded-xl bg-[#111] border border-white/10">
                <p className="text-white/50 text-xs uppercase mb-1">Onaylı Architect Sayısı</p>
                <p className="text-2xl font-bold text-white">{report.onayliArchitectSayisi}</p>
              </div>
              <p className="text-xs text-white/40">
                Rapor tarihi: {new Date(report.raporTarihi).toLocaleString("tr-TR")}
              </p>
            </div>
          ) : (
            <div className="p-8 rounded-xl bg-[#111] border border-white/10 text-center text-white/60">
              Rapor yüklenemedi.
            </div>
          )}

          <div className="mt-8 flex gap-4">
            <Link href="/admin" className="text-sm text-cyan-400 hover:underline">
              ← Kontrol Kulesi
            </Link>
            <Link href="/admin/financial" className="text-sm text-white/50 hover:text-white">
              Financial Hub
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}
