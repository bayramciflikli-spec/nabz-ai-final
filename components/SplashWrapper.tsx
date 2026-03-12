"use client";

import { useEffect, useState } from "react";

export function SplashWrapper({ children }: { children: React.ReactNode }) {
  const [seen, setSeen] = useState(true);
  const [phase, setPhase] = useState<"enter" | "zooming">("enter");

  useEffect(() => {
    try {
      const key = "nabz_splash_seen_v2";
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

  useEffect(() => {
    if (seen) return;
    const t = window.setTimeout(() => setPhase("zooming"), 2000);
    return () => window.clearTimeout(t);
  }, [seen]);

  const onZoomEnd = () => {
    try {
      sessionStorage.setItem("nabz_splash_seen_v2", "1");
    } catch {}
    setSeen(true);
  };

  if (seen) return <>{children}</>;

  return (
    <>
      <div
        className="fixed inset-0 z-[200] bg-[#0F0F0F] select-none"
        aria-label="NABZ-AI açılıyor"
      >
        {/* Tam ekran logo, ışık/parlama yok, sadece CSS transform+opacity = akıcı */}
        <div
          className={`nabz-splash-layer nabz-splash-enter ${phase === "zooming" ? "nabz-splash-zoom" : ""}`}
          role="img"
          aria-label="NABZ-AI"
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: "url(/logo.jpg)",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "center",
            backgroundSize: "cover",
            mixBlendMode: "screen",
          }}
          onAnimationEnd={(e) => {
            if (e.animationName === "nabz-splash-zoom") onZoomEnd();
          }}
        />
      </div>
      {children}
    </>
  );
}
