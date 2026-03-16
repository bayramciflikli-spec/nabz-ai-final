# Yerel vs Production – Hangi Ortam, Ne Yapılır?

**Stabilizasyon (404 Static Chunks / 500 Manifest):** Tüm asset ve API yolları ana dizinden (`/`). Manifest route hata verirse bile geçerli JSON döner. Chunk 404 alırsanız `npm run dev:clean` ile başlatın.

## Hangi ortam nerede?

| Ortam        | Adres / Kullanım        | Ayar dosyası / Kaynak      |
|-------------|--------------------------|----------------------------|
| **Yerel**   | `localhost:3000`         | Proje kökünde **`.env.local`** |
| **Production** | **www.nabz-ai.com**  | **Vercel Dashboard** → Proje → Settings → Environment Variables |

- Yerelde giriş/API için **sadece `.env.local`** kullanılır; Vercel’deki değişkenler yereli etkilemez.
- Production’da **sadece Vercel’de tanımlı env** kullanılır; `.env.local` sadece sizin bilgisayarınızda, sunucuya gitmez.

---

## Yerel (localhost) – Sık yaşanan hatalar ve çözüm

### 1. Beyaz sayfa / "Kontrol Kulesi yükleniyor..." / Chunk-CSS 404

**Sebep:** `.next` veya webpack cache bozulmuş; tarayıcı eski chunk’lara istek atıyor.

**Kalıcı çözüm:** Her zaman **temiz cache ile** dev’i başlatın:

```bash
npm run dev:clean
```

Bu komut `.next` klasörünü siler ve ardından `next dev` çalıştırır. İlk açılış biraz uzun sürebilir.

- Sadece `npm run dev` kullanıyorsanız ve 404 / beyaz sayfa görürseniz: dev’i durdurun (Ctrl+C), sonra `npm run dev:clean` ile tekrar başlatın.
- İsterseniz elle: `.next` klasörünü silin, ardından `npm run dev`.

### 2. Firebase: "Giriş ayarlarında eksik..." / argument-error

**Sebep:** `.env.local` eksik, yanlış veya sunucu yeniden başlatılmadı.

**Yapılacaklar:**

1. Proje kökünde `.env.local` var mı kontrol edin; yoksa `.env.local.example`’ı kopyalayıp `.env.local` yapın.
2. İçinde en az şunlar olsun (kendi Firebase değerlerinizle):
   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
3. Değişiklikten sonra dev’i **mutlaka yeniden başlatın** (Ctrl+C → `npm run dev` veya `npm run dev:clean`).
4. Gerekirse `.next` silinip tekrar `npm run dev`.

---

## Production (www.nabz-ai.com)

- **Build:** Vercel her deploy’da sıfırdan `next build` alır; yereldeki `.next` veya cache kullanılmaz.
- **Env:** Tüm `NEXT_PUBLIC_*` ve diğer env’ler **Vercel → Proje → Settings → Environment Variables** üzerinden tanımlanmalı.
- **Chunk 404 / beyaz sayfa:** Genelde Vercel tarafında olmaz; olursa Vercel’de “Redeploy” (veya boş commit ile yeni deploy) yapın.
- **Giriş hatası (production’da):** Firebase Console’da “Authorized domains” listesine `www.nabz-ai.com` ve `nabz-ai.com` ekleyin; env’lerin Vercel’de doğru olduğundan emin olun.

---

## Kısa özet

- **Yerel:** `.env.local` + `npm run dev:clean` (sorun varsa) → localhost:3000.
- **Production:** Vercel env + Git deploy → www.nabz-ai.com; yerel `.next` veya `.env.local` kullanılmaz.

Bu sayfayı referans alarak “yerel mi, nabz-ai.com mu?” ve “hata çıkınca ne yapayım?” sorularını tek yerden çözebilirsiniz.
