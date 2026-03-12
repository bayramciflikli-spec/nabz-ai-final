"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function SplashWrapper({ children }: { children: React.ReactNode }) {
  const [seen, setSeen] = useState(true);
  const [phase, setPhase] = useState<"visible" | "zooming" | "done">("visible");

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

  // 2 saniye sonra zoom-in geçişi başlat
  useEffect(() => {
    if (seen) return;
    const t = window.setTimeout(() => {
      setPhase("zooming");
    }, 2000);
    return () => window.clearTimeout(t);
  }, [seen]);

  const onZoomComplete = () => {
    setPhase("done");
    try {
      sessionStorage.setItem("nabz_splash_seen_v2", "1");
    } catch {}
    setSeen(true);
  };

  return (
    <>
      <AnimatePresence mode="wait">
        {!seen && (
          <motion.div
            key="splash"
            className="fixed inset-0 z-[200] bg-[#0F0F0F] select-none flex items-center justify-center"
            aria-label="NABZ-AI açılıyor"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            <motion.div
              className="relative flex items-center justify-center w-full h-full"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={
                phase === "visible"
                  ? { opacity: 1, scale: 1 }
                  : { opacity: 0, scale: 6 }
              }
              transition={{
                duration: phase === "visible" ? 0.9 : 0.8,
                ease: "easeInOut",
              }}
              onAnimationComplete={() => phase === "zooming" && onZoomComplete()}
            >
              {/* Parlama + tam ekran logo. background-image + mix-blend-mode: screen */}
              <div
                className="flex items-center justify-center w-full h-full"
                style={{
                  filter:
                    "drop-shadow(0 0 32px rgba(249,115,22,0.55)) drop-shadow(0 0 64px rgba(168,85,247,0.4)) drop-shadow(0 0 120px rgba(249,115,22,0.25))",
                }}
              >
                <div
                  role="img"
                  aria-label="NABZ-AI"
                  className="nabz-splash-logo w-full h-full bg-no-repeat bg-center bg-cover select-none pointer-events-none rounded-none"
                  style={{
                    backgroundImage: "url(/logo.jpg)",
                    mixBlendMode: "screen",
                  }}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {children}
    </>
  );
}
