# -*- coding: utf-8 -*-
"""
Bot yapılandırması.
"""
import os
from pathlib import Path

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

# --- Sermaye & İşçi ---
INITIAL_CAPITAL_USD = 200.0
USD_PER_WORKER = 50.0          # Her 50 USD'ye 1 işçi
PROFIT_PER_NEW_WORKER = 50.0   # Her 50 USD kâra +1 işçi

# --- Binance TR API ---
BASE_URL = os.getenv("BINANCE_TR_BASE_URL", "https://www.binance.tr")
API_BASE_ME = "https://api.binance.me"  # Bazı market endpoint'leri
API_KEY = os.getenv("BINANCE_TR_API_KEY", "")
API_SECRET = os.getenv("BINANCE_TR_API_SECRET", "")
RECV_WINDOW = 5000

# --- Rate limit (24.000 işlem / 24 saat) ---
ORDERS_PER_DAY = 24_000
SECONDS_PER_DAY = 24 * 3600
MIN_INTERVAL_BETWEEN_ORDERS = SECONDS_PER_DAY / ORDERS_PER_DAY  # ~3.6 saniye

# --- Trailing stop ---
TRAILING_STOP_PERCENT = 1.0    # Fiyat %1 düşünce stop tetiklenir (örnek)
TRAILING_ACTIVATION_PERCENT = 0.5  # %0.5 kârda trailing aktif

# --- Acil durum ---
BINANCE_STATUS_URL = "https://www.binance.tr/open/v1/common/time"
MAX_CONSECUTIVE_API_ERRORS = 5
CIRCUIT_BREAKER_COOLDOWN_SEC = 300  # 5 dk bekleme

# --- State & log ---
STATE_FILE = Path(__file__).resolve().parent / "data" / "state.json"
LOG_DIR = Path(__file__).resolve().parent / "logs"
REPORT_FILE = LOG_DIR / "rapor.txt"

# --- Sembol filtresi (TRY veya USDT çiftleri; Binance TR'de genelde TRY) ---
QUOTE_ASSETS = ("TRY", "USDT", "USDC")  # Hangi quote ile işlem (hepsini kullanabiliriz)
