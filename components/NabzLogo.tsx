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
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo.jpg"
        alt="NABZ-AI"
        className="h-14 sm:h-16 w-auto object-contain rounded-2xl block"
        style={{
          mixBlendMode: "screen",
          backgroundColor: "transparent",
        }}
      />
    </div>
  );
}
