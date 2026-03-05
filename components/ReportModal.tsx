"use client";

import { useState } from "react";
import { reportContent, type ReportReason } from "@/lib/reports";
import { useAuth } from "@/components/AuthProvider";
import { useLocale } from "@/components/LocaleProvider";
import { useToast } from "@/components/ToastContext";
import { Flag } from "lucide-react";

const REASON_KEYS: { value: ReportReason; key: string }[] = [
  { value: "spam", key: "report.reasons.spam" },
  { value: "uygunsuz", key: "report.reasons.inappropriate" },
  { value: "telif", key: "report.reasons.copyright" },
  { value: "nefret", key: "report.reasons.hate" },
  { value: "şiddet", key: "report.reasons.violence" },
  { value: "diger", key: "report.reasons.other" },
];

interface ReportModalProps {
  projectId: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export function ReportModal({ projectId, onClose, onSuccess }: ReportModalProps) {
  const { user, setShowLoginModal } = useAuth();
  const { t } = useLocale();
  const toast = useToast();
  const [reason, setReason] = useState<ReportReason>("spam");
  const [detail, setDetail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await reportContent({ projectId, reason, detail });
      toast.success("Bildiriminiz alındı. İncelenecektir.");
      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Bildirim gönderilemedi.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <div className="w-full max-w-md bg-[#1a1a1a] border border-white/20 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Flag size={24} className="text-red-400" />
            <h2 className="text-xl font-bold">{t("report.title")}</h2>
          </div>
          <p className="text-white/60 mb-4">{t("report.loginRequired")}</p>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl bg-white/10 hover:bg-white/15 transition">
              {t("report.cancel")}
            </button>
            <button
              type="button"
              onClick={() => { setShowLoginModal(true); onClose(); }}
              className="flex-1 py-3 rounded-xl bg-red-500 hover:bg-red-600 transition"
            >
              {t("report.login")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-md bg-[#1a1a1a] border border-white/20 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Flag size={24} className="text-red-400" />
          <h2 className="text-xl font-bold">{t("report.title")}</h2>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">{t("report.reason")}</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value as ReportReason)}
              className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/20 text-white"
            >
              {REASON_KEYS.map((r) => (
                <option key={r.value} value={r.value}>
                  {t(r.key)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">{t("report.detail")}</label>
            <textarea
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              placeholder={t("report.detailPlaceholder")}
              className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/20 text-white placeholder-gray-500 resize-none"
              rows={3}
            />
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl bg-white/10 hover:bg-white/15 transition"
            >
              {t("report.cancel")}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 rounded-xl bg-red-500 hover:bg-red-600 disabled:opacity-50 transition"
            >
              {loading ? t("report.submitting") : t("report.submit")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
