/**
 * Firebase Auth hata kodlarını kullanıcı dostu Türkçe mesajlara çevirir
 */
export const AUTH_ERROR_MESSAGES: Record<string, string> = {
  "auth/configuration-not-found": "Firebase Auth yapılandırılmamış. Firebase Console → Authentication → Sign-in method bölümünden Google, E-posta/Şifre vb. sağlayıcıları etkinleştirin.",
  "auth/email-already-in-use": "Bu e-posta adresi zaten kullanılıyor. Giriş yapmayı deneyin.",
  "auth/invalid-email": "Geçersiz e-posta adresi.",
  "auth/operation-not-allowed": "Bu giriş yöntemi şu an etkin değil. Firebase Console'da Authentication → Sign-in method'u etkinleştirin.",
  "auth/weak-password": "Şifre en az 6 karakter olmalıdır.",
  "auth/user-disabled": "Bu hesap devre dışı bırakılmış.",
  "auth/user-not-found": "Bu e-posta ile kayıtlı hesap bulunamadı.",
  "auth/wrong-password": "Hatalı şifre.",
  "auth/invalid-credential": "E-posta veya şifre hatalı.",
  "auth/too-many-requests": "Çok fazla deneme. Lütfen bir süre sonra tekrar deneyin.",
  "auth/network-request-failed": "Ağ hatası. İnternet bağlantınızı kontrol edin.",
  "auth/popup-blocked": "Giriş penceresi engellendi. Lütfen açılır pencerelere izin verin.",
  "auth/popup-closed-by-user": "Giriş penceresi kapatıldı.",
  "auth/cancelled-popup-request": "Giriş iptal edildi.",
  "auth/requires-recent-login": "Bu işlem için tekrar giriş yapmanız gerekiyor.",
  "auth/account-exists-with-different-credential": "Bu e-posta farklı bir giriş yöntemiyle kayıtlı.",
};

export function getAuthErrorMessage(error: unknown): string {
  if (!error) return "Bir hata oluştu.";
  const code = (error as { code?: string })?.code;
  if (code && AUTH_ERROR_MESSAGES[code]) {
    return AUTH_ERROR_MESSAGES[code];
  }
  const message = (error as { message?: string })?.message;
  return message || "Giriş başarısız. Lütfen tekrar deneyin.";
}
