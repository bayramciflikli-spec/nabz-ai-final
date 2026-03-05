"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Locale } from "@/lib/i18n/types";
import { t } from "@/lib/i18n/translations";
import {
  getInitialLocale,
  isAutoLocale,
  setLocale as saveLocale,
  refreshAutoLocale,
} from "@/lib/i18n/locale";

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale, auto?: boolean) => void | Promise<void>;
  t: (key: string) => string;
  isAuto: boolean;
  loading: boolean;
}

const LocaleContext = createContext<LocaleContextValue>({
  locale: "tr",
  setLocale: () => {},
  t: (k) => k,
  isAuto: true,
  loading: true,
});

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [locale, setLocaleState] = useState<Locale>("tr");
  const [isAuto, setIsAutoState] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const l = await Promise.race([
          getInitialLocale(),
          new Promise<Locale>((_, rej) => setTimeout(() => rej(new Error("timeout")), 6000)),
        ]);
        setLocaleState(l);
      } catch {
        setLocaleState("tr");
      }
      setIsAutoState(isAutoLocale());
      setLoading(false);
    };
    load();
  }, []);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = locale;
    }
  }, [locale]);

  const setLocale = async (l: Locale, auto = false) => {
    setIsAutoState(auto);
    if (auto) {
      const detected = await refreshAutoLocale();
      setLocaleState(detected);
      saveLocale(detected, true);
    } else {
      setLocaleState(l);
      saveLocale(l, false);
    }
    router.refresh();
  };

  const value: LocaleContextValue = {
    locale,
    setLocale,
    t: (key) => t(locale, key),
    isAuto,
    loading,
  };

  return (
    <LocaleContext.Provider value={value}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    return {
      locale: "tr",
      setLocale: () => {},
      t: (k) => k,
      isAuto: true,
      loading: false,
    };
  }
  return ctx;
}
