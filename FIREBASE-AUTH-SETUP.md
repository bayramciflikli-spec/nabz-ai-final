# Firebase Auth Sağlayıcılarını Etkinleştirme

Yahoo ve Microsoft ile giriş için Firebase Console'da sağlayıcıları etkinleştirmeniz gerekir.

## Hızlı Bağlantı

1. [Firebase Console - Authentication](https://console.firebase.google.com/)
2. Projenizi seçin
3. Sol menüden **Authentication** → **Sign-in method**

## Adım Adım

### Google (varsayılan olarak etkin)
- Zaten etkin olmalı
- Etkin değilse: "Google" satırına tıklayın → "Enable" → Kaydedin

### Yahoo
1. "Sign-in method" sayfasında **Add new provider** tıklayın
2. **Yahoo** seçin
3. [Yahoo Developer](https://developer.yahoo.com/apps/) üzerinden uygulama oluşturun
4. Client ID ve Client Secret'ı kopyalayıp Firebase'e yapıştırın
5. **Enable** → Kaydedin

### Microsoft
1. "Sign-in method" sayfasında **Add new provider** tıklayın
2. **Microsoft** seçin
3. [Azure Portal](https://portal.azure.com/) → App registrations → New registration
4. Redirect URI: `https://PROJECT_ID.firebaseapp.com/__/auth/handler`
5. Client ID ve Client Secret'ı Firebase'e yapıştırın
6. **Enable** → Kaydedin

### E-posta/Şifre
1. "Sign-in method" sayfasında **Email/Password** satırına tıklayın
2. **Enable** → **Save**

## Doğrulama

Tüm sağlayıcılar etkinleştirildikten sonra NABZ-AI uygulamasında kayıt modalı tüm seçenekleri gösterecektir.

---

## E-posta Şablonları (Opsiyonel)

**Authentication → Templates** bölümünden:
- **Email verification**: E-posta doğrulama şablonu
- **Password reset**: Şifre sıfırlama şablonu

Action URL (Next.js): `https://yourdomain.com` veya `http://localhost:3000` (geliştirme için)
