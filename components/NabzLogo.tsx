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
      className={`h-14 sm:h-16 w-auto object-contain mix-blend-lighten ${className}`}
      style={{
        // mix-blend-lighten: koyu arka planı "transparan" yapar, sadece parlak logo kalır
        backgroundColor: "transparent",
      }}
    />
  );
}
