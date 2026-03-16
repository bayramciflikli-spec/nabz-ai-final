"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { isAdmin } from "@/lib/isAdmin";
import { useAuth } from "@/components/AuthProvider";
import { AdminShell } from "@/components/AdminShell";
import { AdminCodeGate } from "@/components/AdminCodeGate";
import { fetchWithAuth } from "@/lib/fetchWithAuth";

const AUTH_READY_TIMEOUT_MS = 2000;
const DEVICE_STATUS_TIMEOUT_MS = 6000;

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

  useEffect(() => {
    if (!user || !isAdmin(user.uid)) {
      setDeviceVerified(null);
      setAuthError(null);
      return;
    }
    setAuthError(null);
    let cancelled = false;
    const timeoutId = setTimeout(() => {
      if (!cancelled) setDeviceVerified(false);
    }, DEVICE_STATUS_TIMEOUT_MS);

    fetchWithAuth("/api/admin/verify-device/status", { credentials: "include" })
      .then((res) => {
        if (res.status === 401) {
          console.error("[Admin] 401 Unauthorized – verify-device/status. UID veya token uyuşmuyor.");
          if (!cancelled) setAuthError("Yetki Hatası: UID uyuşmuyor");
        }
        return res.ok ? res.json() : { verified: false };
      })
      .then((data) => {
        if (!cancelled) setDeviceVerified(data?.verified === true);
      })
      .catch((err) => {
        console.error("[Admin] verify-device/status isteği hatası:", err);
        if (!cancelled) setDeviceVerified(false);
      })
      .finally(() => clearTimeout(timeoutId));

    return () => {
      cancelled = true;
    };
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

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center gap-6 p-6 text-center">
        <p className="text-white/90 font-medium text-lg">Kontrol Kulesi için giriş yapın</p>
        <p className="text-white/60 text-sm max-w-sm">
          Bir kez giriş yaptıktan sonra tarayıcı sizi hatırlar; çıkış yapana kadar tekrar giriş gerekmez.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={() => setShowLoginModal(true)}
            className="px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white font-semibold transition-colors"
          >
            Giriş yap
          </button>
          <Link
            href="/"
            className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold transition-colors border border-white/20 text-center"
          >
            Ana sayfaya git
          </Link>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 font-medium transition-colors border border-white/10 text-sm"
          >
            Yenile
          </button>
        </div>
      </div>
    );
  }

  if (!isAdmin(user.uid)) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center gap-6 p-6 text-center max-w-md">
        <p className="text-white/90 font-medium text-lg">Bu sayfaya erişim yetkiniz yok</p>
        <p className="text-white/60 text-sm">
          Sadece yetkili admin hesabıyla giriş yapıldığında Kontrol Kulesi açılır. Bir kez giriş yaptıktan sonra tarayıcı sizi hatırlar.
        </p>
        <p className="text-white/40 text-xs">
          Giriş yaptıysanız, UID&apos;nizin proje ayarlarındaki <code className="bg-white/10 px-1 rounded">NEXT_PUBLIC_ADMIN_UIDS</code> listesinde olduğundan emin olun.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={() => setShowLoginModal(true)}
            className="px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white font-semibold transition-colors"
          >
            Farklı hesapla giriş yap
          </button>
          <Link
            href="/"
            className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold transition-colors border border-white/20 text-center"
          >
            Ana sayfaya dön
          </Link>
        </div>
      </div>
    );
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
