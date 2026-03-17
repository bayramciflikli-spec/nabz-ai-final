"use client";

import { useState, useRef, useEffect } from "react";
import { updateUserProfile, uploadProfilePhoto } from "@/lib/firebase-auth";
import { isAdmin } from "@/lib/isAdmin";
import { getProfileSetupDone, setProfileSetupDone } from "@/lib/userSyncFirestore";

const PROFILE_SETUP_KEY = "nabz-profile-setup-done";

/** Cihazlar arası: Firestore’da profil kurulumu tamamlandı mı? (mobil/bilgisayar aynı hesap) */
export function useProfileSetupResolved(user: { uid: string } | null): {
  show: boolean;
  loading: boolean;
  setDone: () => void;
} {
  const [done, setDoneState] = useState<boolean | null>(null);
  useEffect(() => {
    if (!user?.uid || isAdmin(user.uid)) {
      setDoneState(true);
      return;
    }
    getProfileSetupDone(user.uid).then(setDoneState);
  }, [user?.uid]);
  return {
    show: done === false,
    loading: done === null,
    setDone: () => setDoneState(true),
  };
}

export function ProfileSetupModal({
  user,
  onClose,
  onSetupComplete,
}: {
  user: { uid: string; email?: string; displayName?: string; photoURL?: string };
  onClose: () => void;
  onSetupComplete?: () => void;
}) {
  const [step, setStep] = useState<"choose" | "letter" | "gallery">("choose");
  const [displayName, setDisplayName] = useState(user.displayName || user.email?.split("@")[0] || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const firstLetter = (displayName || user.email || "K")[0].toUpperCase();

  const saveAndClose = async (photoURL?: string) => {
    setLoading(true);
    setError("");
    try {
      await updateUserProfile(user.uid, {
        displayName: displayName || user.email?.split("@")[0] || "Kullanıcı",
        photoURL,
      });
      if (typeof window !== "undefined") {
        localStorage.setItem(PROFILE_SETUP_KEY, "1");
      }
      await setProfileSetupDone(user.uid);
      onSetupComplete?.();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Kaydetme başarısız");
    } finally {
      setLoading(false);
    }
  };

  const handleUseLetter = () => {
    setStep("letter");
    saveAndClose(); // Baş harf için photoURL gerekmez, avatar bileşeni harfi gösterebilir
  };

  const handleGalleryClick = () => {
    setStep("gallery");
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) {
      setError("Lütfen bir görsel dosyası seçin (JPEG, PNG, WebP)");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const url = await uploadProfilePhoto(user.uid, file);
      await saveAndClose(url);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Yükleme başarısız");
    } finally {
      setLoading(false);
    }
    e.target.value = "";
  };

  if (step === "letter") {
    return null; // saveAndClose çağrıldı, modal kapanacak
  }

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-md max-h-[90vh] overflow-y-auto bg-[#1a1a1a] border border-white/20 rounded-2xl shadow-2xl overflow-hidden my-4">
        <div className="px-6 py-4 border-b border-white/10">
          <h2 className="text-lg font-bold text-white">Profilinizi Ayarlayın</h2>
          <p className="text-sm text-white/60 mt-1">
            Profil fotoğrafı: e-posta baş harfinizi kullanın veya galeriden bir fotoğraf seçin. Galeri erişimi için izin isteyeceğiz.
          </p>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/80 mb-1.5">Görünen ad (isteğe bağlı)</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Adınız"
              className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/20 text-white placeholder:text-white/40 outline-none focus:border-red-500/50"
            />
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium text-white/80">Profil fotoğrafı</p>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={handleUseLetter}
                disabled={loading}
                className="flex-1 flex flex-col items-center gap-2 p-4 rounded-xl bg-white/5 border border-white/20 hover:border-red-500/50 transition-colors disabled:opacity-50"
              >
                <div className="w-16 h-16 rounded-full bg-red-500/80 flex items-center justify-center text-2xl font-bold text-white">
                  {firstLetter}
                </div>
                <span className="text-sm text-white/80">E-posta baş harfi</span>
              </button>

              <button
                type="button"
                onClick={handleGalleryClick}
                disabled={loading}
                className="flex-1 flex flex-col items-center gap-2 p-4 rounded-xl bg-white/5 border border-white/20 hover:border-red-500/50 transition-colors disabled:opacity-50"
              >
                <div className="w-16 h-16 rounded-full bg-white/10 border border-dashed border-white/30 flex items-center justify-center">
                  <span className="text-2xl">📷</span>
                </div>
                <span className="text-sm text-white/80">Galeriden seç</span>
              </button>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleFileChange}
            className="hidden"
            aria-label="Profil fotoğrafı seç"
          />

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            type="button"
            onClick={() => {
              if (typeof window !== "undefined") localStorage.setItem(PROFILE_SETUP_KEY, "1");
              onClose();
            }}
            className="w-full py-2.5 rounded-xl border border-white/20 text-white/70 hover:bg-white/5"
          >
            Sonra yapacağım
          </button>
        </div>
      </div>
    </div>
  );
}

/** Sync: Firestore’da yoksa localStorage’a bak. Gerçek değer useProfileSetupResolved ile alınır. */
export function shouldShowProfileSetup(user: { uid: string; photoURL?: string | null } | null): boolean {
  if (!user) return false;
  if (isAdmin(user.uid)) return false;
  if (typeof window === "undefined") return false;
  if (localStorage.getItem(PROFILE_SETUP_KEY)) return false;
  return true;
}
