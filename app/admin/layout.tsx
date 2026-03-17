"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/components/AuthProvider";
import { AdminShell } from "@/components/AdminShell";
import { signInWithGoogle, getAuthConfigStatus } from "@/lib/firebase-auth";

/** Uygulama oturumunu tanıması için bekleme (Firebase aynı tarayıcıda sizi tanır). */
const AUTH_READY_MS = 6000;
/** Giriş yoksa sessizce Google'a yönlendirme gecikmesi – giriş ekranı yok. */
const REDIRECT_DELAY_MS = 800;

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading: authLoading } = useAuth();
  const [ready, setReady] = useState(false);
  const [deviceVerified, setDeviceVerified] = useState<boolean | null>(null);
  const redirectDone = useRef(false);

  useEffect(() => {
    if (!authLoading) setReady(true);
    const t = setTimeout(() => setReady(true), AUTH_READY_MS);
    return () => clearTimeout(t);
  }, [authLoading]);

  useEffect(() => {
    if (!user) {
      setDeviceVerified(null);
      return;
    }
    setDeviceVerified(true);
  }, [user]);

  useEffect(() => {
    if (user || authLoading || redirectDone.current) return;
    if (!getAuthConfigStatus().ok) return;
    redirectDone.current = true;
    const t = setTimeout(() => signInWithGoogle().catch(() => {}), REDIRECT_DELAY_MS);
    return () => clearTimeout(t);
  }, [user, authLoading]);

  // Tek ekran: sadece yükleniyor. Giriş istemiyoruz – uygulama sizi tanısın.
  if (!ready || (!user && authLoading)) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center gap-4 p-6">
        <div className="w-10 h-10 border-2 border-cyan-500/50 border-t-cyan-400 rounded-full animate-spin" />
        <p className="text-white/80 text-sm">Yükleniyor...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center gap-4 p-6">
        <div className="w-10 h-10 border-2 border-cyan-500/50 border-t-cyan-400 rounded-full animate-spin" />
        <p className="text-white/80 text-sm">Yönlendiriliyorsunuz...</p>
      </div>
    );
  }

  if (deviceVerified === null) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center gap-4 p-6">
        <div className="w-10 h-10 border-2 border-cyan-500/50 border-t-cyan-400 rounded-full animate-spin" />
        <p className="text-white/80 text-sm">Yükleniyor...</p>
      </div>
    );
  }

  return <AdminShell>{children}</AdminShell>;
}

