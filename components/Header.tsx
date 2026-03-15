"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Upload } from "lucide-react";
import { useLocale } from "@/components/LocaleProvider";
import { UserMenu } from "@/components/UserMenu";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, type User } from "firebase/auth";

export function Header() {
  const pathname = usePathname();
  const { t } = useLocale();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, setUser);
    return () => unsub();
  }, []);

  if (pathname === "/landing" || pathname === "/" || pathname?.startsWith("/search") || pathname === "/mall" || pathname?.startsWith("/project/")) return null;

  return (
    <header className="border-b border-slate-800 bg-slate-900/50 sticky top-0 z-10">
      <nav className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <Link href="/" className="text-slate-300 hover:text-white font-medium transition-colors">
          {t("nav.home")}
        </Link>
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="text-slate-400 hover:text-white text-sm font-medium transition-colors"
          >
            {t("nav.nabz")}
          </Link>
          <Link
            href="/upload"
            className="inline-flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold px-3 sm:px-4 py-2 rounded-lg transition-colors shrink-0 text-sm sm:text-base"
            title={t("nav.upload")}
          >
            <Upload size={18} className="shrink-0" />
            <span className="hidden sm:inline">{t("nav.upload")}</span>
          </Link>
          <UserMenu user={user} />
        </div>
      </nav>
    </header>
  );
}
