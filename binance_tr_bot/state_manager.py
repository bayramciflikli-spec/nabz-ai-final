# -*- coding: utf-8 -*-
"""
Sermaye, kâr/zarar, işçi sayısı ve pozisyonları saklar/günceller.
"""
import json
import logging
from pathlib import Path
from typing import Any

import config

logger = logging.getLogger(__name__)


def _ensure_data_dir():
    config.STATE_FILE.parent.mkdir(parents=True, exist_ok=True)


def load_state() -> dict:
    _ensure_data_dir()
    if not config.STATE_FILE.exists():
        return get_initial_state()
    try:
        with open(config.STATE_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        logger.warning("State okunamadı, varsayılan kullanılıyor: %s", e)
        return get_initial_state()


def get_initial_state() -> dict:
    return {
        "capital_usd": config.INITIAL_CAPITAL_USD,
        "total_deposited": config.INITIAL_CAPITAL_USD,
        "total_withdrawn": 0.0,
        "realized_profit_usd": 0.0,
        "unrealized_profit_usd": 0.0,
        "workers": _calc_workers(config.INITIAL_CAPITAL_USD, 0.0),
        "mode": "dur",  # dur | al
        "circuit_breaker_active": False,
        "positions": [],  # { "symbol", "side", "entry_price", "qty", "trailing_stop_price", "highest_price" }
        "order_count_today": 0,
        "last_order_time": None,
        "last_reset_date": None,
        "trailing_stops": {},  # symbol -> { "activation_price", "current_stop" }
    }


def _calc_workers(capital: float, realized_profit: float) -> int:
    """Sermaye (yatırılan-net) + gerçekleşen kârdan işçi sayısı (her 50 USD = 1 işçi)."""
    total = capital + realized_profit
    return max(1, int(total / config.USD_PER_WORKER))


def save_state(state: dict) -> None:
    _ensure_data_dir()
    with open(config.STATE_FILE, "w", encoding="utf-8") as f:
        json.dump(state, f, ensure_ascii=False, indent=2)


def add_deposit(state: dict, amount: float) -> None:
    state["capital_usd"] = state.get("capital_usd", 0) + amount
    state["total_deposited"] = state.get("total_deposited", 0) + amount
    state["workers"] = _calc_workers(state["capital_usd"], state.get("realized_profit_usd", 0))
    save_state(state)


def add_withdrawal(state: dict, amount: float) -> None:
    state["capital_usd"] = state.get("capital_usd", 0) - amount
    state["total_withdrawn"] = state.get("total_withdrawn", 0) + amount
    state["workers"] = _calc_workers(state["capital_usd"], state.get("realized_profit_usd", 0))
    save_state(state)


def update_profit_and_workers(state: dict, new_realized_profit: float) -> None:
    state["realized_profit_usd"] = new_realized_profit
    state["workers"] = _calc_workers(state["capital_usd"], new_realized_profit)
    save_state(state)


def get_equity(state: dict) -> float:
    """Sermaye + gerçekleşen kâr + gerçekleşmemiş kâr."""
    return (
        state.get("capital_usd", 0)
        + state.get("realized_profit_usd", 0)
        + state.get("unrealized_profit_usd", 0)
    )


def get_pnl_summary(state: dict) -> dict:
    """Bakiye komutu için: güncel kar/zarar özeti."""
    return {
        "sermaye": state.get("capital_usd", 0),
        "gerceklesen_kar": state.get("realized_profit_usd", 0),
        "gerceklesmemis_kar": state.get("unrealized_profit_usd", 0),
        "toplam_equity": get_equity(state),
        "isci_sayisi": state.get("workers", 0),
        "mod": state.get("mode", "dur"),
    }
