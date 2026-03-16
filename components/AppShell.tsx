"use client";

import { usePathname } from "next/navigation";
import { Header } from "@/components/Header";
import { MobileNavWrapper } from "@/components/MobileNavWrapper";
import { LegalFooter } from "@/components/LegalFooter";
import { SearchOverlay } from "@/components/SearchOverlay";
import { CookieConsentBanner } from "@/components/CookieConsentBanner";
import { SplashWrapper } from "@/components/SplashWrapper";

/**
 * Ana uygulama kabuğu: Header, Footer, alt nav sadece uygulama sayfalarında.
 * /admin* rotasında hiçbiri gösterilmez — NABZ-AI üzerinde tam kontrol admin panelinden.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <>
      <SearchOverlay />
      <SplashWrapper>
        <Header />
        {children}
        <LegalFooter />
        <MobileNavWrapper />
      </SplashWrapper>
      <CookieConsentBanner />
    </>
  );
}
