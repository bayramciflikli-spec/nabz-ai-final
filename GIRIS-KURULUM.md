# 🔐 Giriş Kurulumu – Sorun Giderme

## Yapılan Değişiklik
- **Auth Emulator kapatıldı** – Gerçek Firebase Auth kullanılıyor (Google ile giriş çalışır)

## Adım 1: Firebase Console'da Google Girişini Etkinleştir

1. Şuraya git: https://console.firebase.google.com/project/benim-ai-projem-2/authentication/providers
2. **Google** satırına tıkla
3. **Etkinleştir** switch'ini aç
4. **Proje desteği e-postası** seç (veya kendi e-postanı yaz)
5. **Kaydet** de

## Adım 2: Authorized Domains

1. Authentication → **Ayarlar** (dişli ikonu) → **Authorized domains**
2. `localhost` listede olmalı – yoksa ekle

## Adım 3: Uygulamayı Aç

1. Masaüstündeki **NABZ-AI Kontrol Kulesi** kısayoluna çift tıkla
2. Veya tarayıcıda: http://localhost:3000/admin
3. **Giriş yap** → **Google ile kaydol** tıkla
4. Google hesabınla giriş yap

## Admin UID'ini Kontrol Et

Giriş yaptıktan sonra: http://localhost:3000/settings  
UID'ini kopyala ve `.env.local` içindeki `NEXT_PUBLIC_ADMIN_UIDS=...` ile eşleştiğinden emin ol.

---

**Sunucu çalışmıyorsa:** Terminalde `npm run dev` çalıştır.
