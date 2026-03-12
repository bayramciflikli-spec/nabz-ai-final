"use client";

import { useEffect, useState } from "react";

export function SplashWrapper({ children }: { children: React.ReactNode }) {
  const [seen, setSeen] = useState(true);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    try {
      const key = "nabz_splash_seen_v1";
      const has = sessionStorage.getItem(key) === "1";
      if (!has) setSeen(false);
    } catch {
      setSeen(false);
    }
  }, []);

  useEffect(() => {
    if (seen) return;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    };
  }, [seen]);

  const start = () => {
    if (exiting) return;
    setExiting(true);
    try {
      sessionStorage.setItem("nabz_splash_seen_v1", "1");
    } catch {}
    window.setTimeout(() => {
      setSeen(true);
      setExiting(false);
    }, 1200);
  };

  // Tıklama yok: 3 saniye sonra otomatik geçiş
  useEffect(() => {
    if (seen) return;
    const t = window.setTimeout(() => start(), 3000);
    return () => window.clearTimeout(t);
  }, [seen]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      {!seen && (
        <div
          className={`fixed inset-0 z-[200] bg-transparent select-none ${exiting ? "nabz-splash-exit" : ""}`}
          aria-label="NABZ-AI açılıyor"
        >
          {/* Sadece logo: tam ekran, arka plan yok */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/nabz-ai-logo.png"
            alt="NABZ-AI"
            className="w-full h-full object-contain"
            draggable={false}
          />
        </div>
      )}
      {children}
    </>
  );
}
