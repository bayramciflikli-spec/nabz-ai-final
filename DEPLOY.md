# Nabız Hosting Rehberi

## Vercel ile Deploy (Önerilen)

### 1. GitHub'a Push
```bash
git add .
git commit -m "Deploy hazırlığı"
git push origin main
```

### 2. Vercel'e Bağla
1. [vercel.com](https://vercel.com) → Sign in (GitHub ile)
2. **Add New Project** → Repoyu seç
3. **Environment Variables** ekle (Settings → Environment Variables):

| Değişken | Değer |
|----------|-------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase Console'dan |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase Console'dan |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase Console'dan |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Firebase Console'dan |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase Console'dan |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase Console'dan |
| `OPENAI_API_KEY` | OpenAI API Key |
| `FIREBASE_SERVICE_ACCOUNT_KEY` | Firebase Service Account JSON (tek satır) |

4. **Deploy** tıkla

### 3. Firebase Auth Domain Güncelle
Deploy sonrası Vercel URL'inizi Firebase Console'a ekleyin:
- **Authentication** → **Settings** → **Authorized domains** → `your-app.vercel.app` ekle

---

## Capacitor (Mobil App) için

### Local geliştirme (Android emülatör)

1. **Terminal 1:** `calistir.bat` veya `npm run dev` ile sunucuyu başlat
2. **Terminal 2:** `npm run dev:android` veya `CALISTIR-ANDROID.bat`
3. İlk kez: `npx cap add android` (Android platformu ekle)

**Fiziksel cihaz** için:
```bash
set CAPACITOR_SERVER_URL=http://BILGISAYAR_IP:3000
npm run dev:android
```

### Production deploy

Deploy tamamlandıktan sonra `capacitor.config.ts` içinde `server` URL'ini güncelleyin:

```ts
server: { 
  url: 'https://your-app.vercel.app', 
  cleartext: true 
}
```
