"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Sidebar } from "@/components/Sidebar";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, type User } from "firebase/auth";
import { LEGAL_EMAIL } from "@/lib/legalContact";

export default function DMCABildirimPage() {
  const [user, setUser] = useState<User | null>(null);
  const [workDescription, setWorkDescription] = useState("");
  const [contentUrl, setContentUrl] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [declaration, setDeclaration] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ ok?: boolean; message?: string; fallbackEmail?: string } | null>(null);
  const [apiConfigured, setApiConfigured] = useState<boolean | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, setUser);
    return () => unsub();
  }, []);

  useEffect(() => {
    fetch("/api/dmca-report")
      .then((r) => r.json())
      .then((d) => setApiConfigured(d.configured === true))
      .catch(() => setApiConfigured(false));
  }, []);

  const buildMailto = () => {
    const subject = encodeURIComponent("[NABZ-AI] DMCA / Telif İhlali Bildirimi");
    const body = encodeURIComponent(
      `İhlal edildiğini iddia ettiğim eser:\n${workDescription}\n\nİhlal içeriğinin URL'si:\n${contentUrl}\n\nİletişim e-postam: ${contactEmail}\n\nTelif hakkı sahibi veya yetkili olduğumu beyan ederim.`
    );
    return `mailto:${LEGAL_EMAIL}?subject=${subject}&body=${body}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setResult(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/dmca-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workDescription: workDescription.trim(),
          contentUrl: contentUrl.trim(),
          contactEmail: contactEmail.trim(),
          declaration,
        }),
      });
      const data = await res.json();
      setResult(
        data.ok
          ? { ok: true, message: data.message }
          : { ok: false, message: data.error, fallbackEmail: data.fallbackEmail || LEGAL_EMAIL }
      );
      if (data.ok) {
        setWorkDescription("");
        setContentUrl("");
        setContactEmail("");
        setDeclaration(false);
      }
    } catch {
      setResult({ ok: false, message: "İstek başarısız." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#050505] text-white">
      <div className="hidden sm:block">
        <Sidebar user={user} />
      </div>
      <div className="flex-1 sm:ml-56 p-8 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-2">Telif İhlali Bildirimi (DMCA)</h1>
        <p className="text-sm text-white/60 mb-8">
          Telif hakkınızın ihlal edildiğini düşünüyorsanız aşağıdaki formu doldurun. Bildiriminiz en
          kısa sürede değerlendirilecektir.
        </p>

        {apiConfigured === false && (
          <div className="mb-6 p-4 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-200 text-sm">
            Form gönderimi yapılandırılmamış. Lütfen formu doldurup &quot;E-posta ile Gönder&quot; butonunu
            kullanarak doğrudan{" "}
            <a href={`mailto:${LEGAL_EMAIL}`} className="text-cyan-400 hover:underline">
              {LEGAL_EMAIL}
            </a>{" "}
            adresine iletin.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              İhlal edildiğini iddia ettiğiniz eserin tanımı *
            </label>
            <textarea
              value={workDescription}
              onChange={(e) => setWorkDescription(e.target.value)}
              required
              rows={4}
              className="w-full px-4 py-3 rounded-lg bg-black/40 border border-white/20 text-white placeholder-white/40 focus:border-cyan-500 focus:outline-none"
              placeholder="Eserin adı, türü ve ihlal edilen hakları kısaca açıklayın"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              İhlal içeriğinin platformdaki URL'si *
            </label>
            <input
              type="url"
              value={contentUrl}
              onChange={(e) => setContentUrl(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-lg bg-black/40 border border-white/20 text-white placeholder-white/40 focus:border-cyan-500 focus:outline-none"
              placeholder="https://..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              İletişim e-postanız *
            </label>
            <input
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-lg bg-black/40 border border-white/20 text-white placeholder-white/40 focus:border-cyan-500 focus:outline-none"
              placeholder="ornek@email.com"
            />
          </div>

          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="declaration"
              checked={declaration}
              onChange={(e) => setDeclaration(e.target.checked)}
              className="mt-1 rounded border-white/30"
            />
            <label htmlFor="declaration" className="text-sm text-white/80">
              Telif hakkı sahibi olduğumu veya telif sahibi adına hareket etme yetkisine sahip
              olduğumu beyan ederim. Bildirimdeki bilgilerin doğruluğundan sorumluyum.
            </label>
          </div>

          {result && (
            <div className={`text-sm ${result.ok ? "text-green-400" : "text-red-400"}`}>
              <p>{result.message}</p>
              {!result.ok && result.fallbackEmail && (
                <a
                  href={buildMailto()}
                  className="inline-flex mt-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white border border-white/20"
                >
                  E-posta ile Gönder ({result.fallbackEmail})
                </a>
              )}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 font-medium"
            >
              {submitting ? "Gönderiliyor…" : "Bildirimi Gönder"}
            </button>
            <a
              href={buildMailto()}
              className="flex-1 py-3 rounded-lg border border-white/20 hover:bg-white/5 text-center font-medium flex items-center justify-center gap-2"
            >
              E-posta ile Gönder
            </a>
          </div>
        </form>

        <div className="mt-10 flex flex-wrap gap-4">
          <Link href="/yasal/fikri-mulkiyet" className="text-cyan-400 hover:underline text-sm">
            ← Fikri Mülkiyet ve Telif Hakları
          </Link>
          <Link href="/yasal/gizlilik" className="text-cyan-400 hover:underline text-sm">
            Gizlilik Politikası
          </Link>
          <Link href="/" className="text-white/50 hover:text-white text-sm">
            Ana Sayfa
          </Link>
        </div>
      </div>
    </div>
  );
}
