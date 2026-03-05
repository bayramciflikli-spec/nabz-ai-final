"""
NABZ-AI yerel entegrasyon sunucusu (Flask).
/islem ve /nabz-core ile NABZ-AI API'ye istek; hız sınırı ve API anahtarı koruması.
Çalıştırma: python scripts/nabz_local_server.py
"""
import os
import sys
import logging
from functools import wraps

# scripts/ klasörünü path'e ekle (nabz_api_client importu için)
_script_dir = os.path.dirname(os.path.abspath(__file__))
_root = os.path.dirname(_script_dir)
sys.path.insert(0, _script_dir)

# .env / .env.local yükle
try:
    from dotenv import load_dotenv
    load_dotenv(os.path.join(_root, ".env.local"))
    load_dotenv(os.path.join(_root, ".env"))
except ImportError:
    pass

from flask import Flask, jsonify, request

from nabz_engine import NabzEngine
from nabz_master_lock import MasterLockCore, engineer_ui_design

_engine = NabzEngine()
_master_lock = MasterLockCore()

# --- 1. GÜVENLİK: Hata / erişim günlüğü (proje kökünde nabz_secure.log)
_secure_log = os.path.join(_root, "nabz_secure.log")
logging.basicConfig(level=logging.INFO, filename=_secure_log, format="%(asctime)s [%(levelname)s] %(message)s", datefmt="%Y-%m-%d %H:%M:%S")

# --- 2. LOCAL SUNUCU AYARLARI ---
# PORT ve DEBUG: .env'de PORT=5050, DEBUG=False veya DEBUG=True
# HOST: 0.0.0.0 = ağdan erişim; sadece bu PC için NABZ_LOCAL_HOST=127.0.0.1
app = Flask(__name__)

# Hız sınırı (bot / sızma önleme). MASTER_KEY: X-API-KEY ile yetkili erişim
try:
    from flask_limiter import Limiter
    from flask_limiter.util import get_remote_address
    limiter = Limiter(get_remote_address, app=app, default_limits=["200 per day", "50 per hour"], storage_uri="memory://")
except ImportError:
    limiter = None

def api_key_required(f):
    """Sadece X-API-KEY: MASTER_KEY veya NABZ_MASTER_KEY ile yetkili erişim."""
    @wraps(f)
    def decorated(*args, **kwargs):
        key = request.headers.get("X-API-KEY")
        master = os.getenv("MASTER_KEY") or os.getenv("NABZ_MASTER_KEY")
        if not master or key != master:
            logging.warning("Yetkisiz erişim denemesi: %s", getattr(request, "remote_addr", "?"))
            return jsonify({"error": "Yetkisiz Erişim! Sığınak kapıları kapalı."}), 403
        return f(*args, **kwargs)
    return decorated
HOST = os.environ.get("NABZ_LOCAL_HOST", "0.0.0.0")
port_raw = os.environ.get("PORT") or os.environ.get("NABZ_LOCAL_PORT", "5050")
try:
    PORT = int(port_raw)
except (TypeError, ValueError):
    PORT = 5050
_debug_env = os.environ.get("DEBUG", "").strip()
DEBUG = _debug_env == "True" or os.environ.get("NABZ_LOCAL_DEBUG", "").strip().lower() in ("1", "true", "yes")


# --- 3. HATA YÖNETİMİ ---
@app.errorhandler(429)
def ratelimit_handler(e):
    """Hız sınırı aşıldı."""
    return jsonify({"error": "Çok fazla istek. Lütfen daha sonra tekrar dene."}), 429

@app.errorhandler(Exception)
def handle_exception(e):
    """Herhangi bir hata olduğunda sunucunun çökmesini engeller."""
    logging.error("Kritik hata: %s", str(e), exc_info=True)
    body = {"error": "Sistemde bir aksama oldu"}
    if DEBUG:
        body["detay"] = str(e)
    return jsonify(body), 500


def _sanitize_text(s: str) -> str:
    """Veri temizliği: sadece alfanumerik ve . - _ boşluk."""
    if not isinstance(s, str):
        return ""
    return "".join(c for c in s if c.isalnum() or c in " .-_")


