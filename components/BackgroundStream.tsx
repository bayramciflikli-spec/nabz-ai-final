"use client";

const DEFAULT_LOGOS = [
  "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200",
  "https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/Canva_icon_2021.svg/240px-Canva_icon_2021.svg.png",
  "https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/ChatGPT_logo.svg/240px-ChatGPT_logo.svg.png",
  "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/Midjourney_Emblem.png/240px-Midjourney_Emblem.png",
  "https://avatars.githubusercontent.com/u/41300645?s=200&v=4",
  "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=200",
];

interface BackgroundStreamProps {
  logos?: string[];
  className?: string;
  /** Header altından başlasın mı (top: 100) */
  belowHeader?: boolean;
  /** phantom: beyaz, colorful: renkli, cosmic: buz mavisi glow (ana sayfa) */
  variant?: "phantom" | "colorful" | "cosmic";
  /** Debug: logo yerine beyaz kareler (görünürlük testi) */
  debug?: boolean;
}

function LogoRow({
  logos,
  animationClass,
  variant = "phantom",
  debug = false,
}: {
  logos: string[];
  animationClass: string;
  variant?: "phantom" | "colorful" | "cosmic";
  debug?: boolean;
}) {
  const allLogos = [...logos, ...logos];
  const logoClass =
    variant === "colorful"
      ? "w-[140px] h-[140px] object-contain mx-[50px] shrink-0 opacity-70"
      : variant === "cosmic"
        ? "w-[140px] h-[140px] object-contain mx-[50px] shrink-0 phantom-logo-cosmic"
        : "w-[140px] h-[140px] object-contain mx-[50px] shrink-0 phantom-logo";

  const debugClass = "w-[100px] h-[100px] bg-white mx-[30px] shrink-0 opacity-80";

  if (debug) {
    return (
      <div className={`flex flex-row opacity-80 mb-[60px] ${animationClass}`}>
        {[...Array(12)].map((_, i) => (
          <div key={`debug-${i}`} className={debugClass} />
        ))}
      </div>
    );
  }

  return (
    <div className={`flex flex-row opacity-[0.5] mb-[60px] ${animationClass}`}>
      {allLogos.map((src, i) => (
        <img key={`${i}-${src}`} src={src} alt="" className={logoClass} />
      ))}
      {logos.map((src, i) => (
        <img key={`dup-${i}-${src}`} src={src} alt="" className={logoClass} />
      ))}
    </div>
  );
}

export function BackgroundStream({
  logos = DEFAULT_LOGOS,
  className = "",
  belowHeader = false,
  variant = "phantom",
  debug = false,
}: BackgroundStreamProps) {
  return (
    <div
      className={`absolute left-0 right-0 bottom-0 overflow-hidden pointer-events-none flex flex-col justify-center z-0 ${belowHeader ? "top-[150px]" : "top-0"} bg-transparent ${className}`}
      aria-hidden
    >
      <LogoRow logos={logos} animationClass="animate-background-stream" variant={variant} debug={debug} />
      <LogoRow logos={logos} animationClass="animate-background-stream-slow" variant={variant} debug={debug} />
      <LogoRow logos={logos} animationClass="animate-background-stream-reverse" variant={variant} debug={debug} />
    </div>
  );
}
