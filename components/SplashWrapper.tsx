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

  return (
    <>
      {!seen && (
        <div
          className={`fixed inset-0 z-[200] bg-black cursor-pointer select-none ${exiting ? "nabz-splash-exit" : ""}`}
          onClick={start}
          role="button"
          aria-label="NABZ-AI aç"
        >
          <div className="absolute inset-0">
            {/* Tam ekran: boşluksuz, YouTube gibi full-bleed */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/nabz-ai-logo.png"
              alt="NABZ-AI"
              className="w-full h-full object-cover"
              draggable={false}
            />
          </div>

          {/* Oynat: logonun ortası; tıklayınca içinden geçiş hissi */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className={`nabz-splash-play ${exiting ? "nabz-splash-play-exit" : ""}`}>
              <div className="nabz-splash-play-inner" aria-hidden />
            </div>
          </div>
        </div>
      )}
      {children}
    </>
  );
}
