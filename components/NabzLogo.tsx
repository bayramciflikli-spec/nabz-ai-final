"use client";

interface NabzLogoProps {
  className?: string;
}

export function NabzLogo({ className = "" }: NabzLogoProps) {
  return (
    <div
      className={className}
      style={{
        filter: "drop-shadow(0 0 12px rgba(249,115,22,0.35)) drop-shadow(0 0 24px rgba(168,85,247,0.25))",
      }}
    >
      {/* Siyah arka planı kaldırmak için background-image + mix-blend-mode: screen (img'de bazen çalışmıyor) */}
      <div
        role="img"
        aria-label="NABZ-AI"
className={`h-11 sm:h-16 rounded-[1rem] sm:rounded-[1.25rem] bg-no-repeat bg-center bg-contain ${className}`}
      style={{
        width: "5.5rem",
          backgroundImage: "url(/logo.png)",
          mixBlendMode: "screen",
        }}
      />
    </div>
  );
}
