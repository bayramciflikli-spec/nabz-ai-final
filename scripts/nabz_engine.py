"""
NABZ-AI Motoru — Gizli anahtar yükleme, hata günlüğü ve güvenli işlem.
Flask sunucusu bu motoru kullanır; çökmez, hataları nabz_hata.log'a yazar.
"""
import os
import sys
import logging

# Proje kökü ve path
_script_dir = os.path.dirname(os.path.abspath(__file__))
_root = os.path.dirname(_script_dir)
sys.path.insert(0, _script_dir)

# 1. Gizli anahtarları yükle (proje kökündeki .env / .env.local)
try:
    from dotenv import load_dotenv
    load_dotenv(os.path.join(_root, ".env.local"))
    load_dotenv(os.path.join(_root, ".env"))
except ImportError:
    pass

from nabz_api_client import nabz_baglan

NABZ_API_KEY = os.getenv("NABZ_API_KEY")

# 2. Hata günlüğü — uygulama neden hata verdiğini buraya yazar (proje kökünde)
_log_path = os.path.join(_root, "nabz_hata.log")
logging.basicConfig(
    filename=_log_path,
    level=logging.ERROR,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)


class NabzEngine:
    def __init__(self):
        self.is_active = True

    def guvenli_islem(self, input_data: dict) -> dict:
        """
        NABZ-AI işlemini güvenli yapar. Çökmez; hata olursa loga yazar ve
        kullanıcıya nazik cevap döner.
        """
        try:
            if not NABZ_API_KEY:
                raise ValueError("API Anahtarı bulunamadı! Lütfen .env dosyasını kontrol et.")

            if not isinstance(input_data, dict) or not input_data:
                return {"status": "error", "message": "Geçerli bir veri (JSON obje) gönderin."}

            sonuc = nabz_baglan(input_data)

            if isinstance(sonuc, str):
                # nabz_baglan hata mesajı döndü
                logging.error("NABZ API: %s", sonuc)
                return {"status": "error", "message": "Şu an sunucuya ulaşılamıyor, 10 sn sonra tekrar dene."}

            return {"status": "success", "result": sonuc}

        except Exception as e:
            logging.error("Hata oluştu: %s", str(e), exc_info=True)
            return {"status": "error", "message": "Şu an sunucuya ulaşılamıyor, 10 sn sonra tekrar dene."}


if __name__ == "__main__":
    engine = NabzEngine()
    print("🚀 Nabz-AI Motoru hazır. Flask ile dış dünyaya açmak için: python scripts/nabz_local_server.py")
    # Test
    r = engine.guvenli_islem({"query": "test"})
    print("Test sonucu:", r)
