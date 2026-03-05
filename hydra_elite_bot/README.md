# HydraElite Bot

Telegram ile kontrol edilen, Binance Spot al-sat botu. Tüm hatalar giderildi, eksikler tamamlandı.

## Özellikler

- **Madde 1:** Sadece `USER_UID` (Telegram user id) komut verebilir.
- **Madde 2:** API anahtarları ve token .env'den okunur.
- **Madde 3:** `al` — Motor başlar, işçiler alımda.
- **Madde 4:** `sat` — Tüm pozisyonlar piyasa fiyatından satılır, motor durur.
- **Madde 6:** 24.000 işlem/gün rate limit (order'lar arası ~3.6 sn).
- **Madde 26-27:** BNB yakıt uyarısı (düşükse Telegram bildirimi).
- **Madde 29:** Her 50 USD = 1 işçi; her 50 USD kâra +1 işçi.
- **Madde 31-32:** %1 kâr hedefi, %0.15 esneme, trailing stop.
- **Madde 35:** Tüm önemli olaylar Telegram'a raporlanır.
- Motor **ayrı thread**'te çalışır; `sat` / `dur` anında işlenir.
- **Zincir stop:** Ardışık API hatalarında işlemler durur; `zincir_kapat` ile kapatılır.
- **Komutlar:** `al` | `sat` | `dur` | `bakiye` | `para_ekle <miktar>` | `para_cek <miktar>` | `zincir_kapat`

## Kurulum

```bash
cd hydra_elite_bot
pip install -r requirements.txt
cp .env.example .env
# .env içine BINANCE_API_KEY, BINANCE_API_SECRET, TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, USER_UID yazın
python main.py
```

## .env Açıklama

| Değişken | Açıklama |
|----------|----------|
| BINANCE_API_KEY | Binance API key (Spot ticaret izni) |
| BINANCE_API_SECRET | Binance API secret |
| TELEGRAM_BOT_TOKEN | @BotFather'dan aldığınız token |
| TELEGRAM_CHAT_ID | Raporların gideceği chat id (sayı) |
| USER_UID | Komut verebilecek Telegram user id (güvenlik) |

Telegram user id öğrenmek: @userinfobot ile sohbet edin, size id'nizi yazar.

## Uyarı

Gerçek parayla kullanmadan önce test net veya küçük bakiye ile deneyin. API anahtarını paylaşmayın.
