"""
NABZ-AI API istemcisi — Harici script / bot entegrasyonu.
API_URL ve API_KEY .env / .env.local veya ortam değişkenlerinden okunur.
Kullanım: scripts/ klasöründeyken python nabz_api_client.py
"""
import os

# Proje kökündeki .env / .env.local dosyasını yükle (varsa)
try:
    from dotenv import load_dotenv
    load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env.local"))
    load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))
except ImportError:
    pass

import requests

# Ortam değişkenlerinden oku (.env kullanıyorsanız python-dotenv ile yükleyin)
API_URL = os.environ.get("NABZ_API_URL", "https://api.nabz-ai.com/v1/process")
API_KEY = os.environ.get("NABZ_API_KEY", "")


def nabz_baglan(data: dict | None = None, timeout: int = 15) -> dict | str:
    """NABZ-AI API'ye POST isteği gönderir. Hata durumunda okunabilir mesaj döner."""
    if not API_KEY:
        return "❌ NABZ_API_KEY tanımlı değil. .env veya ortam değişkenine ekleyin."
    payload = dict(data) if isinstance(data, dict) else {}
    if not payload:
        return "❌ Gönderilecek veri boş veya geçersiz (dict olmalı)."

    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json",
    }

    try:
        response = requests.post(API_URL, json=payload, headers=headers, timeout=timeout)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.ConnectionError:
        return "❌ Sunucuya ulaşılamıyor. İnternetini veya API adresini kontrol et!"
    except requests.exceptions.Timeout:
        return "⏳ İstek zaman aşımına uğradı. Sunucu geç cevap veriyor."
    except requests.exceptions.HTTPError as e:
        return f"⚠️ HTTP hatası ({e.response.status_code}): {e.response.text[:200]}"
    except Exception as e:
        return f"⚠️ Beklenmedik hata: {e}"


if __name__ == "__main__":
    test_verisi = {"query": "BTC trend analizi yap"}
    sonuc = nabz_baglan(test_verisi)
    print(sonuc)
