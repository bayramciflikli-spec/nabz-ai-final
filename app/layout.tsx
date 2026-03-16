import type { Metadata } from "next";
import "./globals.css";
import { AdSenseWithConsent } from "@/components/AdSenseWithConsent";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AuthProvider } from "@/components/AuthProvider";
import { LocaleProvider } from "@/components/LocaleProvider";
import { CountryProvider } from "@/components/CountryProvider";
import { SearchOverlayProvider } from "@/components/SearchOverlayContext";
import { AdminManifest } from "@/components/AdminManifest";
import { PwaRegister } from "@/components/PwaRegister";
import { PwaInstallBanner } from "@/components/PwaInstallBanner";
import { BannedTermsLoader } from "@/components/BannedTermsLoader";
import { ToastProvider } from "@/components/ToastContext";
import { AppShell } from "@/components/AppShell";

export const metadata: Metadata = {
  title: "Nabız - AI Video Platformu",
  description: "Kelimelerinizi saniyeler içinde sinematik videolara dönüştürün. Yapay zeka destekli video üretim platformu.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/api/pwa-icon/32", type: "image/png", sizes: "32x32" },
      { url: "/api/pwa-icon/192", type: "image/png", sizes: "192x192" },
      { url: "/api/pwa-icon/512", type: "image/png", sizes: "512x512" },
    ],
    apple: [
      { url: "/api/pwa-icon/180", type: "image/png", sizes: "180x180" },
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
                    <AppShell>{children}</AppShell>
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
