"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const STORAGE_KEY = "cookie_consent";

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const consent = localStorage.getItem(STORAGE_KEY);
    if (consent === null) setVisible(true);
  }, []);

  const handleChoice = (accepted: boolean) => {
    localStorage.setItem(STORAGE_KEY, accepted ? "accepted" : "rejected");
    setVisible(false);
    if (accepted) {
      window.dispatchEvent(new CustomEvent("cookie-consent-accepted"));
    }
  };

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[9999] p-4 bg-slate-900/95 backdrop-blur border-t border-white/10"
      role="dialog"
      aria-label="Çerez onayı"
    >
      <div className="max-w-2xl mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <p className="text-sm text-white/90 flex-1">
          Platform, hizmet ve reklamlar için çerez kullanır. Gizlilik politikamızı okuyun.{" "}
          <Link href="/yasal/gizlilik" className="text-cyan-400 hover:underline">
            Gizlilik Politikası
          </Link>
        </p>
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={() => handleChoice(false)}
            className="px-4 py-2 rounded-lg border border-white/20 text-white/80 hover:bg-white/5 text-sm"
          >
            Reddet
          </button>
          <button
            onClick={() => handleChoice(true)}
            className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-medium"
          >
            Kabul Et
          </button>
        </div>
      </div>
    </div>
  );
}

export function hasCookieConsent(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(STORAGE_KEY) === "accepted";
}
