# Admin paneli güvenlik ve kullanım

## NABZ-AI içinde admin paneli

- Admin paneli uygulamanın **içinde** yer alır: `/admin` ve alt sayfalar.
- Giriş linki (Kontrol Kulesi / Admin Panel) **sadece** `NEXT_PUBLIC_ADMIN_UIDS` içindeki UID’ye sahip kullanıcılara gösterilir (Header, Sidebar, UserMenu, MobileProfileSheet, HomePage, Dashboard, Settings).
- Başka kullanıcılar admin linkini görmez; `/admin` adresini bilseler bile giriş yapsalar yetkisiz mesajı alır.

## Cihaz doğrulama (yeni cihazda e-posta kodu)

- **Yeni cihazdan** admin panele girildiğinde:
  1. E-posta (Gmail vb.) adresine **6 haneli doğrulama kodu** gönderilir (Resend).
  2. Kullanıcı uygulamada açılan **“Kodu gir”** ekranına bu kodu yazar ve onaylar.
  3. Doğru kod girilince cihaz **oturumla eşleştirilir** (çerez + Firestore oturumu, 30 gün).
- Aynı cihazda tekrar girişte kod istenmez (çerez geçerli olduğu sürece).
- **Koruma:** Hesap çalınsa bile yeni cihazda kod olmadan admin panele girilemez.

### Teknik

- Kod gönderme: `POST /api/admin/verify-device/send` (admin token gerekli).
- Kod doğrulama: `POST /api/admin/verify-device/confirm` (body: `{ code }`), başarıda `nabz_admin_session` çerezi set edilir.
- Durum: `GET /api/admin/verify-device/status` → `{ verified: true|false }`.
- Firestore: `adminVerificationCodes` (geçici kodlar), `adminSessions` (cihaz oturumları).
- Rate limit: Kod isteği en az 60 sn arayla; 5 yanlış kod denemesi sonrası 15 dk kilidi.

## Admin’in güncellemelerden etkilenmemesi

- “Admini güncelle demeden güncellemelerden etkilenmesin” için:
  - Admin sayfaları ve API’ler mümkün olduğunca **ayrı tutulur**; ana uygulama güncellemelerinde admin rotalarına gereksiz dokunulmaz.
  - İsterseniz Vercel’de sadece belirli path’leri (örn. `/admin` dışı) deploy eden veya admin’i ayrı branch’te tutan bir iş akışı kullanılabilir.
- Tarayıcı önbelleği: Gerekirse `next.config.js` içinde `/admin` için ayrı cache header’ları eklenebilir; şu an varsayılan Next davranışı kullanılıyor.

## Ek güvenlik önerileri

1. **Oturum süresi:** Cihaz çerezi 30 gün. Daha kısa süre (örn. 7 gün) için `lib/adminDeviceVerify.ts` içindeki `ADMIN_SESSION_MAX_AGE_DAYS` değeri düşürülebilir.
2. **Admin giriş logu:** Önemli admin işlemleri (ve isteğe bağlı her admin girişi) Firestore’da bir `adminAuditLog` koleksiyonuna tarih, UID, işlem adı vb. yazılabilir.
3. **IP kısıtı:** Sadece belirli IP’lerden admin erişimine izin vermek için middleware veya API route’larda IP kontrolü eklenebilir.
4. **2FA:** İleride Firebase App Check veya TOTP (Google Authenticator) ile ikinci faktör eklenebilir; şu an e-posta kodu tek faktör.
5. **RESEND / e-posta:** Kod e-postası için `RESEND_API_KEY` ve `RESEND_FROM` (ve gerekirse `ADMIN_EMAIL`) ayarlarının doğru ve güvenli olduğundan emin olun.

## Gerekli ortam değişkenleri

- **Admin UID:** `NEXT_PUBLIC_ADMIN_UIDS` (virgülle ayrılmış UID listesi).
- **E-posta kodu:** `RESEND_API_KEY`, `RESEND_FROM`; Firebase Admin tarafı için `FIREBASE_SERVICE_ACCOUNT_KEY` (kod/oturum Firestore’a yazılıyor).
