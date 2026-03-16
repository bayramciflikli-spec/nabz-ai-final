"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, type User } from "firebase/auth";
import { isAdmin } from "@/lib/isAdmin";
import { AdminShell } from "@/components/AdminShell";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

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
        <p className="text-white/90 font-medium text-lg">Kontrol Kulesi için giriş yapmanız gerekiyor.</p>
        <p className="text-white/60 text-sm max-w-sm">
          Önce ana sayfaya gidip sağ üstten Gmail ile giriş yapın. Girişten sonra bu sayfayı açın veya ana sayfadaki &quot;Kontrol Kulesi&quot;ne tıklayın.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/"
            className="px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white font-semibold transition-colors"
          >
            Ana sayfaya git ve giriş yap
          </Link>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold transition-colors border border-white/20"
          >
            Sayfayı yenile
          </button>
        </div>
      </div>
    );
  }

  if (!isAdmin(user.uid)) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center gap-6 p-6 text-center">
        <p className="text-white/90 font-medium text-lg">Bu sayfaya erişim yetkiniz yok.</p>
        <p className="text-white/60 text-sm">Sadece admin hesabı (Gmail) ile giriş yapıldığında Kontrol Kulesi açılır.</p>
        <Link
          href="/"
          className="px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white font-semibold transition-colors"
        >
          Ana sayfaya dön
        </Link>
      </div>
    );
  }

  return <AdminShell>{children}</AdminShell>;
}
