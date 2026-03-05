# -*- coding: utf-8 -*-
"""
İşçilere göre işlem dağıtımı, 24k/gün rate limit, market al/sat.
"""
import logging
import random
import time
from datetime import datetime, timezone
from typing import List, Optional

import config
from api_client import BinanceTRClient
from state_manager import load_state, save_state, update_profit_and_workers
from trailing_stop import update_trailing_stop

logger = logging.getLogger(__name__)


def _round_qty(qty: float, step_size: float) -> str:
    if step_size <= 0:
        return f"{qty:.8f}"
    precision = len(str(step_size).rstrip("0").split(".")[-1]) if "." in str(step_size) else 0
    n = round(qty / step_size) * step_size
    return f"{n:.8f}".rstrip("0").rstrip(".")


def _get_symbol_filters(symbol_info: dict):
    filters = symbol_info.get("filters", [])
    lot = next((f for f in filters if f.get("filterType") == "LOT_SIZE"), {})
    notional = next((f for f in filters if f.get("filterType") == "NOTIONAL"), {})
    step = float(lot.get("stepSize", 0.001))
    min_qty = float(lot.get("minQty", 0))
    min_notional = float(notional.get("minNotional", 0))
    return step, min_qty, min_notional


class Executor:
    def __init__(self, client: BinanceTRClient, symbols: List[dict]):
        self.client = client
        self.symbols = symbols
        self._last_order_ts = 0.0
        self._interval = config.MIN_INTERVAL_BETWEEN_ORDERS

    def _wait_next_slot(self):
        now = time.time()
        wait = self._interval - (now - self._last_order_ts)
        if wait > 0:
            time.sleep(wait)
        self._last_order_ts = time.time()

    def _reset_daily_count_if_new_day(self, state: dict):
        today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        if state.get("last_reset_date") != today:
            state["order_count_today"] = 0
            state["last_reset_date"] = today
            save_state(state)

    def place_market_buy(self, symbol: str, quote_amount: float, symbol_info: dict) -> bool:
        """Market al (quoteOrderQty ile TRY/USDT harcayarak)."""
        step, min_qty, min_notional = _get_symbol_filters(symbol_info)
        if quote_amount < min_notional:
            return False
        state = load_state()
        if state.get("mode") != "al" or state.get("circuit_breaker_active"):
            return False
        self._reset_daily_count_if_new_day(state)
        if state.get("order_count_today", 0) >= config.ORDERS_PER_DAY:
            return False
        self._wait_next_slot()
        try:
            self.client.place_order(
                symbol=symbol,
                side=0,
                order_type=2,
                quote_order_qty=str(round(quote_amount, 2)),
            )
            state["order_count_today"] = state.get("order_count_today", 0) + 1
            state["last_order_time"] = time.time()
            save_state(state)
            return True
        except Exception as e:
            logger.exception("Order hatası %s: %s", symbol, e)
            return False

    def place_market_sell(self, symbol: str, quantity: float, symbol_info: dict) -> bool:
        """Market sat (miktar ile)."""
        step, min_qty, min_notional = _get_symbol_filters(symbol_info)
        qty_str = _round_qty(quantity, step)
        if quantity < min_qty:
            return False
        state = load_state()
        if state.get("circuit_breaker_active"):
            return False
        self._reset_daily_count_if_new_day(state)
        if state.get("order_count_today", 0) >= config.ORDERS_PER_DAY:
            return False
        self._wait_next_slot()
        try:
            self.client.place_order(
                symbol=symbol,
                side=1,
                order_type=2,
                quantity=qty_str,
            )
            state["order_count_today"] = state.get("order_count_today", 0) + 1
            state["last_order_time"] = time.time()
            save_state(state)
            return True
        except Exception as e:
            logger.exception("Sell hatası %s: %s", symbol, e)
            return False

    def run_cycle(self) -> int:
        """
        Tek döngü: tüm işçiler için semboller üzerinde dağıtılmış market al.
        Sadece mode=al iken alım yapar. Dönen değer: atılan order sayısı.
        """
        state = load_state()
        if state.get("mode") != "al":
            return 0
        if state.get("circuit_breaker_active"):
            return 0

        workers = state.get("workers", 1)
        capital = state.get("capital_usd", 0) + state.get("realized_profit_usd", 0)
        if not self.symbols or capital <= 0 or workers <= 0:
            return 0

        # İşçi başına düşen pay (TRY/USDT cinsinden; basitlik için USD ≈ TRY kabul)
        per_worker = capital / workers
        # Her döngüde birkaç sembole dağıt (rate limit’e uygun)
        orders_placed = 0
        shuffle = list(self.symbols)
        random.shuffle(shuffle)
        for sym_info in shuffle[: workers * 2]:  # En fazla workers*2 sembol
            if orders_placed >= workers:
                break
            symbol = sym_info["symbol"]
            quote_amount = per_worker / (workers * 2)  # Küçük parçalarla dene
            if quote_amount < 10:  # Min notional genelde 10 TRY civarı
                quote_amount = 10
            if self.place_market_buy(symbol, quote_amount, sym_info):
                orders_placed += 1
        return orders_placed

    def check_trailing_stops(self) -> List[tuple]:
        """
        Tüm pozisyonlar için trailing stop kontrolü.
        Tetiklenen (symbol, stop_price) listesi döner.
        """
        state = load_state()
        triggered = []
        positions = state.get("positions", [])
        trailing_stops = state.get("trailing_stops", {})

        for pos in positions:
            symbol = pos.get("symbol")
            if not symbol:
                continue
            price = self.client.get_ticker_price(symbol)
            if price is None:
                continue
            entry = float(pos.get("entry_price", 0))
            side = int(pos.get("side", 0))
            stop = update_trailing_stop(trailing_stops, symbol, price, entry, side)
            if stop is not None:
                triggered.append((symbol, stop, pos))
        state["trailing_stops"] = trailing_stops
        save_state(state)
        return triggered
