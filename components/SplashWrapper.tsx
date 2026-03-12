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
              className="flex items-center justify-center w-full h-full"
              initial={false}
              animate={
                phase === "visible"
                  ? {}
                  : {
                      scale: [1, 1.2, 2.5, 5, 12],
                      opacity: [1, 1, 0.95, 0.6, 0],
                    }
              }
              transition={{
                duration: 0.9,
                times: [0, 0.2, 0.5, 0.75, 1],
                ease: [0.25, 0.46, 0.45, 0.94],
              }}
              onAnimationComplete={() => phase === "zooming" && onZoomComplete()}
            >
              <motion.div
                className="relative flex items-center justify-center"
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{
                  opacity: 1,
                  scale: 1,
                }}
                transition={{
                  duration: 0.8,
                  ease: "easeOut",
                }}
              >
                {/* Parlama: drop-shadow ile premium his */}
                <div
                  className="flex items-center justify-center p-4 sm:p-6"
                  style={{
                    filter: "drop-shadow(0 0 24px rgba(249,115,22,0.5)) drop-shadow(0 0 48px rgba(168,85,247,0.35)) drop-shadow(0 0 80px rgba(249,115,22,0.2))",
                  }}
                >
                  {/* Siyah arka planı kaldır, sadece renkli kısımlar: mix-blend-mode: screen */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/logo.jpg"
                    alt="NABZ-AI"
                    className="nabz-splash-logo w-48 h-48 sm:w-64 sm:h-64 object-contain select-none pointer-events-none"
                    style={{
                      mixBlendMode: "screen",
                      maxWidth: "min(80vw, 320px)",
                      maxHeight: "min(80vh, 320px)",
                    }}
                    decoding="async"
                    fetchPriority="high"
                    draggable={false}
                  />
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {children}
    </>
  );
}
