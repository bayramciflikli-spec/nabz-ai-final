"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Apple tarzı premium splash:
// - 0–1.5s arası tek Framer Motion animasyonu
// - Başta hafif blur/parlama ile belirir
// - Sonra scale 15 ile ekrana doğru derinlemesine patlar
// - Aynı anda opacity 0'a iner, alttaki ana sayfa pürüzsüzce ortaya çıkar
// - Ease: cubic-bezier(0.43, 0.13, 0.23, 0.96)

export function SplashWrapper({ children }: { children: React.ReactNode }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      const key = "nabz_splash_seen_v3";
      const has = sessionStorage.getItem(key) === "1";
      if (!has) setShow(true);
    } catch {
      setShow(true);
    }
  }, []);

  useEffect(() => {
    if (!show) return;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    };
  }, [show]);

  const handleComplete = () => {
    try {
      sessionStorage.setItem("nabz_splash_seen_v3", "1");
    } catch {}
    setShow(false);
  };

  return (
    <>
      <AnimatePresence>
        {show && (
          <motion.div
            key="splash-overlay"
            className="fixed inset-0 z-[200] bg-[#050505] select-none"
            aria-label="NABZ-AI açılıyor"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            <motion.div
              key="splash-logo"
              className="flex items-center justify-center w-full h-full"
              initial={{
                scale: 0.9,
                opacity: 0,
                filter: "blur(14px)",
              }}
              animate={{
                scale: [0.9, 1.02, 1.15, 15],
                opacity: [0, 1, 0.95, 0],
                filter: ["blur(14px)", "blur(6px)", "blur(1px)", "blur(4px)"],
              }}
              transition={{
                duration: 1.5,
                ease: [0.43, 0.13, 0.23, 0.96],
                times: [0, 0.2, 0.45, 1],
              }}
              onAnimationComplete={handleComplete}
            >
              {/* Tam ekranı dolduran logo; arkada ekstra ışık yok */}
              <div
                role="img"
                aria-label="NABZ-AI"
                className="w-full h-full bg-no-repeat bg-center bg-cover pointer-events-none"
                style={{
                  backgroundImage: "url(/logo.jpg)",
                  mixBlendMode: "screen",
                }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {children}
    </>
  );
}
