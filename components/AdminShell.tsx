"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { GripVertical, ExternalLink, Shield, Menu, X } from "lucide-react";

const ADMIN_TITLE = "NABZ-AI Kontrol Paneli";

const ADMIN_NAV = [
  { label: "Kontrol Kulesi", href: "/admin" },
  { label: "Ekosistemim", href: "/admin/ecosystem" },
  { label: "Global Onay Kuyruğu", href: "/admin/global-control" },
  { label: "Kullanıcı Yönetimi", href: "/admin/users" },
  { label: "Financial Hub", href: "/admin/financial" },
  { label: "Şeffaflık Raporu", href: "/admin/transparency" },
  { label: "Hukuki Filtreler", href: "/admin/legal-filters" },
  { label: "Yasaklı Kelime/İçerik", href: "/admin/banned-content" },
  { label: "Sanal AVM", href: "/mall" },
] as const;

/**
 * Admin panel kabuğu: Bilgisayar ve mobilde aynı içerik; mobilde menü hamburger ile açılır.
 */
export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    document.title = ADMIN_TITLE;
  }, []);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  const navContent = (
    <>
      <div className="flex items-center gap-2 mb-2">
        <Shield className="w-6 h-6 text-amber-400 shrink-0" aria-hidden />
        <span className="font-['Orbitron'] font-black text-lg bg-gradient-to-r from-cyan-400 to-amber-500 bg-clip-text text-transparent">
          NABZ-AI CTRL
        </span>
      </div>
      <p className="text-[11px] text-white/50 mb-6 leading-tight">
        Uygulama üzerinde tam kontrol ve müdahale bu panelden yapılır.
      </p>
      <nav className="flex flex-col gap-1 flex-1">
        {ADMIN_NAV.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/admin" && pathname?.startsWith(item.href));
          return (
            <Link
              key={item.href + item.label}
              href={item.href}
              className={`px-4 py-3 rounded-lg transition-colors flex items-center gap-2 ${
                isActive ? "bg-cyan-500/10 text-cyan-400" : "hover:bg-white/5 text-white/70"
              }`}
            >
              <GripVertical size={14} className="opacity-50 shrink-0" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="pt-4 mt-4 border-t border-white/10">
        <Link
          href="/"
          className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 text-sm font-medium border border-white/10 transition-colors"
        >
          <ExternalLink size={16} />
          NABZ-AI uygulamasına git
        </Link>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-[#0a0a0a] text-white">
      {/* Masaüstü: sabit sidebar */}
      <aside className="hidden lg:flex w-[260px] shrink-0 bg-[#111] border-r border-white/10 flex-col p-6">
        {navContent}
      </aside>

      {/* Mobil: hamburger + overlay sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden
        />
      )}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-[280px] max-w-[85vw] bg-[#111] border-r border-white/10 flex flex-col p-6 transition-transform duration-200 lg:hidden ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {navContent}
      </aside>

      <main className="flex-1 min-w-0 overflow-y-auto">
        <div className="lg:hidden flex items-center gap-3 p-4 border-b border-white/10 bg-[#0a0a0a] sticky top-0 z-30">
          <button
            type="button"
            onClick={() => setSidebarOpen((o) => !o)}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white"
            aria-label="Menüyü aç"
          >
            {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
          <span className="font-['Orbitron'] font-bold text-sm text-cyan-400">Kontrol Kulesi</span>
        </div>
        {children}
      </main>
    </div>
  );
}
