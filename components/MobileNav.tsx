"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Library, User } from "lucide-react";
import { useLocale } from "@/components/LocaleProvider";

const navItemKeys = [
  { icon: Home, href: "/", labelKey: "nav.home" },
  { icon: Search, href: "/", labelKey: "nav.search" },
  { icon: null, href: "/dream", labelKey: "nav.dream", isCenterLogo: true },
  { icon: Library, href: "/library", labelKey: "nav.library" },
  { icon: User, href: "/", labelKey: "nav.profile", isProfile: true },
];

function HalfMoonText() {
  return (
    <svg
      viewBox="0 0 140 32"
      className="w-[100px] h-6 flex-shrink-0"
      aria-hidden
    >
      <defs>
        <path
          id="arcPath"
          d="M 12 26 A 58 58 0 0 1 128 26"
          fill="none"
        />
      </defs>
      <text
        className="fill-white/90 text-[10px] font-semibold tracking-wide"
        style={{ fontFamily: "system-ui, sans-serif" }}
      >
        <textPath href="#arcPath" startOffset="0%">
          hayal et, paylaş
        </textPath>
      </text>
    </svg>
  );
}

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
    <nav
      className="fixed left-0 right-0 bottom-0 z-50 lg:hidden bg-black/95 backdrop-blur-xl border-t border-white/10"
      style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom, 0px))" }}
      aria-label="Ana menü"
    >
      <div className="flex items-end justify-around h-16 px-1">
        {navItems.map((item) => {
          const href = getHref(item);
          const isActive =
            pathname === href ||
            (item.href === "/" && pathname === "/") ||
            (item.href === "/dream" && pathname === "/dream");

          if (item.isCenterLogo) {
            return (
              <Link
                key={item.labelKey}
                href={href}
                className="flex flex-col items-center justify-end -mb-1 gap-0.5 active:scale-95 transition-transform"
                aria-label={t("nav.dream")}
              >
                <div className="w-12 h-12 rounded-full overflow-hidden bg-white/10 border-2 border-white/20 flex items-center justify-center flex-shrink-0">
                  <img
                    src="/nabz-ai-logo.png"
                    alt=""
                    className="w-8 h-8 object-contain"
                  />
                </div>
                <HalfMoonText />
              </Link>
            );
          }

          const Icon = item.icon!;
          return (
            <Link
              key={item.labelKey}
              href={href}
              className={`flex flex-col items-center justify-center gap-1 py-2 px-3 min-w-[56px] rounded-lg transition-colors ${
                isActive ? "text-white" : "text-white/50 hover:text-white/80"
              }`}
              aria-label={item.label}
            >
              <Icon className="w-6 h-6" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
