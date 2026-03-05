"use client";

import Link from "next/link";
import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { isAdmin } from "@/lib/isAdmin";

interface SidebarProps {
  user?: { photoURL?: string | null; displayName?: string | null; uid?: string } | null;
}

const appLinks = [
  { name: "ChatGPT", logo: "https://www.google.com/s2/favicons?domain=chat.openai.com&sz=64", href: "https://chat.openai.com" },
  { name: "Canva", logo: "https://www.google.com/s2/favicons?domain=canva.com&sz=64", href: "https://www.canva.com" },
  { name: "Gemini", logo: "https://www.google.com/s2/favicons?domain=gemini.google.com&sz=64", href: "https://gemini.google.com" },
  { name: "DeepSeek", logo: "https://www.google.com/s2/favicons?domain=deepseek.com&sz=64", href: "https://www.deepseek.com" },
  { name: "Perplexity", logo: "https://www.google.com/s2/favicons?domain=perplexity.ai&sz=64", href: "https://www.perplexity.ai" },
  { name: "Claude", logo: "https://www.google.com/s2/favicons?domain=claude.ai&sz=64", href: "https://claude.ai" },
  { name: "CapCut", logo: "https://www.google.com/s2/favicons?domain=capcut.com&sz=64", href: "https://www.capcut.com" },
  { name: "Midjourney", logo: "https://www.google.com/s2/favicons?domain=midjourney.com&sz=64", href: "https://www.midjourney.com" },
  { name: "Runway", logo: "https://www.google.com/s2/favicons?domain=runwayml.com&sz=64", href: "https://runwayml.com" },
  { name: "Suno", logo: "https://www.google.com/s2/favicons?domain=suno.ai&sz=64", href: "https://www.suno.ai" },
  { name: "ElevenLabs", logo: "https://www.google.com/s2/favicons?domain=elevenlabs.io&sz=64", href: "https://elevenlabs.io" },
  { name: "Kling", logo: "https://www.google.com/s2/favicons?domain=klingai.com&sz=64", href: "https://www.klingai.com" },
  { name: "OpenAI", logo: "https://www.google.com/s2/favicons?domain=openai.com&sz=64", href: "https://openai.com" },
  { name: "Leonardo", logo: "https://www.google.com/s2/favicons?domain=leonardo.ai&sz=64", href: "https://leonardo.ai" },
  { name: "Adobe Firefly", logo: "https://www.google.com/s2/favicons?domain=adobe.com&sz=64", href: "https://firefly.adobe.com" },
  { name: "Ideogram", logo: "https://www.google.com/s2/favicons?domain=ideogram.ai&sz=64", href: "https://ideogram.ai" },
  { name: "HeyGen", logo: "https://www.google.com/s2/favicons?domain=heygen.com&sz=64", href: "https://www.heygen.com" },
  { name: "Synthesia", logo: "https://www.google.com/s2/favicons?domain=synthesia.io&sz=64", href: "https://www.synthesia.io" },
  { name: "Descript", logo: "https://www.google.com/s2/favicons?domain=descript.com&sz=64", href: "https://www.descript.com" },
  { name: "Kapwing", logo: "https://www.google.com/s2/favicons?domain=kapwing.com&sz=64", href: "https://www.kapwing.com" },
  { name: "InVideo", logo: "https://www.google.com/s2/favicons?domain=invideo.io&sz=64", href: "https://invideo.io" },
  { name: "Replicate", logo: "https://www.google.com/s2/favicons?domain=replicate.com&sz=64", href: "https://replicate.com" },
  { name: "Remini", logo: "https://www.google.com/s2/favicons?domain=remini.ai&sz=64", href: "https://remini.ai" },
  { name: "NABZ", logo: "", href: "/", isInternal: true },
];

function AppCircle({ app }: { app: (typeof appLinks)[0] }) {
  const [imgError, setImgError] = useState(false);
  const showFallback = imgError || !app.logo || "isInternal" in app;

  return (
    <Link
      href={app.href}
      target={app.href.startsWith("http") ? "_blank" : undefined}
      rel={app.href.startsWith("http") ? "noopener noreferrer" : undefined}
      title={app.name}
      className="group flex flex-col items-center justify-center gap-2 w-full py-2 transition-all duration-200 hover:bg-white/5 active:scale-95 rounded-lg"
    >
      <div className="flex items-center justify-center w-14 h-14 rounded-full flex-shrink-0 transition-all duration-200 group-hover:bg-white/20 group-hover:scale-105 bg-white/10 border border-white/20 overflow-hidden aspect-square">
        {showFallback ? (
          <span className="text-base font-black text-white/90 leading-none">
            {app.name.slice(0, 2)}
          </span>
        ) : (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={app.logo}
            alt={app.name}
            className="w-full h-full object-cover rounded-full"
            onError={() => setImgError(true)}
          />
        )}
      </div>
      <span className="text-xs font-medium text-white/90 truncate w-full text-center">
        {app.name}
      </span>
    </Link>
  );
}

export const Sidebar = ({ user }: SidebarProps) => {
  return (
    <div className="fixed left-0 top-0 h-screen w-56 bg-black border-r border-[#222] z-40 overflow-y-auto">
      {/* Kırmızı nabız çizgisi - sağ kenar */}
      <div
        className="absolute right-0 top-0 w-0.5 h-full bg-red-500 nabz-pulse-line-vertical"
        style={{ boxShadow: "0 0 12px #ff0000" }}
      />

      {user && isAdmin(user.uid) && (
        <div className="pt-4 px-3 pb-2">
          <Link
            href="/admin"
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 hover:bg-amber-500/30 transition-colors"
          >
            <ShieldCheck size={20} />
            <span className="font-semibold text-sm">Admin Panel</span>
          </Link>
        </div>
      )}

      <div className="grid grid-cols-2 gap-x-2 gap-y-4 py-6 px-3 place-items-center">
        {appLinks.map((app) => (
          <AppCircle key={app.name} app={app} />
        ))}
      </div>
    </div>
  );
};
