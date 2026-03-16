"use client";

import { useState } from "react";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { Shield, Mail, KeyRound } from "lucide-react";

/**
 * Admin panele girmeden önce yeni cihazda e-posta kodu ile doğrulama.
 * Hırsızlık / yetkisiz erişime karşı ek güvenlik.
 */
export function AdminCodeGate({
  onVerified,
}: {
  onVerified: () => void;
}) {
  const [step, setStep] = useState<"send" | "input">("send");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleSendCode = async () => {
    setError(null);
    setMessage(null);
    setLoading(true);
    try {
      const res = await fetchWithAuth("/api/admin/verify-device/send", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Kod gönderilemedi.");
        return;
      }
      setMessage(data.message || "Kod e-posta adresinize gönderildi.");
      setStep("input");
    } catch {
      setError("Bağlantı hatası. Tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const digits = code.replace(/\D/g, "").slice(0, 6);
    if (digits.length !== 6) {
      setError("6 haneli kodu girin.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await fetchWithAuth("/api/admin/verify-device/confirm", {
        method: "POST",
        body: JSON.stringify({ code: digits }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Doğrulama başarısız.");
        return;
      }
      onVerified();
    } catch {
      setError("Bağlantı hatası. Tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-2xl bg-slate-900/80 border border-white/10 p-8 shadow-xl">
        <div className="flex items-center justify-center gap-2 mb-6">
          <Shield className="w-8 h-8 text-amber-400" aria-hidden />
          <span className="font-semibold text-lg text-white">Cihaz doğrulama</span>
        </div>
        <p className="text-white/60 text-sm text-center mb-6">
          Bu cihazdan ilk kez giriş yapıyorsunuz. E-posta adresinize gönderilen 6 haneli kodu girin.
        </p>

        {step === "send" && (
          <>
            {message && <p className="text-cyan-400 text-sm text-center mb-4">{message}</p>}
            {error && <p className="text-red-400 text-sm text-center mb-4">{error}</p>}
            <button
              type="button"
              onClick={handleSendCode}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-medium transition-colors"
            >
              <Mail size={18} />
              {loading ? "Gönderiliyor..." : "Doğrulama kodu gönder"}
            </button>
          </>
        )}

        {step === "input" && (
          <form onSubmit={handleConfirmCode} className="space-y-4">
            {error && <p className="text-red-400 text-sm text-center">{error}</p>}
            <div>
              <label htmlFor="admin-code" className="block text-sm text-white/70 mb-2">
                6 haneli kod
              </label>
              <input
                id="admin-code"
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                placeholder="000000"
                className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-white/10 text-white text-center text-xl tracking-[0.5em] placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                autoFocus
              />
            </div>
            <button
              type="submit"
              disabled={loading || code.replace(/\D/g, "").length !== 6}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-semibold transition-colors"
            >
              <KeyRound size={18} />
              {loading ? "Doğrulanıyor..." : "Onayla ve panele gir"}
            </button>
            <button
              type="button"
              onClick={() => { setStep("send"); setCode(""); setError(null); setMessage(null); }}
              className="w-full py-2 text-sm text-white/50 hover:text-white/80"
            >
              Yeni kod gönder
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
