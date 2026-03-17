"use client";

import { useAuth } from "./AuthProvider";
import { WelcomeModal, markWelcomeSeen } from "./WelcomeModal";
import { ProfileSetupModal, useProfileSetupResolved } from "./ProfileSetupModal";
import { useState, useEffect } from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * Koruma gerektiren sayfaları saran bileşen.
 * Giriş yapmamış kullanıcıya WelcomeModal gösterir.
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [profileSetupDismissed, setProfileSetupDismissed] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      setShowLogin(true);
    } else {
      setShowLogin(false);
    }
  }, [user, loading]);

  const { show: profileSetupShow, setDone: setProfileSetupDone } = useProfileSetupResolved(user);
  const showProfileSetup = user && profileSetupShow && !profileSetupDismissed;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505]">
        <div className="w-10 h-10 border-2 border-red-500/50 border-t-red-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <div className="min-h-screen flex items-center justify-center bg-[#050505] text-white p-8">
          <div className="text-center max-w-md">
            <p className="text-white/70 mb-4">
              Bu sayfayı görüntülemek için giriş yapmanız gerekiyor.
            </p>
            <p className="text-sm text-white/50">
              Aşağıdaki modal üzerinden kayıt olabilir veya giriş yapabilirsiniz.
            </p>
          </div>
        </div>
        {showLogin && (
          <WelcomeModal
            title="Giriş Yap"
            onSuccess={() => {
              markWelcomeSeen();
              setShowLogin(false);
            }}
            onShowProfileSetup={() => {}}
          />
        )}
      </>
    );
  }

  return (
    <>
      {children}
      {showProfileSetup && (
        <ProfileSetupModal
          user={{
            uid: user.uid,
            email: user.email ?? undefined,
            displayName: user.displayName ?? undefined,
            photoURL: user.photoURL ?? undefined,
          }}
          onClose={() => setProfileSetupDismissed(true)}
          onSetupComplete={setProfileSetupDone}
        />
      )}
    </>
  );
}
