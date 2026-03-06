"use client";

import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

export function PwaInstallBanner() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setInstalled(true);
      return;
    }
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === "accepted") setInstalled(true);
    setInstallPrompt(null);
    setDismissed(true);
  };

  if (installed || dismissed || !installPrompt) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-sm z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="bg-slate-800 border border-slate-600 rounded-xl shadow-xl p-4 flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white">NABZ&apos;i uygulama gibi kullan</p>
          <p className="text-xs text-slate-400 mt-0.5">Yükle, masaüstü veya ana ekrana ekle</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleInstall}
            className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Yükle
          </button>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="p-1.5 text-slate-400 hover:text-white rounded transition-colors"
            aria-label="Kapat"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
