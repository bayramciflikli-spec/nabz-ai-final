"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
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

  // Aynı tarayıcıda kalıcı oturum. Mobil: Google'dan dönüşte önce redirect sonucu işlensin, giriş tamamlansın.
  const unsubRef = useRef<(() => void) | null>(null);
  useEffect(() => {
    setPersistence(auth, browserLocalPersistence).catch(() => {});

    (async () => {
      await handleRedirectResult();
      unsubRef.current = onAuthStateChanged(auth, (u) => {
        try {
          setUser(u);
          setLoading(false);
          if (u) {
            setShowLoginModal(false);
            ensureUserInEcosystem(u.uid).catch(() => {});
          }
        } catch (err) {
          console.error("[AuthProvider] onAuthStateChanged callback error:", err);
          setLoading(false);
        }
      });
    })().catch(() => {
      setLoading(false);
      unsubRef.current = onAuthStateChanged(auth, (u) => {
        setUser(u);
        setLoading(false);
      });
    });

    return () => {
      unsubRef.current?.();
    };
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
