/**
 * Admin panel cihaz doğrulama: yeni cihazda e-posta kodu ile onay.
 * Hırsızlık / yetkisiz erişime karşı ek güvenlik katmanı.
 */

export const ADMIN_SESSION_COOKIE = "nabz_admin_session";
export const ADMIN_SESSION_MAX_AGE_DAYS = 30;
export const ADMIN_CODE_EXPIRY_MINUTES = 10;
export const ADMIN_CODE_LENGTH = 6;
/** Kod gönderme: aynı kullanıcı için en az bu kadar saniye ara */
export const ADMIN_SEND_COOLDOWN_SECONDS = 60;
/** Yanlış kod denemesi: bu kadar denemeden sonra kilitle (süre: 15 dk) */
export const ADMIN_MAX_ATTEMPTS = 5;
export const ADMIN_LOCKOUT_MINUTES = 15;

export const COLLECTION_VERIFICATION_CODES = "adminVerificationCodes";
export const COLLECTION_SESSIONS = "adminSessions";
