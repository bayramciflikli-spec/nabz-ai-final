/**
 * Ülkeye göre yasal kurallar – abone olanları kapsar
 * Kullanıcı ülkesi (IP) ile hangi yasanın geçerli olduğu belirlenir.
 */

export type LegalCode = "KVKK" | "GDPR" | "CCPA" | "LGPD";

export interface CountryRule {
  law: LegalCode;
  /** Gizlilik metni URL yolu */
  legalPath: string;
  /** Yasa metni etiketi (örn. "KVKK Aydınlatma Metni") */
  legalLabel: string;
}

const GDPR_COUNTRIES = new Set([
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU",
  "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES",
  "SE", "GB", "IS", "LI", "NO", "CH", "MK", "RS", "AL", "BA", "ME", "XK",
]);

const CCPA_COUNTRIES = new Set(["US"]);

const KVKK_COUNTRIES = new Set(["TR", "AZ"]);

/** LGPD – Brezilya Lei Geral de Proteção de Dados */
const LGPD_COUNTRIES = new Set(["BR"]);

/** Ülke koduna göre geçerli yasa */
export function getCountryRule(countryCode: string | null): CountryRule {
  const code = countryCode?.toUpperCase().trim();
  if (!code) return getDefaultRule();

  if (KVKK_COUNTRIES.has(code)) {
    return {
      law: "KVKK",
      legalPath: "/yasal/kvkk",
      legalLabel: "KVKK Aydınlatma Metni",
    };
  }
  if (CCPA_COUNTRIES.has(code)) {
    return {
      law: "CCPA",
      legalPath: "/yasal/ccpa",
      legalLabel: "CCPA (California Consumer Privacy Act)",
    };
  }
  if (LGPD_COUNTRIES.has(code)) {
    return {
      law: "LGPD",
      legalPath: "/yasal/lgpd",
      legalLabel: "LGPD (Lei Geral de Proteção de Dados)",
    };
  }
  if (GDPR_COUNTRIES.has(code)) {
    return {
      law: "GDPR",
      legalPath: "/yasal/gizlilik",
      legalLabel: "GDPR / Gizlilik Politikası",
    };
  }

  return getDefaultRule();
}

function getDefaultRule(): CountryRule {
  return {
    law: "GDPR",
    legalPath: "/yasal/gizlilik",
    legalLabel: "GDPR / Gizlilik Politikası",
  };
}

/** Kullanıcının hangi yasaya tabi olduğunu döndürür */
export function getActiveLaw(countryCode: string | null): LegalCode {
  return getCountryRule(countryCode).law;
}

/** AB üyesi veya GDPR geçerli ülke mi? */
export function isEuropeanUnion(countryCode: string | null): boolean {
  const code = countryCode?.toUpperCase().trim();
  return !!code && GDPR_COUNTRIES.has(code);
}
