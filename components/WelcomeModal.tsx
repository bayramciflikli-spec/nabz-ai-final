"use client";

import { useState, useEffect } from "react";
import { Mail, KeyRound, X } from "lucide-react";
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

const PROVIDERS = [
  {
    id: "google",
    label: "Google ile giriş yap",
    icon: () => <img src="https://www.google.com/favicon.ico" alt="" className="w-5 h-5" />,
    signIn: signInWithGooglePopup,
    signInRedirect: signInWithGoogle,
  },
  {
    id: "microsoft",
    label: "Microsoft ile giriş yap",
    icon: () => (
      <svg className="w-5 h-5" viewBox="0 0 21 21" fill="none">
        <rect width="10" height="10" fill="#F25022" />
        <rect x="11" width="10" height="10" fill="#7FBA00" />
        <rect y="11" width="10" height="10" fill="#00A4EF" />
        <rect x="11" y="11" width="10" height="10" fill="#FFB900" />
      </svg>
    ),
    signIn: signInWithMicrosoft,
  },
  {
    id: "yahoo",
    label: "Yahoo ile giriş yap",
    icon: () => (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#6001d2">
        <path d="M12 14l6-10H14l-2 6-2-6H6l6 10h6z" />
      </svg>
    ),
    signIn: signInWithYahoo,
  },
  {
    id: "apple",
    label: "Apple ile giriş yap",
    icon: () => (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
      </svg>
    ),
    signIn: signInWithApple,
  },
] as const;

export function WelcomeModal({
  onClose,
  onSuccess,
  onShowProfileSetup,
  redirectAfterSuccess,
  title = "Giriş yap",
}: {
  onClose?: () => void;
  onSuccess: (isNewUser: boolean) => void;
  onShowProfileSetup: () => void;
  redirectAfterSuccess?: string;
  title?: string;
}) {
  const [loginOnly] = useState(getLoginOnly);
  const [mode, setMode] = useState<"choose" | "email" | "reset">("choose");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [standalone] = useState(() => typeof window !== "undefined" && isStandalonePanel());

  const handleOAuth = async (provider: (typeof PROVIDERS)[number]) => {
    setLoading(true);
    setError("");
    try {
      const fn = provider.id === "google" && standalone ? signInWithGoogle : provider.signIn;
      const result = await (fn as () => Promise<unknown>)();
      if (result === null) return;
      onSuccess(true);
      onShowProfileSetup();
      if (redirectAfterSuccess) window.location.href = redirectAfterSuccess;
    } catch (err) {
      const msg = getAuthErrorMessage(err);
      setError(msg);
      if (provider.id === "google" && (msg.includes("popup") || msg.includes("engellendi"))) {
        setError("Açılır pencere engellendi. Aşağıdaki link ile aynı sekmede giriş yapabilirsiniz.");
      }
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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-sm my-auto flex flex-col bg-[#111] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4">
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Kapat"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="px-5 pb-6 pt-0">
          {mode === "choose" ? (
            <>
              <div className="space-y-2.5">
                {PROVIDERS.map((provider) => (
                  <div key={provider.id}>
                    <button
                      type="button"
                      onClick={() => handleOAuth(provider)}
                      disabled={loading}
                      className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium transition-all disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]"
                    >
                      {provider.icon()}
                      <span>{loading ? "Bağlanıyor…" : provider.label}</span>
                    </button>
                    {provider.id === "google" && standalone && (
                      <p className="mt-1.5 text-center">
                        <a href="/auth/google" className="text-xs text-cyan-400 hover:underline">
                          Aynı sekmede giriş yap
                        </a>
                      </p>
                    )}
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => { setMode("email"); setError(""); }}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium transition-all"
                >
                  <Mail className="w-5 h-5 text-white/80" />
                  E-posta ile giriş yap
                </button>
              </div>

              {error && (
                <p className="mt-4 text-sm text-red-400 text-center">
                  {error}
                  {error.includes("Açılır pencere") && (
                    <a href="/auth/google" className="block mt-2 text-cyan-400 hover:underline">
                      Google ile giriş yap →
                    </a>
                  )}
                </p>
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
                <p className="text-green-400 text-sm py-2">Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.</p>
              ) : (
                <>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="E-posta"
                    className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/15 text-white placeholder:text-white/40 outline-none focus:border-cyan-500/50"
                  />
                  {error && <p className="text-sm text-red-400">{error}</p>}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-semibold disabled:opacity-50"
                  >
                    {loading ? "Gönderiliyor…" : "Gönder"}
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
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="E-posta"
                className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/15 text-white placeholder:text-white/40 outline-none focus:border-cyan-500/50"
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                placeholder="Şifre (min. 6)"
                className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/15 text-white placeholder:text-white/40 outline-none focus:border-cyan-500/50"
              />
              {!loginOnly && (
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Şifre tekrar"
                  className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/15 text-white placeholder:text-white/40 outline-none focus:border-cyan-500/50"
                />
              )}
              <button
                type="button"
                onClick={() => { setMode("reset"); setError(""); }}
                className="flex items-center gap-1.5 text-xs text-cyan-400 hover:underline"
              >
                <KeyRound size={14} />
                Şifremi unuttum
              </button>
              {error && <p className="text-sm text-red-400">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-semibold disabled:opacity-50"
              >
                {loading ? "Giriş yapılıyor…" : "Giriş yap"}
              </button>
            </form>
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
