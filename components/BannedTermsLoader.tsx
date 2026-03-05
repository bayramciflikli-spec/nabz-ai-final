"use client";

import { useEffect } from "react";
import { setBannedTermsCache } from "@/lib/searchGuard";

/**
 * Uygulama yüklendiğinde yasaklı terim listesini API'den alır ve searchGuard cache'ine yazar.
 */
export function BannedTermsLoader() {
  useEffect(() => {
    fetch("/api/banned-terms")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data?.terms)) setBannedTermsCache(data.terms);
      })
      .catch(() => {});
  }, []);
  return null;
}
