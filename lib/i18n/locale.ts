import type { Locale } from "./types";

const STORAGE_KEY = "nabz-locale";
const AUTO_KEY = "nabz-locale-auto";

/** Desteklenen tüm locale kodları (cihazlar arası sync için userSyncFirestore kullanır) */
export const VALID_LOCALES: Locale[] = [
  "tr", "en", "es", "fr", "de", "ar", "zh", "ja", "ko", "pt", "ru",
  "hi", "id", "it", "nl", "pl", "vi", "th", "uk", "sv", "bn", "ms",
  "fa", "he", "cs", "ro", "hu", "el", "da", "fi", "no", "sk", "bg",
  "hr", "sr", "sl", "lt", "lv", "et",
];

/**
 * Ülke kodu → dil haritası (ISO 3166-1 alpha-2)
 * Tekil anahtarlar - son değer kazanır
 */
const COUNTRY_TO_LOCALE: Record<string, Locale> = {
  AD: "en", AE: "ar", AF: "fa", AG: "en", AI: "en", AL: "en", AM: "en", AO: "pt",
  AQ: "en", AR: "es", AS: "en", AT: "de", AU: "en", AW: "nl", AX: "sv", AZ: "tr",
  BA: "hr", BB: "en", BD: "bn", BE: "fr", BF: "fr", BG: "bg", BH: "ar", BI: "fr",
  BJ: "fr", BL: "fr", BM: "en", BN: "ms", BO: "es", BQ: "nl", BR: "pt", BS: "en",
  BT: "en", BV: "no", BW: "en", BY: "ru", BZ: "en", CA: "en", CC: "en", CD: "fr",
  CF: "fr", CG: "fr", CH: "de", CI: "fr", CK: "en", CL: "es", CM: "fr", CN: "zh",
  CO: "es", CR: "es", CU: "es", CV: "pt", CW: "nl", CX: "en", CY: "el", CZ: "cs",
  DE: "de", DJ: "fr", DK: "da", DM: "en", DO: "es", DZ: "ar", EC: "es", EE: "et",
  EG: "ar", EH: "ar", ER: "ar", ES: "es", ET: "en", FI: "fi", FJ: "en", FK: "en",
  FM: "en", FO: "da", FR: "fr", GA: "fr", GB: "en", GD: "en", GE: "en", GF: "fr",
  GG: "en", GH: "en", GI: "en", GL: "da", GM: "en", GN: "fr", GP: "fr", GQ: "es",
  GR: "el", GS: "en", GT: "es", GU: "en", GW: "pt", GY: "en", HK: "zh", HM: "en",
  HN: "es", HR: "hr", HT: "fr", HU: "hu", ID: "id", IE: "en", IL: "he", IM: "en",
  IN: "hi", IO: "en", IQ: "ar", IR: "fa", IS: "en", IT: "it", JE: "en", JM: "en",
  JO: "ar", JP: "ja", KE: "en", KG: "ru", KH: "en", KI: "en", KM: "fr", KN: "en",
  KP: "ko", KR: "ko", KW: "ar", KY: "en", KZ: "ru", LA: "en", LB: "ar", LC: "en",
  LI: "de", LK: "en", LR: "en", LS: "en", LT: "lt", LU: "fr", LV: "lv", LY: "ar",
  MA: "ar", MC: "fr", MD: "ro", ME: "sr", MF: "fr", MG: "fr", MH: "en", MK: "en",
  ML: "fr", MM: "en", MN: "en", MO: "zh", MP: "en", MQ: "fr", MR: "ar", MS: "en",
  MT: "en", MU: "en", MV: "en", MW: "en", MX: "es", MY: "ms", MZ: "pt", NA: "en",
  NC: "fr", NE: "fr", NF: "en", NG: "en", NI: "es", NL: "nl", NO: "no", NP: "en",
  NR: "en", NU: "en", NZ: "en", OM: "ar", PA: "es", PE: "es", PF: "fr", PG: "en",
  PH: "en", PK: "en", PL: "pl", PM: "fr", PN: "en", PR: "es", PS: "ar", PT: "pt",
  PW: "en", PY: "es", QA: "ar", RE: "fr", RO: "ro", RS: "sr", RU: "ru", RW: "en",
  SA: "ar", SB: "en", SC: "en", SD: "ar", SE: "sv", SG: "en", SH: "en", SI: "sl",
  SJ: "no", SK: "sk", SL: "en", SM: "it", SN: "fr", SO: "ar", SR: "nl", SS: "en",
  ST: "pt", SV: "es", SX: "nl", SY: "ar", SZ: "en", TC: "en", TD: "fr", TF: "fr",
  TG: "fr", TH: "th", TJ: "fa", TK: "en", TL: "pt", TM: "ru", TN: "ar", TO: "en",
  TR: "tr", TT: "en", TV: "en", TW: "zh", TZ: "en", UA: "uk", UG: "en", UM: "en",
  US: "en", UY: "es", UZ: "ru", VA: "it", VC: "en", VE: "es", VG: "en", VI: "en",
  VN: "vi", VU: "en", WF: "fr", WS: "en", YE: "ar", YT: "fr", ZA: "en", ZM: "en",
  ZW: "en", XK: "en",
};

