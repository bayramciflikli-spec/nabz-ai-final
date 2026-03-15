"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Library, User } from "lucide-react";
import type { User as FirebaseUser } from "firebase/auth";
import { useLocale } from "@/components/LocaleProvider";
import { HayalEtPaylasModal } from "@/components/HayalEtPaylasModal";
import { MobileProfileSheet } from "@/components/MobileProfileSheet";

const navItemKeys = [
  { icon: Home, href: "/", labelKey: "nav.home" },
  { icon: Search, href: "/search", labelKey: "nav.search" },
  { icon: Home, href: "/", labelKey: "nav.create", special: true },
  { icon: Library, href: "/library", labelKey: "nav.library" },
  { icon: User, href: "/", labelKey: "nav.profile", isProfile: true },
];

interface MobileNavProps {
  user?: FirebaseUser | null;
}

export const MobileNav = ({ user }: MobileNavProps) => {
  const pathname = usePathname();
  const { t } = useLocale();
  const [hayalModalOpen, setHayalModalOpen] = useState(false);
  const [profileSheetOpen, setProfileSheetOpen] = useState(false);
  const navItems = navItemKeys.map((item) => ({ ...item, label: t(item.labelKey) }));

  const getHref = (item: (typeof navItems)[0]) => {
    if (item.isProfile && user?.uid) return `/channel/${user.uid}`;
    return item.href;
  };

  const isActive = (item: (typeof navItems)[0]) => {
    if (item.isProfile) return false;
    const href = getHref(item);
    if (item.href === "/" && !item.isProfile) return pathname === "/";
    if (item.href === "/search") return pathname === "/search" || pathname?.startsWith("/search");
    return pathname === href;
  };

  return (
    <>
      {/* YouTube tarzı alt bar: tam genişlik, sabit altta, tıklanınca ilgili sayfaya */}
      <div
        className="fixed left-0 right-0 bottom-0 h-14 bg-black/95 border-t border-white/10 flex items-center justify-around z-[100] lg:hidden safe-area-pb"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const href = getHref(item);
          const active = isActive(item);
          const isCenter = item.special;

          if (isCenter) {
            return (
              <button
                key={item.label}
                type="button"
                onClick={() => setHayalModalOpen(true)}
                className="flex flex-col items-center justify-center flex-1 min-w-0 py-2 gap-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50 rounded-lg"
                aria-label={t("home.hayalEtPaylas")}
              >
                <span className="flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-br from-red-500/90 to-red-700/90 border border-white/20 overflow-hidden shrink-0">
                  <img src="/nabz-ai-logo.png" alt="" className="w-full h-full object-contain p-1" />
                </span>
                <span className="text-[10px] font-medium text-white/90 truncate max-w-full px-0.5">
                  {t("home.hayalEtPaylas").split(",")[0]}
                </span>
              </button>
            );
          }

          if (item.isProfile) {
            return (
              <button
                key={item.label}
                type="button"
                onClick={() => setProfileSheetOpen(true)}
                className="flex flex-col items-center justify-center flex-1 min-w-0 py-2 gap-0.5 rounded-lg transition-colors active:scale-95 text-gray-400 hover:text-white"
                aria-label={item.label}
              >
                {user?.photoURL ? (
                  <span className="w-8 h-8 rounded-full overflow-hidden shrink-0 flex items-center justify-center bg-white/10 border border-white/20">
                    <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
                  </span>
                ) : (
                  <Icon className="w-6 h-6 shrink-0" />
                )}
                <span className="text-[10px] font-medium truncate max-w-full px-0.5">{item.label}</span>
              </button>
            );
          }

          return (
            <Link
              key={item.label}
              href={href}
              className={`flex flex-col items-center justify-center flex-1 min-w-0 py-2 gap-0.5 rounded-lg transition-colors active:scale-95 ${active ? "text-white" : "text-gray-400 hover:text-white"}`}
              aria-label={item.label}
            >
              <Icon className="w-6 h-6 shrink-0" />
              <span className="text-[10px] font-medium truncate max-w-full px-0.5">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>

      <HayalEtPaylasModal open={hayalModalOpen} onClose={() => setHayalModalOpen(false)} />
      <MobileProfileSheet open={profileSheetOpen} onClose={() => setProfileSheetOpen(false)} user={user ?? null} />
    </>
  );
};
