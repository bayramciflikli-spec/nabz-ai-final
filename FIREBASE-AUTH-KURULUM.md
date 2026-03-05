# Firebase Auth Kurulum Rehberi

Bu rehber, giriş yöntemlerini (Google, E-posta vb.) **otomatik** veya **manuel** etkinleştirmenizi sağlar.

---

## Otomatik Yöntem (Önerilen)

### Adım 1: Service Account Anahtarı Oluşturun

1. [Firebase Console](https://console.firebase.google.com) → Projenizi seçin
2. Sol menü **Proje ayarları** (dişli ikonu) → **Hizmet hesapları** sekmesi
3. **Yeni özel anahtar oluştur** butonuna tıklayın
4. JSON dosyası indirilecek
5. İndirilen JSON dosyasının **tüm içeriğini** kopyalayın (tek satır olarak)

### Adım 2: .env.local Dosyasına Ekleyin

`.env.local` dosyanızı açın ve şu satırı ekleyin (veya güncelleyin):

```
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"...","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"...","client_id":"...","auth_uri":"...","token_uri":"...",...}
```

**Önemli:** JSON içeriğini tek satır olarak, tırnak içinde yapıştırın. Satır sonları `\n` olarak kalmalı.

### Adım 3: Script'i Çalıştırın

```bash
npm run enable-auth
```

Script, E-posta/Şifre ve Google sağlayıcılarını API üzerinden otomatik etkinleştirecektir.

---

## Manuel Yöntem

Service account eklemek istemiyorsanız, Firebase Console üzerinden manuel etkinleştirin:

### 1. Sign-in Method Sayfasına Gidin

**Bağlantı:** [Firebase Auth - Sign-in method](https://console.firebase.google.com/project/benim-ai-projem-2/authentication/providers)

(Proje ID'niz farklıysa `benim-ai-projem-2` kısmını değiştirin.)

### 2. Her Sağlayıcıyı Etkinleştirin

| Sağlayıcı | İşlem |
|-----------|-------|
| **Email/Password** | Satıra tıklayın → **Enable** → **Save** |
| **Google** | Satıra tıklayın → **Enable** → **Save** |
| **Microsoft** | Satıra tıklayın → **Enable** → Proje adı girin → **Save** |
| **Yahoo** | Satıra tıklayın → **Enable** → **Save** |
| **Apple** | Satıra tıklayın → **Enable** → Apple Developer bilgileri girin |

### 3. Authorized Domains

**Settings** sekmesine gidin → **Authorized domains** bölümünde şunların olduğundan emin olun:
- `localhost`
- `127.0.0.1`

---

## Sorun Giderme

### "auth/configuration-not-found" Hatası

Bu hata, hiçbir giriş yönteminin etkin olmadığını gösterir. Yukarıdaki adımları tamamlayın.

### "auth/operation-not-allowed" Hatası

İlgili sağlayıcı etkin değil. Firebase Console'da o sağlayıcıyı Enable yapın.

### Script Çalışmıyor

- `FIREBASE_SERVICE_ACCOUNT_KEY` doğru formatta mı? (Geçerli JSON, tek satır)
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID` .env.local'de tanımlı mı?

---

## Hızlı Bağlantılar

- [Sign-in providers](https://console.firebase.google.com/project/benim-ai-projem-2/authentication/providers)
- [Authorized domains](https://console.firebase.google.com/project/benim-ai-projem-2/authentication/settings)
- [Service accounts](https://console.firebase.google.com/project/benim-ai-projem-2/settings/serviceaccounts/adminsdk)
