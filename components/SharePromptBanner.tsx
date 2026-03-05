"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const STORAGE_KEY = "nabz-share-prompt-dismissed";

export function SharePromptBanner() {
  const [visible, setVisible] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const dismissed = sessionStorage.getItem(STORAGE_KEY);
    if (dismissed) return;

    const timer = setTimeout(() => setVisible(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  const handleUpload = () => {
    setVisible(false);
    router.push("/upload");
  };

  const handleLater = () => {
    setVisible(false);
    sessionStorage.setItem(STORAGE_KEY, "1");
  };

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[9999] w-[calc(100%-2rem)] max-w-[450px] bg-[#1a1a1a] border-2 border-blue-500 rounded-2xl p-5 shadow-[0_10px_50px_rgba(0,0,0,0.8)] animate-slide-up"
      role="dialog"
      aria-label="Paylaşım daveti"
    >
      <div className="flex items-start gap-4">
        <div className="text-3xl">🚀</div>
        <div className="flex-1 min-w-0">
          <h4 className="m-0 text-white font-['Orbitron',sans-serif] font-bold">
            Şaheserini Paylaş!
          </h4>
          <p className="text-sm text-gray-400 mt-2 mb-3">
            Az önce kullandığın AI aracıyla ürettiğin içeriği NABZ-AI&apos;da paylaşarak binlerce kişiye ulaş.
          </p>
          <div className="bg-red-500/10 p-2.5 rounded-lg border-l-4 border-red-500 mb-4">
            <span className="text-xs text-red-500 font-bold">⚠️ ÖNEMLİ:</span>
            <span className="text-[10px] text-gray-300 ml-1">
              İçeriğiniz +18, kumar veya dini değerlere aykırı unsurlar içermemelidir.
            </span>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleUpload}
              className="flex-[2] py-2.5 px-4 bg-blue-500 rounded-lg text-white font-bold hover:bg-blue-600 transition-colors"
            >
              ŞİMDİ YÜKLE
            </button>
            <button
              type="button"
              onClick={handleLater}
              className="flex-1 py-2.5 px-4 bg-[#333] rounded-lg text-white hover:bg-[#444] transition-colors"
            >
              SONRA
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
