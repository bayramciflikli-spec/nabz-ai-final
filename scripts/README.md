# NABZ-AI – Python scriptleri (kalıcı)

Bu klasör NABZ-AI API ile doğrudan veya yerel Flask sunucusu üzerinden konuşan Python araçlarını içerir.

## Gereksinimler

```bash
pip install -r scripts/requirements.txt
```

## Ortam değişkenleri

Proje kökündeki `.env.local` veya `.env` dosyasında:

| Değişken | Zorunlu | Açıklama |
|----------|---------|----------|
| `NABZ_API_KEY` | Evet (API/Flask için) | NABZ-AI API anahtarı |
| `NABZ_API_URL` | Hayır | Varsayılan: `https://api.nabz-ai.com/v1/process` |
| `NABZ_LOCAL_HOST` | Hayır | Flask bind: `127.0.0.1` = sadece bu PC (varsayılan), `0.0.0.0` = ağdan erişim |
| `NABZ_LOCAL_PORT` | Hayır | Flask port (varsayılan: `5050` - Chrome uyumlu) |
| `NABZ_LOCAL_DEBUG` | Hayır | `1` = Flask debug açık, `0` = kapalı (güvenli) |

## 1. Doğrudan API istemcisi

Tek seferlik istek veya başka scriptlerden import:

```bash
python scripts/nabz_api_client.py
```

```python
from nabz_api_client import nabz_baglan  # scripts/ path'te olmalı

sonuc = nabz_baglan({"query": "BTC trend analizi yap"})
# sonuc: dict (başarı) veya str (hata mesajı)
```

## 2. Yerel Flask sunucusu (POST /islem → NABZ API)

Diğer uygulamaların tek noktadan NABZ'e istek atması için yerel HTTP sunucu.

**Başlatma**

- **Batch (önerilen):** Proje kökünde `NABZ-Flask.bat` çift tıkla.
- **Manuel:**
  ```bash
  python scripts/nabz_local_server.py
  ```

**Port 5050 dolu hatası**

- Proje kökünde `5050-kapat.bat` çalıştır; ardından sunucuyu tekrar başlat.

**Endpoint'ler**

| Method | URL | Açıklama |
|--------|-----|----------|
| POST | http://127.0.0.1:5050/islem | Gövde NABZ API'ye iletilir (JSON obje). |
| POST | http://127.0.0.1:5050/nabz-core | X-API-KEY zorunlu, 5/dk limit, veri temizliği. |
| POST | http://127.0.0.1:5050/master-run | X-License-Key (NABZ_LICENSE_KEY) ile MASTER-LOCK; güvenli modül çalıştırma. |
| GET | http://127.0.0.1:5050/health | Sağlık kontrolü. |

**Güvenlik:** Varsayılan hız sınırı 200/gün, 50/saat. `/nabz-core`: `X-API-KEY`. `/master-run`: `X-License-Key` = `.env` içindeki `NABZ_LICENSE_KEY` (SHA256 ile doğrulanır; anahtar kodda yok, sadece kaptanın ortamında tanımlı olur). Hatalar ve yetkisiz erişim `nabz_secure.log` dosyasına yazılır.

**Örnek istek**

```bash
curl -X POST http://127.0.0.1:5050/islem -H "Content-Type: application/json" -d "{\"query\": \"BTC trend analizi yap\"}"
```

## Dosya listesi

- `nabz_api_client.py` – API istemcisi (nabz_baglan).
- `nabz_engine.py` – Motor: gizli anahtar, hata günlüğü, güvenli işlem (çökmez; hatalar `nabz_hata.log`).
- `nabz_master_lock.py` – MASTER-LOCK: lisans anahtarı (NABZ_LICENSE_KEY) SHA256 ile doğrulanır; anahtar kodda yok.
- `nabz_master_hub.py` – **Kaptan merkezi** (mühendise verilmez): `request_action("VERIFY_SUBSCRIPTION", username)` vb. gizli mantık.
- `ui_module_template.py` – **Mühendise verilen şablon**: sadece `UIModule(master_hub)` ve `hub.request_action(...)` kullanılır.
- `nabz_local_server.py` – Flask sunucu; `/islem`, `/nabz-core`, `/master-run`.
- `requirements.txt` – requests, python-dotenv, flask.
- `README.md` – Bu dosya.

Hata ayıklama: Proje kökünde `nabz_hata.log` oluşur (`.gitignore` ile commitlenmez).

Proje kökündeki batch'ler: `NABZ-Flask.bat` (Flask başlat), `5050-kapat.bat` (port 5050'i kapat).
