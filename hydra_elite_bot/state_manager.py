# -*- coding: utf-8 -*-
"""Sermaye, kâr, işçi sayısı, mod ve zincir stop state yönetimi."""
import json
import logging
import threading
from pathlib import Path
from typing import Any, Dict

import config

logger = logging.getLogger(__name__)
_state_lock = threading.RLock()


def _ensure_dir():
    config.DATA_DIR.mkdir(parents=True, exist_ok=True)


def load_state() -> Dict[str, Any]:
    with _state_lock:
        _ensure_dir()
        if not config.STATE_FILE.exists():
            return _initial_state()
        try:
            with open(config.STATE_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            logger.warning("State dosyası okunamadı, başlangıç state kullanılıyor: %s", e)
            return _initial_state()


def _initial_state() -> Dict[str, Any]:
    workers = max(1, int(config.INITIAL_BUDGET / config.USD_PER_WORKER))
    return {
        "budget": config.INITIAL_BUDGET,
        "total_deposited": config.INITIAL_BUDGET,
        "total_withdrawn": 0.0,
        "realized_profit": 0.0,
        "workers": workers,
        "mode": "dur",  # dur | al
        "circuit_breaker": False,
        "positions": [],  # { symbol, side, entry_price, qty, highest_price }
        "order_count_today": 0,
        "last_reset_date": None,
        "consecutive_errors": 0,
    }


def save_state(state: Dict[str, Any]) -> None:
    with _state_lock:
        _ensure_dir()
        with open(config.STATE_FILE, "w", encoding="utf-8") as f:
            json.dump(state, f, ensure_ascii=False, indent=2)


def _calc_workers(budget: float, realized_profit: float) -> int:
    total = budget + realized_profit
    return max(1, int(total / config.USD_PER_WORKER))


def set_mode(state: Dict[str, Any], mode: str) -> None:
    state["mode"] = mode
    save_state(state)


def add_deposit(state: Dict[str, Any], amount: float) -> None:
    state["budget"] = state.get("budget", 0) + amount
    state["total_deposited"] = state.get("total_deposited", 0) + amount
    state["workers"] = _calc_workers(state["budget"], state.get("realized_profit", 0))
    save_state(state)


def add_withdrawal(state: Dict[str, Any], amount: float) -> None:
    state["budget"] = state.get("budget", 0) - amount
    state["total_withdrawn"] = state.get("total_withdrawn", 0) + amount
    state["workers"] = _calc_workers(state["budget"], state.get("realized_profit", 0))
    save_state(state)


def update_profit(state: Dict[str, Any], new_realized: float) -> None:
    state["realized_profit"] = new_realized
    state["workers"] = _calc_workers(state.get("budget", 0), new_realized)
    save_state(state)


def reset_daily_count_if_new_day(state: Dict[str, Any]) -> None:
    from datetime import datetime, timezone
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    if state.get("last_reset_date") != today:
        state["order_count_today"] = 0
        state["last_reset_date"] = today
        save_state(state)


def get_equity(state: Dict[str, Any]) -> float:
    return state.get("budget", 0) + state.get("realized_profit", 0)


# --- Pozisyon takibi (sembol başına tek kayıt: ortalama giriş, toplam miktar, en yüksek fiyat) ---

def get_positions(state: Dict[str, Any]) -> list:
    return state.get("positions", [])


def _position_by_symbol(positions: list, symbol: str) -> dict:
    for p in positions:
        if p.get("symbol") == symbol:
            return p
    return None


def add_or_merge_position(state: Dict[str, Any], symbol: str, entry_price: float, qty: float, current_price: float) -> None:
    """Alım sonrası pozisyon ekler veya aynı sembole ek alımı birleştirir (ortalama giriş)."""
    positions = state.get("positions", [])
    existing = _position_by_symbol(positions, symbol)
    if existing:
        old_entry = float(existing["entry_price"])
        old_qty = float(existing["qty"])
        new_entry = (old_entry * old_qty + entry_price * qty) / (old_qty + qty)
        existing["entry_price"] = new_entry
        existing["qty"] = old_qty + qty
        existing["highest_price"] = max(float(existing.get("highest_price", 0)), current_price)
    else:
        positions.append({
            "symbol": symbol,
            "side": "BUY",
            "entry_price": entry_price,
            "qty": qty,
            "highest_price": current_price,
        })
    state["positions"] = positions
    save_state(state)


def update_position_highest(state: Dict[str, Any], symbol: str, current_price: float) -> None:
    """Trailing için en yüksek fiyatı günceller."""
    positions = state.get("positions", [])
    for p in positions:
        if p.get("symbol") == symbol:
            p["highest_price"] = max(float(p.get("highest_price", 0)), current_price)
            break
    state["positions"] = positions
    save_state(state)


def remove_position(state: Dict[str, Any], symbol: str) -> None:
    """Pozisyon kapatıldığında listeden çıkarır."""
    state["positions"] = [p for p in state.get("positions", []) if p.get("symbol") != symbol]
    save_state(state)


def clear_all_positions(state: Dict[str, Any]) -> None:
    """Sat komutu sonrası tüm pozisyon kayıtlarını temizler."""
    state["positions"] = []
    save_state(state)
