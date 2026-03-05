"use client";

import { useState, useEffect } from "react";
import { Mail, Gauge, LayoutGrid, KeyRound } from "lucide-react";
import {
  signInWithGoogle,
  signInWithGooglePopup,
  signInWithYahoo,
  signInWithMicrosoft,
  signInWithApple,
  signUpWithEmail,
  signInWithEmail,
  resetPassword,
} from "@/lib/firebase";
import { getAuthErrorMessage } from "@/lib/authErrors";

const WELCOME_KEY = "nabz-welcome-seen";
const LOGIN_ONLY_KEY = "nabz-login-only";

function getLoginOnly(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(LOGIN_ONLY_KEY) === "1";
}

/** Masaüstü paneli (PWA) veya standalone pencerede mi çalışıyoruz */
function isStandalonePanel(): boolean {
  if (typeof window === "undefined") return false;
  const params = new URLSearchParams(window.location.search);
  if (params.get("panel") === "1") return true;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window as Window & { navigator?: { standalone?: boolean } }).navigator?.standalone === true
  );
}

export function setLoginOnlyAndHideSignup() {
  if (typeof window !== "undefined") {
    localStorage.setItem(LOGIN_ONLY_KEY, "1");
  }
}

export function WelcomeModal({
  onClose,
  onSuccess,
  onShowProfileSetup,
  redirectAfterSuccess,
  title = "NABZ-AI'a Kaydol",
}: {
  onClose?: () => void;
  onSuccess: (isNewUser: boolean) => void;
  onShowProfileSetup: () => void;
  redirectAfterSuccess?: string;
  title?: string;
}) {
  const [loginOnly, setLoginOnly] = useState(getLoginOnly);
  const [mode, setMode] = useState<"choose" | "email" | "reset">("choose");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [standalone, setStandalone] = useState(false);

  useEffect(() => {
    setStandalone(isStandalonePanel());
  }, []);

  const effectiveTitle = loginOnly ? "Giriş Yap" : title;
  /** Panelde: aynı pencerede /auth/google'a git (popup/redirect orada). Tarayıcıda: redirect. */
  const handleGoogleClick = () => {
    if (standalone) {
      window.location.href = "/auth/google";
      return;
    }
    handleOAuth(signInWithGoogle);
  };

  const handleOAuth = async (fn: () => Promise<unknown>) => {
    setLoading(true);
    setError("");
    try {
      const result = await fn();
      if (result === null) {
        // Redirect kullanıldı (popup açılmadı); sayfa yönlendirilecek, loading kalsın
        return;
      }
      onSuccess(true);
      onShowProfileSetup();
      if (redirectAfterSuccess) {
        window.location.href = redirectAfterSuccess;
      }
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 6) {
      setError("Şifre en az 6 karakter olmalıdır");
      return;
    }
    if (!loginOnly && mode === "email" && password !== confirmPassword) {
      setError("Şifreler eşleşmiyor");
      return;
    }
    setLoading(true);
    try {
      if (loginOnly) {
        await signInWithEmail(email, password);
        onSuccess(false);
        if (redirectAfterSuccess) window.location.href = redirectAfterSuccess;
      } else {
        try {
          await signUpWithEmail(email, password);
          onSuccess(true);
          onShowProfileSetup();
          if (redirectAfterSuccess) window.location.href = redirectAfterSuccess;
        } catch (signUpErr: unknown) {
          const err = signUpErr as { code?: string };
          if (err?.code === "auth/email-already-in-use") {
            await signInWithEmail(email, password);
            onSuccess(false);
            if (redirectAfterSuccess) window.location.href = redirectAfterSuccess;
          } else throw signUpErr;
        }
      }
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim()) {
      setError("E-posta adresinizi girin");
      return;
    }
    setLoading(true);
    try {
      await resetPassword(email.trim());
      setResetSent(true);
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-md max-h-[90vh] my-auto flex flex-col bg-[#1a1a1a] border border-white/20 rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h2 className="text-lg font-bold text-white">{effectiveTitle}</h2>
          <span className="text-xs text-white/50">{loginOnly ? "Hesabınızla giriş yapın" : "Devam etmek için kayıt gerekli"}</span>
        </div>

        <div className="p-4 sm:p-6 overflow-y-auto flex-1 min-h-0">
          {mode === "choose" ? (
            <>
              <p className="text-sm text-white/70 mb-6">
                {loginOnly ? "Hesabınızla giriş yapın." : "Uygulamayı kullanmak için kayıt olmanız gerekiyor. Gerekli izinleri isteyeceğiz."}
              </p>

              {standalone && (
                <div className="mb-4 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-200 text-sm">
                  <strong>Masaüstü paneli:</strong> Butona tıklayınca bu pencere Google giriş sayfasına gidecek. Tarayıcı “açılır pencereyi engelledi” derse izin verin veya aşağıdaki “Tarayıcıda aç” ile giriş yapın.
                </div>
              )}

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={standalone ? handleGoogleClick : () => handleOAuth(signInWithGoogle)}
                  disabled={loading && !standalone}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-medium transition-colors disabled:opacity-50"
                >
                  <img src="https://www.google.com/favicon.ico" alt="" className="w-5 h-5" />
                  {loading && !standalone ? "Yönlendiriliyorsunuz..." : (loginOnly ? "Gmail / Google ile giriş yap" : "Gmail / Google ile kaydol")}
                </button>
                {standalone ? (
                  <p className="text-xs text-white/50 text-center -mt-1 space-y-1">
                    <span className="block">Buton çalışmazsa </span>
                    <a href="/auth/google" className="text-cyan-400 hover:underline font-medium">
                      bu linke tıklayın (aynı pencerede Google girişi)
                    </a>
                    {" · "}
                    <button
                      type="button"
                      onClick={() => window.open(window.location.origin, "_blank", "noopener")}
                      className="text-cyan-400 hover:underline"
                    >
                      Tarayıcıda aç
                    </button>
                  </p>
                ) : (
                  <p className="text-xs text-white/50 text-center -mt-1">
                    Açılmazsa{" "}
                    <a href="/auth/google" className="text-cyan-400 hover:underline">
                      bu linki aynı sekmede açın
                    </a>
                    {" · "}
                    Giriş yapıp atıyorsa{" "}
                    <button
                      type="button"
                      onClick={() => handleOAuth(signInWithGooglePopup)}
                      disabled={loading}
                      className="text-cyan-400 hover:underline inline"
                    >
                      pencere ile dene
                    </button>
                  </p>
                )}

                <button
                  type="button"
                  onClick={() => handleOAuth(signInWithMicrosoft)}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-medium transition-colors disabled:opacity-50"
                >
                  <LayoutGrid className="w-5 h-5 text-[#00A4EF]" />
                  {loginOnly ? "Microsoft / Outlook ile giriş yap" : "Microsoft / Outlook ile kaydol"}
                </button>

                <button
                  type="button"
                  onClick={() => handleOAuth(signInWithYahoo)}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-medium transition-colors disabled:opacity-50"
                >
                  <Gauge size={20} className="text-white/90" />
                  {loginOnly ? "Yahoo ile giriş yap" : "Yahoo ile kaydol"}
                </button>

                <button
                  type="button"
                  onClick={() => handleOAuth(signInWithApple)}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-medium transition-colors disabled:opacity-50"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                  </svg>
                  {loginOnly ? "Apple ile giriş yap" : "Apple ile kaydol"}
                </button>

                <button
                  type="button"
                  onClick={() => { setMode("email"); setError(""); }}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-medium transition-colors"
                >
                  <Mail size={20} className="text-white/90" />
                  {loginOnly ? "E-posta ile giriş yap" : "E-posta ile kaydol"}
                </button>
              </div>

              {!loginOnly && (
                <p className="text-xs text-white/50 mt-4 text-center">
                  Kaydolarak profilinizi özelleştirme ve galeriden fotoğraf ekleme iznini vereceksiniz.
                </p>
              )}

              {!loginOnly && (
                <button
                  type="button"
                  onClick={() => {
                    setLoginOnlyAndHideSignup();
                    setLoginOnly(true);
                  }}
                  className="w-full mt-4 py-2 text-xs text-white/50 hover:text-white/80 border border-white/10 rounded-lg transition-colors"
                >
                  Kaydol seçeneğini kaldır (sadece giriş) ve bir daha gösterme
                </button>
              )}
            </>
          ) : mode === "reset" ? (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <button
                type="button"
                onClick={() => { setMode("choose"); setError(""); setResetSent(false); }}
                className="text-sm text-white/60 hover:text-white"
              >
                ← Geri
              </button>

              {resetSent ? (
                <div className="py-4 text-center">
                  <p className="text-green-400 font-medium">Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.</p>
                  <p className="text-sm text-white/60 mt-2">E-postanızı kontrol edin ve bağlantıyı tıklayın.</p>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-1.5">E-posta</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="ornek@email.com"
                      className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/20 text-white placeholder:text-white/40 outline-none focus:border-red-500/50"
                    />
                  </div>
                  {error && <p className="text-sm text-red-400">{error}</p>}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-xl bg-red-500/80 hover:bg-red-500 text-white font-semibold disabled:opacity-50"
                  >
                    {loading ? "Gönderiliyor..." : "Şifre Sıfırlama Bağlantısı Gönder"}
                  </button>
                </>
              )}
            </form>
          ) : (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <button
                type="button"
                onClick={() => { setMode("choose"); setError(""); }}
                className="text-sm text-white/60 hover:text-white"
              >
                ← Geri
              </button>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-1.5">E-posta</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="ornek@email.com"
                  className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/20 text-white placeholder:text-white/40 outline-none focus:border-red-500/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-1.5">Şifre (min. 6 karakter)</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/20 text-white placeholder:text-white/40 outline-none focus:border-red-500/50"
                />
              </div>

              {!loginOnly && (
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1.5">Şifre tekrar</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/20 text-white placeholder:text-white/40 outline-none focus:border-red-500/50"
                  />
                </div>
              )}

              <button
                type="button"
                onClick={() => { setMode("reset"); setError(""); }}
                className="text-xs text-cyan-400 hover:underline flex items-center gap-1"
              >
                <KeyRound size={14} />
                Şifremi unuttum
              </button>

              {error && (
                <div>
                  <p className="text-sm text-red-400">{error}</p>
                  {(error.includes("configuration") || error.includes("etkin değil")) && (
                    <a
                      href={`https://console.firebase.google.com/project/${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "your-project"}/authentication/providers`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block mt-2 text-sm text-cyan-400 hover:underline"
                    >
                      → Firebase Console: Giriş yöntemlerini etkinleştir
                    </a>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-red-500/80 hover:bg-red-500 text-white font-semibold disabled:opacity-50"
              >
                {loading ? (loginOnly ? "Giriş yapılıyor..." : "Kaydediliyor...") : (loginOnly ? "Giriş Yap" : "Kaydol")}
              </button>
            </form>
          )}

          {mode === "choose" && error && (
            <div className="mt-4">
              <p className="text-sm text-red-400">{error}</p>
              {standalone && (error.includes("engellendi") || error.includes("popup")) && (
                <p className="text-sm text-amber-200 mt-2">
                  Panelde açılır pencerelere izin verin (adres çubuğundaki simge) veya yukarıdaki “Tarayıcıda aç” ile siteyi tarayıcıda kullanın.
                </p>
              )}
              {(error.includes("configuration") || error.includes("etkin değil")) && (
                <a
                  href={`https://console.firebase.google.com/project/${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "your-project"}/authentication/providers`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-2 text-sm text-cyan-400 hover:underline"
                >
                  → Firebase Console: Giriş yöntemlerini etkinleştir
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function shouldShowWelcome(): boolean {
  if (typeof window === "undefined") return false;
  return !localStorage.getItem(WELCOME_KEY);
}

export function markWelcomeSeen() {
  if (typeof window !== "undefined") {
    localStorage.setItem(WELCOME_KEY, "1");
  }
}
