"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { ensureUserInEcosystem, handleRedirectResult } from "@/lib/firebase-auth";
import { onAuthStateChanged, setPersistence, browserLocalPersistence, User } from "firebase/auth";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  showLoginModal: boolean;
  setShowLoginModal: (show: boolean) => void;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  showLoginModal: false,
  setShowLoginModal: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    // Tarayıcıda kalıcı oturum: bir kez giriş yaptıktan sonra çıkış yapana kadar hatırlanır
    setPersistence(auth, browserLocalPersistence).catch(() => {});
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
      if (u) {
        setShowLoginModal(false);
        ensureUserInEcosystem(u.uid).catch(() => {});
      }
    });
    handleRedirectResult().catch(() => {});
    return () => unsub();
  }, []);

  useEffect(() => {
    const handler = () => setShowLoginModal(true);
    window.addEventListener("auth:unauthorized", handler);
    return () => window.removeEventListener("auth:unauthorized", handler);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        showLoginModal,
        setShowLoginModal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  return (
    ctx ?? {
      user: null,
      loading: false,
      showLoginModal: false,
      setShowLoginModal: () => {},
    }
  );
}