/** Tarayıcı dili → locale (navigator.language) */
function browserLangToLocale(lang: string): Locale {
  const code = lang.split("-")[0].toLowerCase();
  const map: Record<string, Locale> = {
    tr: "tr", en: "en", es: "es", fr: "fr", de: "de", ar: "ar", zh: "zh", ja: "ja",
    ko: "ko", pt: "pt", ru: "ru", hi: "hi", id: "id", it: "it", nl: "nl", pl: "pl",
    vi: "vi", th: "th", uk: "uk", sv: "sv", bn: "bn", ms: "ms", fa: "fa", he: "he",
    cs: "cs", ro: "ro", hu: "hu", el: "el", da: "da", fi: "fi", no: "no", sk: "sk",
    bg: "bg", hr: "hr", sr: "sr", sl: "sl", lt: "lt", lv: "lv", et: "et",
  };
  return map[code] ?? "en";
}

export function getStoredLocale(): Locale | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && VALID_LOCALES.includes(stored as Locale)) return stored as Locale;
  return null;
}

export function isAutoLocale(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(AUTO_KEY) !== "false";
}

export function setLocale(locale: Locale, auto = false): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, locale);
  localStorage.setItem(AUTO_KEY, auto ? "true" : "false");
}

/** Otomatik modda mevcut locale'i güncelle */
export async function refreshAutoLocale(): Promise<Locale> {
  const newLocale = await getInitialLocale();
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, newLocale);
  }
  return newLocale;
}

export async function detectLocaleFromCountry(): Promise<Locale> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch("/api/locale", { signal: controller.signal });
    clearTimeout(timeout);
    const data = await res.json();
    const country = data?.country as string | undefined;
    if (country && COUNTRY_TO_LOCALE[country]) {
      return COUNTRY_TO_LOCALE[country];
    }
  } catch {
    // API hatası veya timeout – sessizce tarayıcı diline dön
  }
  return getBrowserLocale();
}

export function getBrowserLocale(): Locale {
  if (typeof navigator === "undefined") return "en";
  const nav = navigator as Navigator & { userLanguage?: string };
  const lang = nav.language || nav.userLanguage || "";
  return browserLangToLocale(lang);
}

export async function getInitialLocale(): Promise<Locale> {
  const stored = getStoredLocale();
  const auto = isAutoLocale();

  if (!auto && stored) return stored;
  if (stored && !auto) return stored;

  const countryLocale = await detectLocaleFromCountry();
  if (countryLocale) return countryLocale;

  return getBrowserLocale();
}
