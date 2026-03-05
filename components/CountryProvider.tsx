"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { getCountryRule, type CountryRule } from "@/lib/countryRules";

interface CountryContextValue {
  country: string | null;
  countryRule: CountryRule;
  loading: boolean;
}

const CountryContext = createContext<CountryContextValue>({
  country: null,
  countryRule: getCountryRule(null),
  loading: true,
});

export function CountryProvider({ children }: { children: React.ReactNode }) {
  const [country, setCountry] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/locale")
      .then((r) => {
        if (!r.ok) return { country: null };
        return r.json();
      })
      .then((data) => {
        const c = data?.country as string | undefined;
        setCountry(c?.toUpperCase() ?? null);
      })
      .catch(() => setCountry(null))
      .finally(() => setLoading(false));
  }, []);

  const countryRule = getCountryRule(country);

  return (
    <CountryContext.Provider value={{ country, countryRule, loading }}>
      {children}
    </CountryContext.Provider>
  );
}

export function useCountry(): CountryContextValue {
  return useContext(CountryContext);
}
