"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { subscribeToPlatform, isPlatformSubscribed } from "@/lib/subscription";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { Sidebar } from "@/components/Sidebar";
import { useAuth } from "@/components/AuthProvider";
import { UserPlus, CheckCircle, AlertTriangle } from "lucide-react";
import { TERMS_TELIF, TERMS_CONTENT_RULES, CONTENT_RULES } from "@/lib/contentRules";
import { getCountryRule } from "@/lib/countryRules";
import { generateBrowserFingerprint } from "@/lib/browserFingerprint";

function AboneOlContent() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [error, setError] = useState("");
  const [countryRule, setCountryRule] = useState<ReturnType<typeof getCountryRule>>(() =>
    getCountryRule(null)
  );
  const [telifAccepted, setTelifAccepted] = useState(false);
  const [contentRulesAccepted, setContentRulesAccepted] = useState(false);
  const [termsOfServiceAccepted, setTermsOfServiceAccepted] = useState(false);
  const [privacyPolicyAccepted, setPrivacyPolicyAccepted] = useState(false);
  const [dataProtectionAccepted, setDataProtectionAccepted] = useState(false);
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("return") || "/upload";

  useEffect(() => {
    const check = async () => {
      if (!user?.uid) return;
      const ok = await isPlatformSubscribed(user.uid);
      setSubscribed(ok);
    };
    check();
  }, [user]);

  useEffect(() => {
    const fetchCountry = async () => {
      try {
        const res = await fetch("/api/locale");
        const data = await res.json();
        const country = data?.country as string | null;
        setCountryRule(getCountryRule(country));
      } catch {
        setCountryRule(getCountryRule(null));
      }
    };
    fetchCountry();
  }, []);

  const handleSubscribe = async () => {
    if (!user?.uid) return;
    const allAccepted =
      telifAccepted &&
      contentRulesAccepted &&
      termsOfServiceAccepted &&
      privacyPolicyAccepted &&
      dataProtectionAccepted;
    if (!allAccepted) {
      setError("Devam etmek için tüm şartları ve yasal metinleri kabul etmeniz gerekiyor.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const confirmRes = await fetchWithAuth("/api/confirm-legal-acceptance", {
        method: "POST",
        body: JSON.stringify({ fingerprint: generateBrowserFingerprint() }),
      });
      const confirmData = await confirmRes.json();
      if (!confirmData.ok) {
        throw new Error(confirmData.error || "Yasal kabul kaydı başarısız");
      }
      await subscribeToPlatform(user.uid, {
        telifAccepted,
        contentRulesAccepted,
        termsOfServiceAccepted,
        privacyPolicyAccepted,
        acceptedLaw: countryRule.law,
      });
      setSubscribed(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Abonelik başarısız");
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="flex min-h-screen bg-[#050505] text-white">
      <div className="hidden sm:block">
        <Sidebar user={user} />
      </div>
      <div className="flex-1 sm:ml-56 p-8 flex flex-col items-center justify-center max-w-lg mx-auto">
        <div className="w-full bg-[#1a1a1a] border border-white/20 rounded-2xl p-8 text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500/20 to-purple-600/20 flex items-center justify-center mb-6">
            <UserPlus size={32} className="text-cyan-400" />
          </div>
          <h1 className="text-2xl font-bold mb-2">NABZ-AI Aboneliği</h1>
          <p className="text-white/70 text-sm mb-6">
            AI içeriklerini paylaşmak için abone olun. Abone olduktan sonra videolarınızı, müziklerinizi ve
            tasarımlarınızı herkesle paylaşabilirsiniz.
          </p>

          {subscribed ? (
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-2 text-green-400">
                <CheckCircle size={24} />
                <span className="font-semibold">Zaten abonesiniz!</span>
              </div>
              <Link
                href={returnUrl}
                className="inline-block py-3 px-6 rounded-xl bg-red-500 hover:bg-red-500/90 text-white font-semibold transition-colors"
              >
                İçerik Paylaşmaya Git
              </Link>
            </div>
          ) : (
            <div className="space-y-4 text-left">
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 space-y-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle size={20} className="text-amber-400 shrink-0 mt-0.5" />
                  <div className="space-y-3">
                    <p className="text-sm text-white/90 font-medium">Abone olmak için aşağıdaki şartları kabul etmeniz gerekiyor:</p>
                    <label className="flex items-start gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={telifAccepted}
                        onChange={(e) => setTelifAccepted(e.target.checked)}
                        className="mt-1 rounded border-white/30 bg-black/40 text-red-500 focus:ring-red-500"
                      />
                      <span className="text-sm text-white/80 group-hover:text-white">
                        {TERMS_TELIF}
                      </span>
                    </label>
                    <label className="flex items-start gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={contentRulesAccepted}
                        onChange={(e) => setContentRulesAccepted(e.target.checked)}
                        className="mt-1 rounded border-white/30 bg-black/40 text-red-500 focus:ring-red-500"
                      />
                      <span className="text-sm text-white/80 group-hover:text-white">
                        {TERMS_CONTENT_RULES}
                      </span>
                    </label>
                    <p className="text-xs text-white/60 font-medium mt-2">Yasal metinler:</p>
                    <label className="flex items-start gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={termsOfServiceAccepted}
                        onChange={(e) => setTermsOfServiceAccepted(e.target.checked)}
                        className="mt-1 rounded border-white/30 bg-black/40 text-red-500 focus:ring-red-500"
                      />
                      <span className="text-sm text-white/80 group-hover:text-white">
                        <Link
                          href="/yasal/kullanim-sartlari"
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-cyan-400 hover:underline"
                        >
                          Kullanım Şartları
                        </Link>
                        &apos;nı okudum ve kabul ediyorum.
                      </span>
                    </label>
                    <label className="flex items-start gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={privacyPolicyAccepted}
                        onChange={(e) => setPrivacyPolicyAccepted(e.target.checked)}
                        className="mt-1 rounded border-white/30 bg-black/40 text-red-500 focus:ring-red-500"
                      />
                      <span className="text-sm text-white/80 group-hover:text-white">
                        <Link
                          href="/yasal/gizlilik"
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-cyan-400 hover:underline"
                        >
                          Gizlilik Politikası
                        </Link>
                        &apos;nı okudum ve kabul ediyorum.
                      </span>
                    </label>
                    <label className="flex items-start gap-3 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={dataProtectionAccepted}
                          onChange={(e) => setDataProtectionAccepted(e.target.checked)}
                          className="mt-1 rounded border-white/30 bg-black/40 text-red-500 focus:ring-red-500"
                        />
                        <span className="text-sm text-white/80 group-hover:text-white">
                          <Link
                            href={countryRule.legalPath}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-cyan-400 hover:underline"
                          >
                            {countryRule.legalLabel}
                          </Link>
                          &apos;ni okudum ve kabul ediyorum.
                        </span>
                      </label>
                  </div>
                </div>
              </div>

              <div className="text-xs text-white/50 space-y-1">
                <p className="font-medium text-white/60">Yasak içerikler:</p>
                <ul className="list-disc list-inside space-y-0.5">
                  {CONTENT_RULES.prohibited.map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                  <li>{CONTENT_RULES.consequence}</li>
                </ul>
              </div>

              {error && <p className="text-sm text-red-400">{error}</p>}
              <button
                type="button"
                onClick={handleSubscribe}
                disabled={
                  loading ||
                  !telifAccepted ||
                  !contentRulesAccepted ||
                  !termsOfServiceAccepted ||
                  !privacyPolicyAccepted ||
                  !dataProtectionAccepted
                }
                className="w-full py-3 px-6 rounded-xl bg-red-500 hover:bg-red-500/90 text-white font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    İşleniyor...
                  </>
                ) : (
                  <>
                    <UserPlus size={20} />
                    Şartları Kabul Edip Abone Ol
                  </>
                )}
              </button>
              <p className="text-xs text-white/50 text-center">
                Abone olarak AI içeriklerinizi NABZ-AI&apos;da paylaşma yetkisi kazanırsınız.
              </p>
            </div>
          )}

          <Link href="/" className="mt-6 inline-block text-sm text-white/50 hover:text-white">
            Ana Sayfaya Dön
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function AboneOlPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#050505] flex items-center justify-center"><div className="w-10 h-10 border-2 border-cyan-500/50 border-t-cyan-500 rounded-full animate-spin" /></div>}>
      <AboneOlContent />
    </Suspense>
  );
}
