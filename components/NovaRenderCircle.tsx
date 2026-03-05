"use client";

interface NovaRenderCircleProps {
  size?: "small" | "full";
  progress?: number;
  showProgress?: boolean;
}

export const NovaRenderCircle = ({
  size = "full",
  progress = 0,
  showProgress = true,
}: NovaRenderCircleProps) => {
  const isSmall = size === "small";
  const sizeClass = isSmall ? "w-32 h-32" : "w-64 h-64";
  const strokeWidth = isSmall ? 2 : 4;
  const textSize = isSmall ? "text-xl" : "text-4xl";
  const insetClass = isSmall ? "inset-3" : "inset-6";

  return (
    <div className={`relative ${sizeClass} flex items-center justify-center`}>
      {/* 1. Dış Dönen Halka (İlerleme Göstergesi) */}
      <svg
        className="w-full h-full -rotate-90"
        viewBox="0 0 100 100"
      >
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="#ffffff10"
          strokeWidth="1"
        />
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="url(#nova-gradient)"
          strokeWidth={strokeWidth}
          strokeDasharray={`${progress * 2.83} 283`}
          strokeLinecap="round"
          className="transition-all duration-300 ease-out shadow-[0_0_30px_#a855f7]"
        />
        <defs>
          <linearGradient id="nova-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#4ade80" />
          </linearGradient>
        </defs>
      </svg>

      {/* 2. İçteki Parlayan Plazma Küresi */}
      <div className={`absolute ${insetClass} rounded-full bg-gradient-to-tr from-purple-900 via-fuchsia-600 to-cyber-cyan blur-md animate-pulse-fast flex items-center justify-center overflow-hidden shadow-[0_0_60px_rgba(168,85,247,0.5)]`}>
        <div
          className="absolute inset-0 opacity-50 mix-blend-overlay animate-spin-slow"
          style={{
            backgroundImage: "url('/energy-flow.svg')",
            backgroundSize: "cover",
          }}
        />
        {showProgress && (
          <span className={`relative z-10 ${textSize} font-black text-white tracking-tighter flex flex-col items-center leading-none`}>
            {progress}
            <span className="text-green-400">%</span>
          </span>
        )}
      </div>

      {/* 3. Yörüngedeki Parçacıklar */}
      <div className="absolute inset-[-4px] animate-spin-medium">
        <div className="w-2 h-2 bg-green-400 rounded-full blur-[2px] absolute top-0 left-1/2 -translate-x-1/2 shadow-[0_0_25px_#4ade80]" />
      </div>
      <div className="absolute inset-[-12px] animate-spin-reverse-slow">
        <div className="w-1.5 h-1.5 bg-purple-500 rounded-full blur-[2px] absolute bottom-0 left-1/2 -translate-x-1/2 shadow-[0_0_25px_#a855f7]" />
      </div>
    </div>
  );
};
