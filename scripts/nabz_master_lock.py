"""
MASTER-LOCK güvenlik katmanı — Lisans anahtarı doğrulanmadan hassas modül çalışmaz.
Gizli anahtar .env / .env.local içinde (NABZ_LICENSE_KEY); kodda asla yazılmaz.
Sadece kaptanın ortamında NABZ_LICENSE_KEY tanımlı olur; mühendislere verilmez.
"""
import os
import hashlib

# Proje kökünden .env yükle (tek başına çalıştırılırsa)
_script_dir = os.path.dirname(os.path.abspath(__file__))
_root = os.path.dirname(_script_dir)
try:
    from dotenv import load_dotenv
    load_dotenv(os.path.join(_root, ".env.local"))
    load_dotenv(os.path.join(_root, ".env"))
except ImportError:
    pass


class MasterLockCore:
    """Lisans anahtarını SHA256 ile doğrular; sadece doğru anahtarla modül çalıştırılır."""

    def __init__(self, license_key: str | None = None):
        # Anahtar sadece ortam değişkeninden; kodda sabit yok
        raw = license_key or os.getenv("NABZ_LICENSE_KEY", "")
        self.__license_key = raw.strip()
        self.__authorized_hash = hashlib.sha256(self.__license_key.encode()).hexdigest() if self.__license_key else ""

    def check_lock(self, input_key: str) -> bool:
        """Verdiğin anahtar, kayıtlı lisans anahtarı ile eşleşiyor mu?"""
        if not input_key or not self.__authorized_hash:
            return False
        return hashlib.sha256(input_key.strip().encode()).hexdigest() == self.__authorized_hash

    def run_secure_module(self, module_func, key: str):
        """Anahtar doğruysa modülü çalıştırır; değilse PermissionError."""
        if self.check_lock(key):
            return module_func()
        raise PermissionError("Yetkisiz Erişim! UID Kancası Bulunamadı.")


# --- Mühendisin üzerinde çalıştığı parça (içeriği sen belirlersin) ---
def engineer_ui_design():
    return "Nabz-AI Arayüzü Başarıyla Yüklendi."


if __name__ == "__main__":
    core = MasterLockCore()
    # Anahtar sadece .env.local'de: NABZ_LICENSE_KEY=KAPTAN-NABZ-2026-X (mühendislere verme)
    key = os.getenv("NABZ_LICENSE_KEY", "")
    try:
        result = core.run_secure_module(engineer_ui_design, key)
        print("Mühür doğrulandı. İşlem başlatılıyor...")
        print(result)
    except PermissionError as e:
        print(e)
