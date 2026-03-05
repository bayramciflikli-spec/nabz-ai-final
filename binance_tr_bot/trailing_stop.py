# -*- coding: utf-8 -*-
"""
İz süren stop: fiyat yukarı gittikçe stop da yukarı çekilir.
"""
import logging
from typing import Dict, List, Optional

import config

logger = logging.getLogger(__name__)


def update_trailing_stop(
    trailing_stops: dict,
    symbol: str,
    current_price: float,
    entry_price: float,
    side: int,  # 0 BUY, 1 SELL
) -> Optional[float]:
    """
    Trailing stop fiyatını günceller.
    side=0 (BUY, long): fiyat yükselince stop yukarı çıkar; fiyat düşünce stop tetiklenir.
    side=1 (SELL, short): fiyat düşünce stop aşağı iner; fiyat yükselince tetiklenir.
    Tetiklenirse dönen değer stop fiyatıdır (satış yapılmalı).
    """
    key = symbol
    activation_pct = config.TRAILING_ACTIVATION_PERCENT / 100.0
    trail_pct = config.TRAILING_STOP_PERCENT / 100.0

    if side == 0:  # Long
        if key not in trailing_stops:
            # Kâr %activation_pct'ı geçince trailing aktif
            if current_price <= entry_price * (1 + activation_pct):
                return None
            trailing_stops[key] = {
                "highest": current_price,
                "stop": current_price * (1 - trail_pct),
            }
        else:
            ts = trailing_stops[key]
            if current_price > ts["highest"]:
                ts["highest"] = current_price
                ts["stop"] = current_price * (1 - trail_pct)
            if current_price <= ts["stop"]:
                return ts["stop"]
    else:  # Short (SELL pozisyon = fiyat düşünce kâr)
        if key not in trailing_stops:
            if current_price >= entry_price * (1 - activation_pct):
                return None
            trailing_stops[key] = {
                "lowest": current_price,
                "stop": current_price * (1 + trail_pct),
            }
        else:
            ts = trailing_stops[key]
            if current_price < ts["lowest"]:
                ts["lowest"] = current_price
                ts["stop"] = current_price * (1 + trail_pct)
            if current_price >= ts["stop"]:
                return ts["stop"]
    return None


def get_stop_price(trailing_stops: dict, symbol: str) -> Optional[float]:
    """Mevcut stop fiyatını döner."""
    t = trailing_stops.get(symbol)
    if not t:
        return None
    return t.get("stop") or t.get("current_stop")
