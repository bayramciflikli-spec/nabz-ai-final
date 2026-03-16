# Admin paneli güvenlik ve güncelleme

## Admin NABZ-AI uygulamasının içinde (dosya ayrı)

- Admin paneli **aynı proje içinde**, ama admin’e özel kod **ayrı klasörde**:
  - **`admin/`** – Admin bileşenleri ve lib (AdminShell, AdminDeviceVerify, adminDevice).
  - **`app/admin/`** – Admin sayfa route’ları.
  - **`app/api/admin/`** – Admin API route’ları.
- Uygulama tek; sadece dosya yapısı böyle ayrıldı (bakım ve ileride bölmek için).
- Sadece **admin kullanıcıda** görünür: Hesabım menüsü (UserMenu) ve mobil profil (MobileProfileSheet) içinde "Kontrol Kulesi" / "Admin Panel" linki yalnızca `NEXT_PUBLIC_ADMIN_UIDS` içindeki UID’ye sahip kullanıcıda gösterilir.

## Güncellemelerden izolasyon ("admini güncelle demeden etkilenmesin")

- Şu an **tek Next.js uygulaması** olduğu için her deploy hem uygulamayı hem admin’i birlikte günceller.
- İzolasyon seçenekleri:
  1. **Süreç**: Admin ile ilgili değişiklikleri ayrı commit’lerde yapıp sadece ihtiyaç olduğunda "admin tarafı" deploy edebilirsiniz (aynı repo, aynı build; sadece ne zaman deploy ettiğinizi yönetirsiniz).
  2. **İleride ayrı deploy**: Admin’i tamamen ayırmak isterseniz, `app/admin` ve `app/api/admin` ayrı bir projeye taşınıp ayrı bir Vercel/proje olarak deploy edilebilir; böylece "admini güncelle" dediğinizde sadece o proje güncellenir.

## Yeni cihaz doğrulama (e-posta kodu)

- Admin panele **yeni cihazdan** ilk girişte:
  1. Cihaz kimliği (localStorage’da) sunucuda "güvenilir" listede yoksa, **"Kodu gir"** ekranı açılır.
  2. "E-postaya kod gönder" ile **6 haneli kod** hesabınızdaki e-posta adresine (Resend ile) gönderilir.
  3. Kodu uygulamada girip "Onayla" demeden admin paneline **erişilemez**.
  4. Kod onaylanınca bu cihaz `admin_trusted_devices` koleksiyonuna eklenir; bir daha aynı cihazda kod istenmez.

Firestore:

- `admin_trusted_devices/{uid}`: `deviceIds` dizisi (onaylanmış cihaz kimlikleri).
- `admin_verification_codes/{uid}_{deviceId}`: `code`, `expiresAt` (10 dakika TTL).

## Ek güvenlik önerileri

1. **E-posta**: Admin hesabında mutlaka doğrulanmış, güvenilir bir e-posta kullanın (kod bu adrese gider).
2. **RESEND / e-posta**: `RESEND_API_KEY` ve `RESEND_FROM` production’da doğru tanımlı olsun; kod e-postası düzgün gitsin.
3. **2FA (TOTP)**: İleride Google Authenticator vb. ile ikinci faktör eklenebilir.
4. **Admin API rate limit**: `/api/admin/*` isteklerine rate limit koyulabilir (Vercel / middleware veya API tarafında).
5. **Audit log**: Admin işlemlerini (kim, ne, ne zaman) Firestore’da veya başka bir yerde loglayabilirsiniz.
6. **Cihaz listesi**: İleride "Güvenilen cihazlar" sayfası eklenip, cihaz silme (cihazı listeden çıkarma) yapılabilir.
7. **Oturum süresi**: Belirli bir süre sonra admin tarafında tekrar kod isteyebilirsiniz (örn. 30 günde bir).

## Ortam değişkenleri

- `NEXT_PUBLIC_ADMIN_UIDS`: Virgülle ayrılmış admin UID listesi.
- `RESEND_API_KEY`, `RESEND_FROM`: E-posta (doğrulama kodu) gönderimi.
- `FIREBASE_SERVICE_ACCOUNT_KEY`: Admin API’lerinde kullanıcı e-postası ve Firestore erişimi için.
