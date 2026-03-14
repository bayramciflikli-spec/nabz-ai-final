"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Plus, Library, User } from "lucide-react";
import { useLocale } from "@/components/LocaleProvider";

const navItemKeys = [
  { icon: Home, href: "/", labelKey: "nav.home" },
  { icon: Search, href: "/", labelKey: "nav.search" },
  { icon: Plus, href: "/create", labelKey: "nav.create", special: true },
  { icon: Library, href: "/library", labelKey: "nav.library" },
  { icon: User, href: "/", labelKey: "nav.profile", isProfile: true },
];

interface MobileNavProps {
  user?: { uid?: string } | null;
}

export const MobileNav = ({ user }: MobileNavProps) => {
  const pathname = usePathname();
  const { t } = useLocale();

  const navItems = navItemKeys.map((item) => ({ ...item, label: t(item.labelKey) }));

  const getHref = (item: (typeof navItems)[0]) => {
    if (item.isProfile && user?.uid) return `/channel/${user.uid}`;
    return item.href;
  };

  return (
    <div className="fixed left-1/2 -translate-x-1/2 w-[90%] max-w-md h-16 bg-black/40 backdrop-blur-2xl border border-white/10 rounded-full flex items-center justify-around px-6 z-50 shadow-[0_10px_40px_rgba(0,0,0,0.5)] lg:hidden" style={{ bottom: "calc(1.5rem + env(safe-area-inset-bottom, 0px))" }}>
      {navItems.map((item) => {
        const Icon = item.icon;
        const href = getHref(item);
        const isActive = pathname === href || (item.href === "/" && pathname === "/");

        if (item.special) {
          return (
            <Link
              key={item.label}
              href={item.href}
              className="relative -top-8 w-16 h-16 bg-gradient-to-tr from-purple-600 to-green-400 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(168,85,247,0.6)] border-4 border-black/50 hover:scale-105 active:scale-95 transition-transform duration-200"
              aria-label={item.label}
            >
              <Plus className="text-white w-8 h-8" />
            </Link>
          );
        }

        return (
          <Link
            key={item.label}
            href={href}
            className={`p-2 rounded-full transition-all duration-200 active:scale-90 ${isActive ? "text-white" : "text-gray-400 hover:text-white"}`}
            aria-label={item.label}
          >
            <Icon className="w-6 h-6" />
          </Link>
        );
      })}
    </div>
  );
};
