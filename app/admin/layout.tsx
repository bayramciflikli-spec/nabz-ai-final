"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, type User } from "firebase/auth";
import { isAdmin } from "@/lib/isAdmin";
import { useAuth } from "@/components/AuthProvider";
import { AdminShell } from "@/components/AdminShell";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const { setShowLoginModal } = useAuth();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setReady(true);
    });
    return () => unsub();
  }, []);

  if (!ready) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center gap-6 p-6">
        <div className="w-12 h-12 border-2 border-cyan-500/50 border-t-cyan-400 rounded-full animate-spin" />
        <p className="text-white/90 font-medium">Kontrol Kulesi yükleniyor...</p>
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

  return <AdminShell>{children}</AdminShell>;
}
