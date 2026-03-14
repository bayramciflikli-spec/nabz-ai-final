"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Plus, Library, User } from "lucide-react";
import { useLocale } from "@/components/LocaleProvider";
import { HayalEtPaylasModal } from "@/components/HayalEtPaylasModal";

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

/** Hilal (crescent) şeklinde kavisli metin – SVG textPath ile */
function HilalText({ text, className = "" }: { text: string; className?: string }) {
  return (
    <svg viewBox="0 0 120 28" className={className} aria-hidden>
      <defs>
        <path id="hilal-path" d="M 8 22 Q 60 4 112 22" fill="none" />
      </defs>
      <text className="fill-current text-white font-semibold text-[10px] sm:text-xs">
        <textPath href="#hilal-path" startOffset="50%" textAnchor="middle">
          {text}
        </textPath>
      </text>
    </svg>
  );
}

export const MobileNav = ({ user }: MobileNavProps) => {
  const pathname = usePathname();
  const { t } = useLocale();
  const [hayalModalOpen, setHayalModalOpen] = useState(false);
  const isHome = pathname === "/";

  const navItems = navItemKeys.map((item) => ({ ...item, label: t(item.labelKey) }));

  const getHref = (item: (typeof navItems)[0]) => {
    if (item.isProfile && user?.uid) return `/channel/${user.uid}`;
    return item.href;
  };

  return (
    <>
      <div
        className="fixed left-1/2 -translate-x-1/2 w-[90%] max-w-md min-h-[72px] bg-black/40 backdrop-blur-2xl border border-white/10 rounded-full flex items-center justify-around px-4 sm:px-6 z-50 shadow-[0_10px_40px_rgba(0,0,0,0.5)] lg:hidden"
        style={{ bottom: "calc(1.5rem + env(safe-area-inset-bottom, 0px))" }}
      >
        {navItems.map((item, index) => {
          const Icon = item.icon;
          const href = getHref(item);
          const isActive = pathname === href || (item.href === "/" && pathname === "/");
          const isCenter = item.special;

          if (isCenter && isHome) {
            return (
              <button
                key={item.label}
                type="button"
                onClick={() => setHayalModalOpen(true)}
                className="relative -top-6 flex flex-col items-center justify-center w-16 min-w-[64px] focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50 rounded-full"
                aria-label={t("home.hayalEtPaylas")}
              >
                <span className="flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-red-500/90 to-red-700/90 border-2 border-white/20 shadow-[0_0_24px_rgba(220,38,38,0.5)] overflow-hidden">
                  <img
                    src="/nabz-ai-logo.png"
                    alt=""
                    className="w-full h-full object-contain p-1.5"
                  />
                </span>
                <HilalText text={t("home.hayalEtPaylas")} className="w-24 mt-1 shrink-0" />
              </button>
            );
          }

          if (isCenter) {
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

      <HayalEtPaylasModal open={hayalModalOpen} onClose={() => setHayalModalOpen(false)} />
    </>
  );
};
