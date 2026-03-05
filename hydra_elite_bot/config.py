# -*- coding: utf-8 -*-
"""HydraElite yapılandırma - tüm değerler .env veya buradan."""
import os
from pathlib import Path

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

# --- Gizlilik (Madde 1-2): Kod dışından okunur
API_KEY = os.getenv("BINANCE_API_KEY", "")
API_SECRET = os.getenv("BINANCE_API_SECRET", "")
TG_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")
CHAT_ID = os.getenv("TELEGRAM_CHAT_ID", "")  # Raporların gideceği chat
USER_UID = os.getenv("USER_UID", "")  # Madde 1: Sadece bu UID komut verebilir

# --- Sermaye & İşçi (Madde 29)
INITIAL_BUDGET = 200.0
USD_PER_WORKER = 50.0
PROFIT_PER_WORKER = 50.0  # Her 50 USD kâra +1 işçi

# --- Kar / Trailing (Madde 31-32)
PROFIT_TARGET = 0.01       # %1 kâr hedefi (trailing aktivasyonu)
ANTI_SHAKE = 0.0015        # %0.15 esneme payı
TRAILING_STOP_PCT = 0.005  # Fiyat %0.5 düşünce sat (trailing)

# --- Rate limit (Madde 6: 24.000 işlem/gün)
ORDERS_PER_DAY = 24_000
SECONDS_PER_DAY = 24 * 3600
MIN_INTERVAL_ORDERS = SECONDS_PER_DAY / ORDERS_PER_DAY  # ~3.6 sn

# --- Acil durum
MAX_CONSECUTIVE_ERRORS = 5
BINANCE_PING_INTERVAL = 30
BNB_MIN_FREE = 0.005  # BNB bu altına düşerse uyarı (Madde 26-27)
BNB_WARNING_COOLDOWN_SEC = 3600  # Aynı BNB uyarısını en fazla 1 saatte bir gönder

# --- State
DATA_DIR = Path(__file__).resolve().parent / "data"
STATE_FILE = DATA_DIR / "state.json"
