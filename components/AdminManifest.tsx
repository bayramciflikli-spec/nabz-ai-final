"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * Admin sayfalarında PWA manifest linkini ve service worker'ı ekler.
 * Böylece Kontrol Kulesi masaüstüne yüklenebilir.
 */
export function AdminManifest() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname?.startsWith("/admin")) return;

    const link = document.createElement("link");
    link.rel = "manifest";
    link.href = "/manifest-admin.json";
    link.id = "admin-pwa-manifest";
    document.head.appendChild(link);

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    return () => {
      document.getElementById("admin-pwa-manifest")?.remove();
    };
  }, [pathname]);

  return null;
}
