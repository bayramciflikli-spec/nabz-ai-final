"use client";

import Link from "next/link";
import { UserPlus } from "lucide-react";
import { CONTENT_RULES } from "@/lib/contentRules";

interface SubscriptionRequiredModalProps {
  onClose: () => void;
  onSubscribed?: () => void;
  returnUrl?: string;
}

export function SubscriptionRequiredModal({ onClose, onSubscribed, returnUrl = "/upload" }: SubscriptionRequiredModalProps) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-md max-h-[90vh] overflow-y-auto bg-[#1a1a1a] border border-white/20 rounded-2xl shadow-2xl overflow-hidden my-4">
        <div className="p-4 sm:p-6 text-center">
          <div className="mx-auto w-14 h-14 rounded-full bg-amber-500/20 flex items-center justify-center mb-4">
            <UserPlus size={28} className="text-amber-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Abone Olmanız Gerekiyor</h2>
          <p className="text-sm text-white/70 mb-4">
            AI içerikleri paylaşmak için NABZ-AI aboneliğine sahip olmanız gerekiyor. Abone olurken telif sorumluluğu ve
            içerik kurallarını kabul etmeniz gerekecektir.
          </p>
          <p className="text-xs text-white/50 mb-6">
            Yasak: {CONTENT_RULES.prohibited.join(", ")}. {CONTENT_RULES.consequence}
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href={`/abone-ol?return=${encodeURIComponent(returnUrl)}`}
              onClick={() => onSubscribed?.()}
              className="flex-1 py-3 px-4 rounded-xl bg-red-500 hover:bg-red-500/90 text-white font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <UserPlus size={18} />
              Abone Ol
            </Link>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-medium transition-colors"
            >
              İptal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
