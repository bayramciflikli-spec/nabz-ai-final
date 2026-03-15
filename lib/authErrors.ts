/**
 * Firebase Auth hata kodlarını kullanıcı dostu Türkçe mesajlara çevirir
 */
export const AUTH_ERROR_MESSAGES: Record<string, string> = {
  "auth/configuration-not-found": "Giriş yapılandırılmamış. Firebase Console → Authentication → Sign-in method bölümünden Google vb. sağlayıcıları etkinleştirin.",
  "auth/unauthorized-domain": "Bu alan adı Firebase'de yetkili değil. Firebase Console → Authentication → Settings → Authorized domains listesine bu sitenin adresini ekleyin (örn. localhost veya vercel.app).",
  "auth/invalid-api-key": "Firebase API anahtarı geçersiz veya eksik. .env.local içindeki NEXT_PUBLIC_FIREBASE_* değerlerini kontrol edin.",
  "auth/argument-error": "Giriş ayarlarında eksik veya hatalı değer var. Yerelde: proje kökünde .env.local dosyasında NEXT_PUBLIC_FIREBASE_API_KEY, NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN, NEXT_PUBLIC_FIREBASE_PROJECT_ID tanımlı olmalı. authDomain sadece 'PROJE_ID.firebaseapp.com' formatında olmalı (https:// veya sonunda / yok). Değişiklikten sonra .next silinip sunucu yeniden başlatılmalı. Vercel'de: Dashboard → Proje → Settings → Environment Variables'a ekleyip Redeploy yapın.",
  "auth/email-already-in-use": "Bu e-posta adresi zaten kullanılıyor. Giriş yapmayı deneyin.",
  "auth/invalid-email": "Geçersiz e-posta adresi.",
  "auth/operation-not-allowed": "Bu giriş yöntemi etkin değil. Firebase Console → Authentication → Sign-in method'tan Google (veya kullandığınız sağlayıcıyı) etkinleştirin.",
  "auth/weak-password": "Şifre en az 6 karakter olmalıdır.",
  "auth/user-disabled": "Bu hesap devre dışı bırakılmış.",
  "auth/user-not-found": "Bu e-posta ile kayıtlı hesap bulunamadı.",
  "auth/wrong-password": "Hatalı şifre.",
  "auth/invalid-credential": "E-posta veya şifre hatalı.",
  "auth/too-many-requests": "Çok fazla deneme. Lütfen bir süre sonra tekrar deneyin.",
  "auth/network-request-failed": "Ağ hatası. İnternet bağlantınızı kontrol edin.",
  "auth/popup-blocked": "Giriş penceresi engellendi. Tarayıcıda açılır pencerelere izin verin veya 'Aynı sekmede giriş yap' linkini kullanın.",
  "auth/popup-closed-by-user": "Giriş penceresi kapatıldı.",
  "auth/cancelled-popup-request": "Giriş iptal edildi.",
  "auth/requires-recent-login": "Bu işlem için tekrar giriş yapmanız gerekiyor.",
  "auth/account-exists-with-different-credential": "Bu e-posta farklı bir giriş yöntemiyle kayıtlı.",
  "auth/internal-error": "Sunucu tarafında geçici bir hata oluştu. Lütfen birkaç dakika sonra tekrar deneyin.",
  "auth/tenant-id-mismatch": "Giriş yapılandırması eşleşmiyor. Proje ayarlarını kontrol edin.",
};

/** Mesaj metninden auth/xxx kodunu çıkarır (Firebase bazen sadece message verir) */
function extractAuthCode(message: string | undefined): string | null {
  if (!message || typeof message !== "string") return null;
  const match = message.match(/auth\/[a-z-]+/i);
  return match ? match[0] : null;
}

export function getAuthErrorMessage(error: unknown): string {
  if (!error) return "Giriş başarısız. Lütfen tekrar deneyin.";
  const err = error as { code?: string; message?: string };
  let code = err.code;
  if (!code && err.message) {
    code = extractAuthCode(err.message) ?? undefined;
  }
  if (code && AUTH_ERROR_MESSAGES[code]) {
    return AUTH_ERROR_MESSAGES[code];
  }
  const message = err.message;
  if (message && typeof message === "string") {
    if (message.toLowerCase().includes("firebase") && message.toLowerCase().includes("error")) {
      return "Giriş şu an yapılamıyor. Lütfen internet bağlantınızı ve tarayıcı izinlerini kontrol edin; sorun sürerse site yöneticisi Firebase Console'da 'Authorized domains' ve 'Sign-in method' ayarlarını kontrol etmelidir.";
    }
    if (message.length < 120) return message;
  }
  return "Giriş başarısız. Lütfen tekrar deneyin.";
}
