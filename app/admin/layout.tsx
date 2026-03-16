"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { AdminShell } from "@/components/AdminShell";
import { AdminCodeGate } from "@/components/AdminCodeGate";
import { signInWithGoogle } from "@/lib/firebase-auth";

const AUTH_READY_TIMEOUT_MS = 2000;
/** Giriş yoksa Google ile otomatik yönlendirme gecikmesi (ms). Bir kez giriş yaptıktan sonra tarayıcı sizi tanır. */
const AUTO_SIGNIN_DELAY_MS = 1500;

/** Vercel Environment Variables ile Firebase config eşleşmesini kontrol et; eksikse konsola uyarı yaz. */
function logFirebaseConfigCheck() {
  if (typeof window === "undefined") return;
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const missing: string[] = [];
  if (!apiKey?.trim()) missing.push("NEXT_PUBLIC_FIREBASE_API_KEY");
  if (!authDomain?.trim()) missing.push("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN");
  if (!projectId?.trim()) missing.push("NEXT_PUBLIC_FIREBASE_PROJECT_ID");
  if (missing.length > 0) {
    console.warn("[Admin] Firebase config eksik (Vercel Environment Variables ile eşleşmeyi kontrol edin):", missing);
  }
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading: authLoading, setShowLoginModal } = useAuth();
  const [ready, setReady] = useState(false);
  const [deviceVerified, setDeviceVerified] = useState<boolean | null>(null);
  const [showFallback, setShowFallback] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [autoRedirecting, setAutoRedirecting] = useState(false);
  const autoRedirectDone = useRef(false);

  useEffect(() => {
    logFirebaseConfigCheck();
  }, []);

  useEffect(() => {
    if (!authLoading) setReady(true);
    const t = setTimeout(() => {
      setReady(true);
      setShowFallback(true);
    }, AUTH_READY_TIMEOUT_MS);
    return () => clearTimeout(t);
  }, [authLoading]);

  // ACİL DURUM MODU: Cihaz kontrolü API'si çağrılmıyor; 401 kaynağı tamamen kaldırıldı. Giriş yapılmışsa doğrudan verified say.
  useEffect(() => {
    if (!user) {
      setDeviceVerified(null);
      setAuthError(null);
      return;
    }
    setAuthError(null);
    setDeviceVerified(true);
  }, [user]);

  if (!ready) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center gap-6 p-6">
        <div className="w-12 h-12 border-2 border-cyan-500/50 border-t-cyan-400 rounded-full animate-spin" />
        <p className="text-white/90 font-medium">Kontrol Kulesi yükleniyor...</p>
        {showFallback && (
          <div className="flex flex-col sm:flex-row gap-3 mt-4">
            <button
              type="button"
              onClick={() => setShowLoginModal(true)}
              className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-medium"
            >
              Giriş yap
            </button>
            <Link
              href="/"
              className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm text-center"
            >
              Ana sayfa
            </Link>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 text-sm"
            >
              Yenile
            </button>
          </div>
        )}
      </div>
    );
  }

  // Giriş yoksa: bir kez Google ile giriş yaptıktan sonra bu tarayıcı sizi tanır; otomatik yönlendirme ile tek tıkla giriş
  useEffect(() => {
    if (user || authLoading || autoRedirectDone.current) return;
    autoRedirectDone.current = true;
    const t = setTimeout(() => {
      setAutoRedirecting(true);
      signInWithGoogle().catch(() => setAutoRedirecting(false));
    }, AUTO_SIGNIN_DELAY_MS);
    return () => clearTimeout(t);
  }, [user, authLoading]);

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center gap-6 p-6 text-center">
        {autoRedirecting ? (
          <>
            <div className="w-12 h-12 border-2 border-cyan-500/50 border-t-cyan-400 rounded-full animate-spin" />
            <p className="text-white/90 font-medium text-lg">Google ile giriş sayfasına yönlendiriliyorsunuz...</p>
            <p className="text-white/60 text-sm max-w-sm">
              bayramciflikli@gmail.com veya kullandığınız hesabı seçin. Bir kez giriş yaptıktan sonra bu tarayıcı sizi otomatik tanır.
            </p>
          </>
        ) : (
          <>
            <p className="text-white/90 font-medium text-lg">Kontrol Kulesi için giriş yapın</p>
            <p className="text-white/60 text-sm max-w-sm">
              Birkaç saniye içinde Google ile giriş sayfasına yönlendirileceksiniz. Bir kez giriş yaptıktan sonra tarayıcı sizi hatırlar.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => { setAutoRedirecting(true); signInWithGoogle().catch(() => setAutoRedirecting(false)); }}
                className="px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white font-semibold transition-colors"
              >
                Şimdi Google ile giriş yap
              </button>
              <Link
                href="/"
                className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold transition-colors border border-white/20 text-center"
              >
                Ana sayfaya git
              </Link>
            </div>
          </>
        )}
      </div>
    );
  }

  // ACİL DURUM MODU: UID kontrolü geçici olarak devre dışı. Herhangi bir giriş yapılmışsa (user) içeri al.
  // if (!isAdmin(user.uid)) { return (... yetkiniz yok ...); }
  if (typeof window !== "undefined") {
    console.log("DEBUG: Guvenlik gecici olarak devre disi birakildi. Giris yapan UID:", user.uid);
  }

  if (deviceVerified === null) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center gap-6 p-6">
        <div className="w-12 h-12 border-2 border-cyan-500/50 border-t-cyan-400 rounded-full animate-spin" />
        <p className="text-white/90 font-medium">Doğrulama kontrol ediliyor...</p>
      </div>
    );
  }

  if (deviceVerified === false) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center pb-8">
        {authError && (
          <div className="w-full max-w-md p-4 mx-4 mt-6 rounded-xl bg-red-500/20 border border-red-500/50 text-red-300 text-center text-sm font-medium">
            {authError}
            <p className="text-red-300/80 text-xs mt-2">
              Vercel Environment Variables içinde NEXT_PUBLIC_FIREBASE_* ve NEXT_PUBLIC_ADMIN_UIDS değerlerini kontrol edin.
            </p>
          </div>
        )}
        {/* Acil Durum: Firebase Auth başarılıysa cihaz kontrolü hata verse bile panele girilebilir */}
        <div className="w-full max-w-md p-4 mx-4 mt-4 rounded-xl bg-amber-500/20 border border-amber-500/50 text-amber-200 text-center text-sm">
          <p className="font-medium mb-2">Acil Durum geçişi</p>
          <p className="text-amber-200/80 text-xs mb-3">Firebase Auth başarılı; cihaz doğrulaması atlandı. Geçici olarak panele girebilirsiniz.</p>
          <button
            type="button"
            onClick={() => { setDeviceVerified(true); setAuthError(null); }}
            className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-semibold text-sm"
          >
            Panele gir
          </button>
        </div>
        <div className="w-full max-w-md mt-6 px-4">
          <p className="text-white/50 text-xs text-center mb-3">veya e-posta kodu ile doğrula:</p>
          <AdminCodeGate onVerified={() => { setDeviceVerified(true); setAuthError(null); }} />
        </div>
      </div>
    );
  }

  return <AdminShell>{children}</AdminShell>;
}

