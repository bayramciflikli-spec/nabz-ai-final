"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, type User } from "firebase/auth";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { Scale, FileText, Shield, Copyright, Database } from "lucide-react";

export default function AdminLegalFiltersPage() {
  const [user, setUser] = useState<User | null>(null);
  const [seeding, setSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState<{ ok?: boolean; message?: string; error?: string } | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, setUser);
    return () => unsub();
  }, []);

  return (
    <div className="p-8">
          <h1 className="text-2xl font-bold mb-8 flex items-center gap-2">
            <Scale size={28} className="text-amber-400" />
            Hukuki Filtreler
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            <Link
              href="/admin/global-control"
              className="p-6 rounded-xl bg-[#111] border border-white/10 hover:border-cyan-500/40 transition-colors"
            >
              <Copyright size={24} className="text-amber-400 mb-3" />
              <h3 className="font-bold text-white mb-2">Telif İhlali & Ceza</h3>
              <p className="text-sm text-white/60">
                Global Onay Kuyruğunda REDDET → © Telif ihlali — Ceza uygula. trustScore -30, 3 strike = ban.
              </p>
            </Link>

            <Link
              href="/yasal/fikri-mulkiyet"
              className="p-6 rounded-xl bg-[#111] border border-white/10 hover:border-cyan-500/40 transition-colors"
            >
              <FileText size={24} className="text-cyan-400 mb-3" />
              <h3 className="font-bold text-white mb-2">Fikri Mülkiyet Politikası</h3>
              <p className="text-sm text-white/60">
                IP pasaportu, sponsor_use, BANNED_CONTENT kanıt saklama.
              </p>
            </Link>

            <Link
              href="/yasal/kullanim-sartlari"
              className="p-6 rounded-xl bg-[#111] border border-white/10 hover:border-cyan-500/40 transition-colors"
            >
              <FileText size={24} className="text-purple-400 mb-3" />
              <h3 className="font-bold text-white mb-2">Kullanım Şartları</h3>
              <p className="text-sm text-white/60">
                Genel şartlar, sorumluluk reddi, fikri mülkiyet.
              </p>
            </Link>

            <Link
              href="/yasal/kvkk"
              className="p-6 rounded-xl bg-[#111] border border-white/10 hover:border-cyan-500/40 transition-colors"
            >
              <Shield size={24} className="text-green-400 mb-3" />
              <h3 className="font-bold text-white mb-2">KVKK / GDPR / CCPA</h3>
              <p className="text-sm text-white/60">
                Ülkeye göre veri koruma: TR→KVKK, AB→GDPR, US→CCPA.
              </p>
            </Link>
          </div>

          <div className="p-6 rounded-xl bg-[#0d0d0d] border border-amber-500/30 mb-8">
            <h3 className="font-bold text-amber-400 mb-3">Aktif Hukuki Koruma</h3>
            <ul className="text-sm text-white/80 space-y-2">
              <li>• <strong>legal_history:</strong> Yasal kabul imzası (SIG-xxx, NABZ-TOS-2026.1)</li>
              <li>• <strong>contents:</strong> IP pasaportu, fingerprint, sponsor_use</li>
              <li>• <strong>applyStrike:</strong> Telif ihlali → BANNED_CONTENT (kanıt saklama)</li>
              <li>• <strong>rightToBeForgotten:</strong> GDPR Madde 17 silinme hakkı</li>
              <li>• <strong>applyRegionalCompliance:</strong> legal_settings (KVKK/GDPR/Global)</li>
            </ul>
            <div className="mt-4 pt-4 border-t border-white/10">
              <p className="text-sm text-white/60 mb-2">
                <strong>legal_settings</strong> koleksiyonu henüz boşsa, aşağıdaki butonla varsayılan dokümanları oluşturun:
              </p>
              <button
                onClick={async () => {
                  setSeeding(true);
                  setSeedResult(null);
                  try {
                    const res = await fetchWithAuth("/api/admin/seed-legal-settings", { method: "POST" });
                    const data = await res.json();
                    setSeedResult(data.ok ? { ok: true, message: data.message } : { ok: false, error: data.error });
                  } catch (e: unknown) {
                    setSeedResult({ ok: false, error: e instanceof Error ? e.message : "İstek başarısız" });
                  } finally {
                    setSeeding(false);
                  }
                }}
                disabled={seeding}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-sm font-medium"
              >
                <Database size={16} />
                {seeding ? "Oluşturuluyor…" : "legal_settings Seed"}
              </button>
              {seedResult && (
                <p className={`mt-2 text-sm ${seedResult.ok ? "text-green-400" : "text-red-400"}`}>
                  {seedResult.ok ? seedResult.message : seedResult.error}
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-4">
            <Link href="/admin/global-control" className="text-sm text-cyan-400 hover:underline">
              ← Global Onay Kuyruğu
            </Link>
            <Link href="/" className="text-sm text-white/50 hover:text-white">
              Ana Sayfa
            </Link>
          </div>
    </div>
  );
}
