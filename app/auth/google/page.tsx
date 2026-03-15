"use client";

import { useEffect, useState } from "react";
import { signInWithGoogle } from "@/lib/firebase-auth";
import { useAuth } from "@/components/AuthProvider";

/**
 * Sadece Google redirect girişi için sayfa.
 * Modal veya PWA'da yönlendirme tetiklenmiyorsa bu sayfayı doğrudan açın (aynı sekmede).
 */
export default function AuthGooglePage() {
  const { user, loading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (user) {
      window.location.href = "/";
      return;
    }
  }, [user]);

  useEffect(() => {
    if (user || loading || started) return;
    setStarted(true);
    let cancelled = false;
    const t = setTimeout(() => {
      signInWithGoogle()
        .then(() => {
          if (!cancelled) setError(null);
        })
        .catch((err) => {
          if (!cancelled) {
            const msg = err?.message || err?.code || "Yönlendirme başarısız.";
            setError(String(msg));
          }
        });
    }, 80);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [user, loading, started]);

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-950 text-white">
        <p className="text-red-400 mb-4">{error}</p>
        <a
          href="/"
          className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20"
        >
          Ana sayfaya dön
        </a>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-950 text-white">
      <p className="animate-pulse">Google&apos;a yönlendiriliyorsunuz...</p>
      <p className="text-sm text-white/60 mt-2">
        Sayfa birkaç saniye içinde açılmalı.
      </p>
    </div>
  );
}
