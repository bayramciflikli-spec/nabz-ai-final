"use client";

import Link from "next/link";
import { useLocale } from "@/components/LocaleProvider";
import { useCountry } from "@/components/CountryProvider";

export function LegalFooter() {
  const { t } = useLocale();
  const { countryRule } = useCountry();
  return (
    <footer className="border-t border-white/10 mt-auto py-4 px-6">
      <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-white/50">
        <Link href="/settings" className="hover:text-white transition-colors">
          {t("footer.settings")}
        </Link>
        <Link href="/yasal/kullanim-sartlari" className="hover:text-white transition-colors">
          {t("footer.terms")}
        </Link>
        <Link href={countryRule.legalPath} className="hover:text-white transition-colors">
          {countryRule.legalLabel}
        </Link>
        <Link href="/mall" className="hover:text-white transition-colors">
          {t("footer.mall")}
        </Link>
        <Link href="/transparency" className="hover:text-white transition-colors">
          Şeffaflık Raporu
        </Link>
        <Link href="/yasal/reklam-politikasi" className="hover:text-white transition-colors">
          {t("footer.adPolicy")}
        </Link>
        <Link href="/yasal/fikri-mulkiyet" className="hover:text-white transition-colors">
          {t("footer.ipRights")}
        </Link>
        <Link href="/yasal/dmca-bildirim" className="hover:text-white transition-colors">
          DMCA Bildirim
        </Link>
        <span className="text-white/30">|</span>
        <span>© {new Date().getFullYear()} NABZ-AI</span>
      </div>
    </footer>
  );
}
