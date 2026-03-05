# Binance TR Coin Bot

Binance TR ile çalışan, bileşik getirili (compound), işçi tabanlı al-sat botu.

## Özellikler

- **Başlangıç sermayesi:** 200 USD (config’den değiştirilebilir)
- **Para ekleme/çekme:** İstediğin zaman `para_ekle` / `para_cek` komutları
- **İşçi kuralı:** Her 50 USD’ye 1 işçi; her 50 USD kâra +1 işçi (bileşik)
- **Binance TR tüm coinler:** TRY/USDT çiftleriyle al-sat (sembol listesi API’den)
- **Trailing stop:** Fiyat yukarı giderken stop yukarı çekilir
- **24.000 işlem/gün:** Rate limit’e uygun aralıkta order (günde 24k sınırı içinde)
- **Zincir stop:** Binance erişim sorunu veya ardışık hatalarda işlemler durur
- **Komutlar:** Al, Dur, Bakiye, para_ekle, para_cek, zincir_kapat

## Kurulum

1. Python 3.8+ yüklü olsun.
2. Bağımlılıkları yükleyin:
   ```bash
   cd binance_tr_bot
   pip install -r requirements.txt
   ```
3. Binance TR’den API anahtarı oluşturun (İşlem → API Yönetimi). İp kısıtı kullanmanız önerilir.
4. `.env` dosyası oluşturun (`.env.example` kopyalayıp doldurun):
   ```
   BINANCE_TR_API_KEY=...
   BINANCE_TR_API_SECRET=...
   ```
   Windows’ta ortam değişkeni de verebilirsiniz; script `os.getenv` ile okur.

## Çalıştırma

```bash
python main.py
```

Konsolda komutlar:

| Komut | Açıklama |
|-------|----------|
| `al` | Tüm işçiler alıma geçer |
| `dur` | İşlemleri durdurur; para yatır/çek yapabilirsin |
| `bakiye` | Güncel sermaye, kâr/zarar, işçi sayısı |
| `para_ekle 500` | 500 birim (TRY/USD) sermayeye ekler |
| `para_cek 200` | 200 birim çeker |
| `zincir_kapat` | Acil durum stop’u kapatır (sonra tekrar `al` gerekir) |

## Yapılandırma

`config.py` içinden:

- `INITIAL_CAPITAL_USD`: Başlangıç sermayesi
- `USD_PER_WORKER`: Kaç USD’de 1 işçi (varsayılan 50)
- `PROFIT_PER_NEW_WORKER`: Kaç USD kârda ek 1 işçi (varsayılan 50)
- `ORDERS_PER_DAY`: Günlük hedef işlem (varsayılan 24.000)
- `TRAILING_STOP_PERCENT` / `TRAILING_ACTIVATION_PERCENT`: İz süren stop yüzdesi

## Veriler

- **State:** `data/state.json` (sermaye, kâr, işçi, mod, pozisyonlar)
- **Log:** `logs/bot.log`
- **Rapor:** `logs/rapor.txt` (hatanlar ve periyodik özet)

## Uyarılar

- Gerçek parayla kullanmadan önce test ağı / küçük bakiye ile deneyin.
- API anahtarını kimseyle paylaşmayın; mümkünse IP kısıtlı kullanın.
- Bot “yarı otonom” raporlama yapar; kritik kararlar için mutlaka kendi kontrolünüzü yapın.
