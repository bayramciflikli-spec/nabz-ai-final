"use client";

import { useEffect } from "react";
import { Sparkles, ArrowRight, X } from "lucide-react";

interface QuickStartModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate?: (prompt: string) => void;
}

const quickSuggestions = [
  "Siberpunk Tokyo",
  "Antik Roma Gökdelenleri",
  "Kristal Orman",
];

export const QuickStartModal = ({
  isOpen,
  onClose,
  onGenerate,
}: QuickStartModalProps) => {
  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const prompt = (formData.get("prompt") as string)?.trim();
    if (prompt) {
      onGenerate?.(prompt);
      onClose();
    }
  };

  const handleSuggestionClick = (tag: string) => {
    const textarea = document.querySelector(
      '[name="quick-prompt"]'
    ) as HTMLTextAreaElement;
    if (textarea) {
      textarea.value = tag;
      textarea.focus();
    }
  };

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen, onClose]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* ARKA PLAN KARARTMA */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-md cursor-pointer"
        onClick={onClose}
        aria-hidden
      />

      {/* MODAL İÇERİĞİ */}
      <div className="relative w-full max-w-2xl bg-[#0A0A0A] border border-white/10 rounded-[3rem] p-10 overflow-hidden shadow-[0_0_100px_rgba(168,85,247,0.2)]">
        {/* KAPAT BUTONU */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-6 right-6 p-2 text-gray-500 hover:text-white transition-colors z-20"
          aria-label="Kapat"
        >
          <X size={24} />
        </button>

        {/* ARKA PLAN SÜSÜ: Hafif bir neon sızıntısı */}
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-purple-600/10 blur-[80px]" />

        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-gradient-to-tr from-purple-600 to-green-400 rounded-2xl flex items-center justify-center shadow-lg">
              <Sparkles className="text-white w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white uppercase tracking-tighter">
                Anlık Demo
              </h2>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">
                2 Saniyelik Bir Mucize Yarat
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            {/* INPUT ALANI */}
            <div className="relative group mb-8">
              <textarea
                name="quick-prompt"
                autoFocus
                className="w-full bg-white/5 border border-white/10 rounded-[2rem] p-8 text-xl text-white placeholder:text-gray-700 outline-none focus:border-purple-500/50 transition-all resize-none pr-20"
                placeholder="Örn: Mars'ta neon ışıklı bir kahve dükkanı..."
                rows={3}
              />
              <div className="absolute bottom-6 right-6 flex items-center gap-2 text-[10px] font-black text-gray-600 uppercase tracking-widest">
                <kbd className="px-2 py-1 bg-white/5 rounded-md border border-white/10">
                  Enter
                </kbd>
                <span>ile uçur</span>
              </div>
            </div>

            {/* HIZLI ÖNERİLER */}
            <div className="flex flex-wrap gap-3 mb-10">
              {quickSuggestions.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleSuggestionClick(tag)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-full text-[10px] font-bold text-gray-400 transition-all"
                >
                  + {tag}
                </button>
              ))}
            </div>

            {/* DEMO ÜRET BUTONU */}
            <button
              type="submit"
              className="w-full py-6 bg-white text-black rounded-full font-black text-xl hover:bg-green-400 transition-all flex items-center justify-center gap-3 group"
            >
              ŞİMDİ GÖR
              <ArrowRight className="group-hover:translate-x-2 transition-transform" />
            </button>
          </form>

          <p className="text-center mt-6 text-[10px] text-gray-600 font-medium uppercase tracking-[0.2em]">
            Kayıt Gerekmez • Ücretsiz Demo • Nabız V.2.4
          </p>
        </div>
      </div>
    </div>
  );
};
