"use client";

import { usePathname } from "next/navigation";
import { useAuth } from "./AuthProvider";
import { WelcomeModal, markWelcomeSeen } from "./WelcomeModal";
import { ProfileSetupModal, shouldShowProfileSetup } from "./ProfileSetupModal";
import { useState } from "react";
import { isAdmin } from "@/lib/isAdmin";
import { auth } from "@/lib/firebase";

/**
 * UserMenu veya diğer bileşenlerden tetiklenen global giriş modalı.
 * Admin sayfasındayken Google için redirect kullanılır (popup engeli olmaz).
 */
export function GlobalLoginModal() {
  const pathname = usePathname();
  const { user, showLoginModal, setShowLoginModal } = useAuth();
  const [profileSetupDismissed, setProfileSetupDismissed] = useState(false);

  const showProfileSetup = user && shouldShowProfileSetup(user) && !profileSetupDismissed;
  const isAdminPage = pathname?.startsWith("/admin");

  if (!showLoginModal) return null;

  const handleSuccess = (userAfterLogin?: { uid: string } | null) => {
    markWelcomeSeen();
    setShowLoginModal(false);
    if (userAfterLogin && isAdmin(userAfterLogin.uid)) {
      window.location.href = "/admin";
    }
  };

  return (
    <>
      <WelcomeModal
        title="Giriş yap"
        onClose={() => setShowLoginModal(false)}
        onSuccess={() => handleSuccess(auth.currentUser)}
        onShowProfileSetup={() => setShowLoginModal(false)}
        preferRedirectForGoogle={isAdminPage}
      />
      {showProfileSetup && user && (
        <ProfileSetupModal
          user={{
            uid: user.uid,
            email: user.email ?? undefined,
            displayName: user.displayName ?? undefined,
            photoURL: user.photoURL ?? undefined,
          }}
          onClose={() => setProfileSetupDismissed(true)}
        />
      )}
    </>
  );
}
