# Giriş hatası: "authDomain ve apiKey doğru mu kontrol edin"

Bu hata, **Google ile giriş yap** vb. tıklandığında `.env.local` içindeki Firebase değerlerinin eksik veya yanlış olduğunu gösterir.

## 1. Değerleri nereden alacaksın?

1. [Firebase Console](https://console.firebase.google.com) → projeni seç  
2. **Proje ayarları** (üstteki dişli) → **Genel**  
3. Aşağı kaydır → **Web uygulamanız** (veya "SDK kurulumu ve yapılandırma")  
4. **config** objesindeki değerleri bire bir kopyala

## 2. .env.local’de mutlaka dolu olması gerekenler

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIza...uzun_bir_anahtar
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=PROJE_ID.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=proje-id-kucuk-harflerle
```

### authDomain kuralları

- **Doğru:** `nabz-ai-12345.firebaseapp.com`  
- **Yanlış:** `https://nabz-ai-12345.firebaseapp.com` (https yok)  
- **Yanlış:** `nabz-ai-12345.firebaseapp.com/` (sonda slash yok)  
- **Yanlış:** Boş veya sadece boşluk

### apiKey

- Firebase’in verdiği **Web API Key** (genelde `AIza` ile başlar).  
- Boş veya yanlış yapıştırılmışsa giriş hata verir.

## 3. Kaydettikten sonra

1. `.env.local` dosyasını kaydet  
2. Sunucuyu yeniden başlat: `npm run dev`  
3. Sayfayı yenile ve tekrar **Google ile giriş yap** dene  

## 4. Hâlâ hata alıyorsan

- Firebase Console → **Authentication** → **Sign-in method** → **Google** açık ve **Kaydet**’e basılmış olmalı.  
- **Authentication** → **Settings** → **Authorized domains** içinde sitenin adresi (örn. `localhost`, `xxx.vercel.app`) ekli olmalı.
