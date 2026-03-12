"use client";

interface NabzLogoProps {
  className?: string;
}

export function NabzLogo({ className = "" }: NabzLogoProps) {
  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src="/nabz-ai-logo.png"
      alt="NABZ:AI"
      className={`h-14 sm:h-16 w-auto object-contain rounded-2xl ${className}`}
      style={{
        backgroundColor: "transparent",
      }}
    />
  );
}