# --- 4. NABZ-AI ENTEGRASYON NOKTASI ---
@app.route("/islem", methods=["POST"])
def islem_yap():
    try:
        data = request.get_json(silent=True)
        if not isinstance(data, dict):
            return jsonify({"durum": "Hata", "mesaj": "JSON gövdesi obje olmalı (örn: {\"query\": \"...\"})"}), 400
        sonuc = _engine.guvenli_islem(data)
        if sonuc.get("status") == "error":
            return jsonify({"durum": "Hata", "mesaj": sonuc.get("message", "Sunucuya ulaşılamıyor.")}), 400
        return jsonify({"durum": "Başarılı", "veri": sonuc.get("result", sonuc)}), 200
    except Exception as e:
        return jsonify({"durum": "Hata", "mesaj": str(e)}), 400


@app.route("/")
def index():
    """Kök URL — tarayıcıdan açanlara bilgi."""
    return jsonify({
        "servis": "nabz-local",
        "endpoint": "POST /islem",
        "nabz_core": "POST /nabz-core (X-API-KEY, 5/dk)",
        "master_run": "POST /master-run (X-License-Key, MASTER-LOCK)",
        "health": "GET /health",
    })


@app.route("/health", methods=["GET"])
def health():
    """Sağlık kontrolü — yük dengeleyici veya scriptler için."""
    return jsonify({"durum": "ok", "servis": "nabz-local"})


# --- 5. GÜVENLİK KATMANLI: /nabz-core (X-API-KEY + hız sınırı + veri temizliği) ---
def _limit_5_per_minute():
    return limiter.limit("5 per minute") if limiter else lambda f: f

@app.route("/nabz-core", methods=["POST"])
@_limit_5_per_minute()
@api_key_required
def nabz_core():
    try:
        data = request.get_json(silent=True) or {}
        # Veri temizliği: string alanları sanitize et
        clean_data = {}
        for k, v in data.items():
            if isinstance(v, str):
                clean_data[k] = _sanitize_text(v)
            elif isinstance(v, dict):
                clean_data[k] = {kk: _sanitize_text(vv) if isinstance(vv, str) else vv for kk, vv in v.items()}
            else:
                clean_data[k] = v
        if not clean_data:
            return jsonify({"status": "fail", "message": "Geçerli veri gönderin."}), 400
        sonuc = _engine.guvenli_islem(clean_data)
        if sonuc.get("status") == "error":
            return jsonify({"status": "fail", "message": sonuc.get("message", "Sistem koruma modunda.")}), 500
        return jsonify({"status": "success", "data": sonuc.get("result", sonuc)}), 200
    except Exception as e:
        logging.error("Kritik Hata: %s", str(e))
        return jsonify({"status": "fail", "message": "Sistem koruma modunda."}), 500


# --- 6. MASTER-LOCK: X-License-Key ile güvenli modül çalıştırma ---
@app.route("/master-run", methods=["POST"])
def master_run():
    """X-License-Key header = NABZ_LICENSE_KEY (SHA256 doğrulanır). Sadece kaptanın anahtarı geçer."""
    key = (request.headers.get("X-License-Key") or "").strip()
    if not key:
        return jsonify({"error": "X-License-Key header gerekli."}), 401
    try:
        result = _master_lock.run_secure_module(engineer_ui_design, key)
        return jsonify({"status": "success", "message": result}), 200
    except PermissionError:
        logging.warning("Master-Lock: yetkisiz lisans denemesi")
        return jsonify({"error": "Yetkisiz Erişim! UID Kancası Bulunamadı."}), 403


# --- 7. ÇALIŞTIRICI ---
def sunucuyu_atesle():
    local_url = f"http://127.0.0.1:{PORT}" if HOST == "0.0.0.0" else f"http://{HOST}:{PORT}"
    print(f"""
    🚀 KAPTAN, SİSTEM HAZIR!
    ---------------------------
    Adres:       {local_url}
    Endpoint:    POST {local_url}/islem
    {f"Ağ:          http://<bu-makine-ip>:{PORT} (0.0.0.0 dinlemede)" if HOST == "0.0.0.0" else ""}
    Durum:       Aktif ve dinlemede (Port 5050 - Chrome uyumlu)
    ---------------------------
    """)
    try:
        # threaded=True: aynı anda birden fazla istek işlenir
        app.run(host=HOST, port=PORT, debug=DEBUG, use_reloader=False, threaded=True)
    except OSError as e:
        if "WinError 10048" in str(e) or "address already in use" in str(e).lower():
            print(f"❌ PORT DOLU: {PORT} nolu limanda başka bir gemi var!")
            print(f"💡 Çözüm: 5050-kapat.bat çalıştır veya: netstat -ano | findstr :{PORT} ile PID bulup taskkill /F /PID <PID>")
        else:
            print(f"❌ {e}")


if __name__ == "__main__":
    sunucuyu_atesle()
