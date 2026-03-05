"use client";

import { useEffect, useState } from "react";

interface NowSplashScreenProps {
  onFinish: () => void;
}

export const NowSplashScreen = ({ onFinish }: NowSplashScreenProps) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      onFinish();
    }, 6200); // 4s bekleme + 2s aksiyon + 200ms buffer
    return () => clearTimeout(timer);
  }, [onFinish]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black animate-intro-overlay pointer-events-none">
      <div className="flex flex-row items-center justify-center gap-4 sm:gap-6 z-10">
        {/* SOL: N harfi - sola gider */}
        <span
          className="now-text text-[60px] sm:text-[80px] md:text-[90px] text-[#BC13FE] animate-intro-n w-20 h-[100px] flex items-center justify-center"
          style={{ textShadow: "0 0 15px rgba(188, 19, 254, 0.8)" }}
        >
          N
        </span>

        {/* ORTA: O (Logo) - Kamera içinden geçer, devasa büyür */}
        <div className="relative w-[100px] h-[100px] sm:w-[120px] sm:h-[120px] flex items-center justify-center animate-intro-o origin-center">
          <div className="absolute inset-0 flex items-center justify-center -z-10">
            <div className="w-[120px] h-[120px] rounded-full bg-[#BC13FE] blur-[30px] opacity-50" />
          </div>
          <div className="w-[90px] h-[90px] sm:w-[110px] sm:h-[110px] rounded-full bg-gradient-to-tr from-purple-600 to-green-400 p-[2px] shadow-[0_0_50px_rgba(188,19,254,0.6)]">
            {/* NovaRenderCircle / create ile aynı: parlak plazma + energy-flow */}
            <div className="relative w-full h-full rounded-full bg-gradient-to-tr from-purple-900 via-fuchsia-600 to-cyber-cyan animate-pulse-fast flex items-center justify-center overflow-hidden shadow-[0_0_60px_rgba(168,85,247,0.5)]">
              <div
                className="absolute inset-0 opacity-90 mix-blend-overlay animate-spin-slow brightness-125 contrast-110"
                style={{
                  backgroundImage: "url('/energy-flow.svg')",
                  backgroundSize: "cover",
                }}
              />
            </div>
          </div>
        </div>

        {/* SAĞ: Z harfi - sağa gider (Nabız) */}
        <span
          className="now-text text-[60px] sm:text-[80px] md:text-[90px] text-[#BC13FE] animate-intro-w w-20 h-[100px] flex items-center justify-center"
          style={{ textShadow: "0 0 15px rgba(188, 19, 254, 0.8)" }}
        >
          Z
        </span>
      </div>
    </div>
  );
};
