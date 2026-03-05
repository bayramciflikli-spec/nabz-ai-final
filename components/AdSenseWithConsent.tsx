"use client";

import { useState, useEffect } from "react";
import Script from "next/script";
import { hasCookieConsent } from "./CookieConsentBanner";

/**
 * AdSense yalnızca çerez onayı verildiyse yüklenir (GDPR uyumu).
 */
export function AdSenseWithConsent() {
  const [loadAdSense, setLoadAdSense] = useState(false);
  const clientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;

  useEffect(() => {
    if (!clientId) return;
    if (hasCookieConsent()) {
      setLoadAdSense(true);
      return;
    }
    const handler = () => setLoadAdSense(true);
    window.addEventListener("cookie-consent-accepted", handler);
    return () => window.removeEventListener("cookie-consent-accepted", handler);
  }, [clientId]);

  if (!clientId || !loadAdSense) return null;

  return (
    <Script
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`}
      strategy="afterInteractive"
      crossOrigin="anonymous"
    />
  );
}
