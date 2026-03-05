# -*- coding: utf-8 -*-
"""
Acil durum: Binance erişim hatası veya çökme durumunda zincir stop (circuit breaker).
"""
import logging
import time

import requests

import config
from state_manager import load_state, save_state

logger = logging.getLogger(__name__)


def check_binance_ok() -> bool:
    """Binance TR sunucusunun yanıt verip vermediğini kontrol eder."""
    try:
        r = requests.get(config.BINANCE_STATUS_URL, timeout=10)
        if r.status_code != 200:
            return False
        d = r.json()
        return d.get("code") == 0
    except Exception as e:
        logger.warning("Binance durum kontrolü başarısız: %s", e)
        return False


def activate_circuit_breaker(state: dict = None) -> None:
    """Tüm işlemleri durdurur, mode=dur yapar."""
    if state is None:
        state = load_state()
    state["circuit_breaker_active"] = True
    state["mode"] = "dur"
    save_state(state)
    logger.warning("Zincir stop (circuit breaker) AKTİF. İşlemler durduruldu.")


def deactivate_circuit_breaker(state: dict = None) -> None:
    """Circuit breaker'ı kapatır (manuel onay sonrası)."""
    if state is None:
        state = load_state()
    state["circuit_breaker_active"] = False
    save_state(state)
    logger.info("Zincir stop kapatıldı.")


def monitor_and_trip(errors_count: int) -> bool:
    """
    Ardışık API hata sayısı limiti aşıldıysa circuit breaker tetiklenir.
    Returns: True eğer circuit breaker tetiklendiyse.
    """
    if errors_count >= config.MAX_CONSECUTIVE_API_ERRORS:
        activate_circuit_breaker()
        return True
    return False


def should_stop_trading() -> bool:
    """Circuit breaker aktif mi veya Binance yanıt vermiyor mu kontrolü."""
    state = load_state()
    if state.get("circuit_breaker_active"):
        return True
    if not check_binance_ok():
        return True
    return False
