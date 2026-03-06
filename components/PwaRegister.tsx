"use client";

import { useEffect } from "react";

/**
 * Tüm sayfalarda PWA service worker'ı kaydeder.
 * Böylece uygulama "Uygulama olarak yükle" / "Add to Home Screen" ile indirilebilir.
 */
export function PwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);
  return null;
}
