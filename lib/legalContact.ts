/**
 * Yasal iletişim e-postası – KVKK, DMCA, gizlilik talepleri için.
 * .env.local: NEXT_PUBLIC_LEGAL_EMAIL veya ADMIN_EMAIL yerine kullanılabilir.
 */
export const LEGAL_EMAIL =
  (typeof process !== "undefined" && process.env.NEXT_PUBLIC_LEGAL_EMAIL) ||
  "legal@nabz.app";
