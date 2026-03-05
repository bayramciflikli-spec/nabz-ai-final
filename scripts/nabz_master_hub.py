"""
KAPTAN MERKEZİ — Mühendise verilmez. request_action() ile gelen istekler burada işlenir.
Gizli kurallar, abonelik kontrolü ve lisans burada.
"""
import os
import sys

_script_dir = os.path.dirname(os.path.abspath(__file__))
_root = os.path.dirname(_script_dir)
sys.path.insert(0, _script_dir)

try:
    from dotenv import load_dotenv
    load_dotenv(os.path.join(_root, ".env.local"))
    load_dotenv(os.path.join(_root, ".env"))
except ImportError:
    pass

from nabz_master_lock import MasterLockCore


class MasterHub:
    """
    Kaptanın ana merkezi. UIModule sadece request_action() ile seslenir.
    Tüm doğrulama ve gizli mantık burada.
    """

    def __init__(self, license_key: str | None = None):
        self._lock = MasterLockCore(license_key or os.getenv("NABZ_LICENSE_KEY", ""))
        # Yetkili kullanıcılar (env'den: NABZ_ALLOWED_USERS=Kaptan,Admin veya varsayılan)
        allowed = os.getenv("NABZ_ALLOWED_USERS", "Kaptan").strip()
        self._allowed_users = {u.strip() for u in allowed.split(",") if u.strip()}

    def request_action(self, action: str, *args):
        """
        Merkeze gelen istek. Mühendis sadece action ve argümanları gönderir;
        sonucu sadece burada belirlenir.
        """
        if action == "VERIFY_SUBSCRIPTION":
            return self._verify_subscription(args[0] if args else "")
        # İleride: "CHECK_QUOTA", "LOG_EVENT" vb.
        return "UNKNOWN_ACTION"

    def _verify_subscription(self, username: str) -> str:
        """Abonelik doğrulama — kaptanın kuralları (gizli)."""
        if not username or not username.strip():
            return "FAIL"
        if username.strip() in self._allowed_users:
            return "SUCCESS"
        return "FAIL"


def run_with_ui_module(license_key: str | None = None):
    """Lisans doğruysa hub + UIModule oluşturur ve örnek tıklamayı çalıştırır (kaptan kullanır)."""
    from ui_module_template import UIModule

    key = license_key or os.getenv("NABZ_LICENSE_KEY", "")
    lock = MasterLockCore()
    if not lock.check_lock(key):
        raise PermissionError("Yetkisiz Erişim! UID Kancası Bulunamadı.")

    hub = MasterHub()
    ui = UIModule(hub)
    ui.login_button_clicked()


if __name__ == "__main__":
    key = os.getenv("NABZ_LICENSE_KEY", "")
    try:
        run_with_ui_module(key)
    except PermissionError as e:
        print(e)
