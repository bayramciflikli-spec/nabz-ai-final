import type { Metadata } from "next";
import "./globals.css";
import { AdSenseWithConsent } from "@/components/AdSenseWithConsent";
import { CookieConsentBanner } from "@/components/CookieConsentBanner";
import { Header } from "@/components/Header";
import { MobileNavWrapper } from "@/components/MobileNavWrapper";
import { SplashWrapper } from "@/components/SplashWrapper";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { LegalFooter } from "@/components/LegalFooter";
import { AuthProvider } from "@/components/AuthProvider";
import { LocaleProvider } from "@/components/LocaleProvider";
import { CountryProvider } from "@/components/CountryProvider";
import { GlobalLoginModal } from "@/components/GlobalLoginModal";
import { SearchOverlayProvider } from "@/components/SearchOverlayContext";
import { SearchOverlay } from "@/components/SearchOverlay";
import { AdminManifest } from "@/components/AdminManifest";
import { PwaRegister } from "@/components/PwaRegister";
import { PwaInstallBanner } from "@/components/PwaInstallBanner";
import { BannedTermsLoader } from "@/components/BannedTermsLoader";
import { ToastProvider } from "@/components/ToastContext";

export const metadata: Metadata = {
  title: "Nabız - AI Video Platformu",
  description: "Kelimelerinizi saniyeler içinde sinematik videolara dönüştürün. Yapay zeka destekli video üretim platformu.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
      { url: "/icon-512.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", type: "image/png", sizes: "180x180" },
    ],
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <AdSenseWithConsent />
      <body className="antialiased min-h-screen bg-slate-950 text-white pb-24 lg:pb-0">
        <AdminManifest />
        <PwaRegister />
        <PwaInstallBanner />
        <BannedTermsLoader />
        <ErrorBoundary>
          <ToastProvider>
          <AuthProvider>
            <LocaleProvider>
              <CountryProvider>
                <SearchOverlayProvider>
                  <SearchOverlay />
                  <SplashWrapper>
                    <Header />
                    {children}
                    <LegalFooter />
                    <MobileNavWrapper />
                    <GlobalLoginModal />
                  </SplashWrapper>
                  <CookieConsentBanner />
                </SearchOverlayProvider>
              </CountryProvider>
            </LocaleProvider>
          </AuthProvider>
          </ToastProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
