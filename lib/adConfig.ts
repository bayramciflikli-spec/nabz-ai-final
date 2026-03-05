/**
 * Ülkeye göre reklam yapılandırması
 * AdSense: Varsayılan olarak IP ile otomatik hedefleme yapar.
 * Bölgeye özel ad birimleri için .env.local'de slot ID'leri tanımlayabilirsiniz.
 */

/** Bölge → AdSense slot ID eşlemesi (opsiyonel env değişkenleri) */
const REGION_SLOTS: Record<string, string | undefined> = {
  TR: process.env.NEXT_PUBLIC_ADSENSE_SLOT_TR,
  DE: process.env.NEXT_PUBLIC_ADSENSE_SLOT_DE,
  AT: process.env.NEXT_PUBLIC_ADSENSE_SLOT_DE,
  CH: process.env.NEXT_PUBLIC_ADSENSE_SLOT_DE,
  US: process.env.NEXT_PUBLIC_ADSENSE_SLOT_US,
  GB: process.env.NEXT_PUBLIC_ADSENSE_SLOT_GB,
  FR: process.env.NEXT_PUBLIC_ADSENSE_SLOT_FR,
  ES: process.env.NEXT_PUBLIC_ADSENSE_SLOT_ES,
  BR: process.env.NEXT_PUBLIC_ADSENSE_SLOT_BR,
  IN: process.env.NEXT_PUBLIC_ADSENSE_SLOT_IN,
  JP: process.env.NEXT_PUBLIC_ADSENSE_SLOT_JP,
  KR: process.env.NEXT_PUBLIC_ADSENSE_SLOT_KR,
  AR: process.env.NEXT_PUBLIC_ADSENSE_SLOT_AR,
  MX: process.env.NEXT_PUBLIC_ADSENSE_SLOT_ES,
  IT: process.env.NEXT_PUBLIC_ADSENSE_SLOT_IT,
  NL: process.env.NEXT_PUBLIC_ADSENSE_SLOT_NL,
  RU: process.env.NEXT_PUBLIC_ADSENSE_SLOT_RU,
  PL: process.env.NEXT_PUBLIC_ADSENSE_SLOT_PL,
  CN: process.env.NEXT_PUBLIC_ADSENSE_SLOT_ZH,
  TW: process.env.NEXT_PUBLIC_ADSENSE_SLOT_ZH,
};

/**
 * Ülke koduna göre reklam slot ID'si döndürür.
 * Bölgeye özel slot tanımlı değilse varsayılan slot kullanılır.
 */
export function getAdSlotForCountry(country: string | null, defaultSlot?: string): string {
  if (!country) return defaultSlot || "auto";
  const regionSlot = REGION_SLOTS[country.toUpperCase()];
  return regionSlot || defaultSlot || "auto";
}
