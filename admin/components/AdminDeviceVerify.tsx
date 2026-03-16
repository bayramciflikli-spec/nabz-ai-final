"use client";

import { useState } from "react";
import Link from "next/link";
import { Shield, Mail, KeyRound, Loader2 } from "lucide-react";
import { getDeviceId } from "@/admin/lib/adminDevice";
import { fetchWithAuth } from "@/lib/fetchWithAuth";

interface AdminDeviceVerifyProps {
  onVerified: () => void;
}

export function AdminDeviceVerify({ onVerified }: AdminDeviceVerifyProps) {
  const [step, setStep] = useState<"request" | "code">("request");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const deviceId = getDeviceId();

  const handleSendCode = async () => {
    if (!deviceId) return;
    setError("");
    setLoading(true);
    try {
      const res = await fetchWithAuth("/api/admin/verify-device/request", {
        method: "POST",
        body: JSON.stringify({ deviceId }),
      });
      const data = await res.json();
      if (data.ok) {
        setSent(true);
        setStep("code");
      } else {
        setError(data.error || "Kod gönderilemedi");
      }
    } catch (e) {
      setError("Bağlantı hatası. Tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    const trimmed = code.replace(/\D/g, "").slice(0, 6);
    if (trimmed.length !== 6) {
      setError("6 haneli kodu girin");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetchWithAuth("/api/admin/verify-device/confirm", {
        method: "POST",
        body: JSON.stringify({ deviceId, code: trimmed }),
      });
      const data = await res.json();
      if (data.ok) {
        onVerified();
      } else {
        setError(data.error || "Onay başarısız");
      }
    } catch (e) {
      setError("Bağlantı hatası. Tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <span className="w-14 h-14 rounded-full bg-amber-500/20 flex items-center justify-center">
            <Shield className="w-7 h-7 text-amber-400" />
          </span>
        </div>
        <h1 className="text-xl font-bold text-white">
          Yeni cihaz doğrulaması
        </h1>
        <p className="text-white/60 text-sm">
          Bu cihazdan ilk kez Kontrol Kulesi&apos;ne giriş yapıyorsunuz. E-posta adresinize gönderilen 6 haneli kodu girin; onaylamadan admin paneline erişemezsiniz.
        </p>

        {step === "request" && (
          <div className="space-y-4">
            <button
              type="button"
              onClick={handleSendCode}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-medium disabled:opacity-50 transition-colors"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Mail className="w-5 h-5" />}
              {loading ? "Gönderiliyor..." : "E-postaya kod gönder"}
            </button>
          </div>
        )}

        {step === "code" && (
          <div className="space-y-4">
            {sent && (
              <p className="text-amber-400/90 text-sm flex items-center justify-center gap-2">
                <Mail size={16} />
                Kod e-posta adresinize gönderildi
              </p>
            )}
            <div>
              <label htmlFor="admin-code" className="block text-left text-sm text-white/70 mb-1.5">
                6 haneli kod
              </label>
              <input
                id="admin-code"
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="000000"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/20 text-white text-center text-xl tracking-[0.5em] placeholder-white/30 focus:outline-none focus:border-cyan-500/50"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleConfirm}
                disabled={loading || code.replace(/\D/g, "").length !== 6}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-medium disabled:opacity-50 transition-colors"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <KeyRound className="w-5 h-5" />}
                Onayla
              </button>
              <button
                type="button"
                onClick={handleSendCode}
                disabled={loading}
                className="px-4 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white/90 text-sm font-medium disabled:opacity-50 transition-colors"
              >
                Yeni kod
              </button>
            </div>
          </div>
        )}

        {error && (
          <p className="text-red-400 text-sm" role="alert">
            {error}
          </p>
        )}

        <div className="pt-4 border-t border-white/10 flex flex-wrap justify-center gap-3">
          <Link
            href="/"
            className="text-sm text-white/60 hover:text-white transition-colors"
          >
            Ana sayfaya dön
          </Link>
        </div>
      </div>
    </div>
  );
}
