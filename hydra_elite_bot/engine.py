# -*- coding: utf-8 -*-
"""Motor döngüsü: piyasa taraması, işçi ataması, trailing stop, BNB kontrolü."""
import logging
import time
from typing import Callable, List, Optional

import config
from binance_client import BinanceWrapper
from state_manager import (
    load_state,
    save_state,
    set_mode,
    update_profit,
    reset_daily_count_if_new_day,
    get_positions,
    add_or_merge_position,
    update_position_highest,
    remove_position,
    clear_all_positions,
)

logger = logging.getLogger(__name__)


class HydraEngine:
    def __init__(self, binance: BinanceWrapper, on_report: Callable[[str], None]):
        self.binance = binance
        self.on_report = on_report
        self._is_active = False
        self._consecutive_errors = 0
        self._last_bnb_warning_time = 0.0

    @property
    def is_active(self) -> bool:
        return self._is_active

    def start(self) -> None:
        state = load_state()
        if state.get("circuit_breaker"):
            self.on_report("⚠️ Zincir stop aktif. Önce 'zincir_kapat' yazın.")
            return
        self._is_active = True
        workers = state.get("workers", 1)
        self.on_report(f"🐲 Operasyon başladı! {workers} işçi sahada. Hedef: %1+ kâr.")

    def stop(self) -> None:
        self._is_active = False
        self.on_report("🛑 Motor durduruldu.")

    def trigger_circuit_breaker(self) -> None:
        state = load_state()
        state["circuit_breaker"] = True
        state["mode"] = "dur"
        save_state(state)
        self._is_active = False
        self.on_report("🔴 Zincir stop tetiklendi! İşlemler durdu. 'zincir_kapat' ile kapatın.")

    def check_fuel(self) -> None:
        """Madde 26-27: BNB yakıt kontrolü (spam önleme: cooldown)."""
        asset = self.binance.get_asset_balance("BNB")
        if not asset:
            return
        free = float(asset.get("free", 0))
        if free >= config.BNB_MIN_FREE:
            return
        now = time.time()
        if now - self._last_bnb_warning_time < config.BNB_WARNING_COOLDOWN_SEC:
            return
        self._last_bnb_warning_time = now
        self.on_report(f"⚠️ BNB yakıtı düşük: {free:.4f}. Komisyon için BNB ekleyin.")

    def run_sell_all(self) -> None:
        """Madde 4: Tüm pozisyonları nakite çevir; state'teki pozisyon listesini temizler."""
        try:
            sold = self.binance.close_all_to_usdt()
            state = load_state()
            clear_all_positions(state)
            if not sold:
                self.on_report("🛑 DURDURULDU. Açık pozisyon yoktu.")
                return
            lines = ["🛑 DURDURULDU. Satılanlar:"]
            for sym, qty, order in sold:
                status = "OK" if order else "HATA"
                lines.append(f"  {sym}: {qty} ({status})")
            self.on_report("\n".join(lines))
        except Exception as e:
            logger.exception("Satış hatası: %s", e)
            self.on_report(f"❌ Satış hatası: {e}")

    def _trailing_stop_check(self, symbol: str, entry: float, highest: float, current: float, side: str) -> bool:
        """Fiyat hedeften sonra %trailing düşerse sat (long)."""
        if side != "BUY":
            return False
        if current < entry * (1 + config.PROFIT_TARGET):
            return False
        activation = entry * (1 + config.PROFIT_TARGET - config.ANTI_SHAKE)
        peak = max(highest, current)
        if peak < activation:
            return False
        stop_level = peak * (1 - config.TRAILING_STOP_PCT)
        if current <= stop_level:
            return True
        return False

    def _run_trailing_stops(self, state: dict, prices: dict) -> None:
        """Açık pozisyonlarda trailing stop kontrolü; tetiklenenleri sat ve listeden çıkar."""
        for pos in list(get_positions(state)):
            symbol = pos.get("symbol")
            if not symbol or symbol not in prices:
                continue
            current = prices[symbol]
            entry = float(pos.get("entry_price", 0))
            qty = float(pos.get("qty", 0))
            highest = float(pos.get("highest_price", entry))
            update_position_highest(state, symbol, current)
            state = load_state()
            pos = next((p for p in get_positions(state) if p.get("symbol") == symbol), None)
            if not pos:
                continue
            highest = float(pos.get("highest_price", entry))
            if not self._trailing_stop_check(symbol, entry, highest, current, "BUY"):
                continue
            try:
                self.binance.order_market_sell(symbol, qty)
                realized = (current - entry) * qty
                state = load_state()
                update_profit(state, state.get("realized_profit", 0) + realized)
                remove_position(state, symbol)
                self.on_report(f"📉 Trailing stop: {symbol} satıldı @ {current:.6f} (kâr ~{realized:.2f} USDT)")
            except Exception as e:
                logger.warning("Trailing satış %s: %s", symbol, e)
            if not self._is_active:
                break

    def run_cycle(self) -> None:
        """Tek döngü: önce trailing stop kontrolü, sonra al modundaysa dağıtılmış alım + pozisyon kaydı."""
        state = load_state()
        if not self._is_active or state.get("mode") != "al" or state.get("circuit_breaker"):
            return

        try:
            if not self.binance.ping():
                self._consecutive_errors += 1
                if self._consecutive_errors >= config.MAX_CONSECUTIVE_ERRORS:
                    self.trigger_circuit_breaker()
                return
            self._consecutive_errors = 0
        except Exception:
            self._consecutive_errors += 1
            if self._consecutive_errors >= config.MAX_CONSECUTIVE_ERRORS:
                self.trigger_circuit_breaker()
            return

        self.check_fuel()

        # 1) Pozisyon takibi + trailing stop
        try:
            prices = self.binance.get_prices()
            if prices:
                self._run_trailing_stops(state, prices)
        except Exception as e:
            logger.debug("Trailing kontrolü: %s", e)

        state = load_state()
        reset_daily_count_if_new_day(state)
        if state.get("order_count_today", 0) >= config.ORDERS_PER_DAY:
            return

        # [Snowball Stratejisi] Bütçeye göre parça sayısı
        budget = state.get("budget", 0) + state.get("realized_profit", 0)
        if budget < 500:
            parca_sayisi = 4
        elif budget < 1000:
            parca_sayisi = 6
        else:
            parca_sayisi = 10

        parca_basi_miktar = round(budget / parca_sayisi, 2)
        positions = get_positions(state)

        if len(positions) >= parca_sayisi or budget <= 11:
            return

        targets = self.binance.get_market()
        if not targets:
            return

        min_notional = 11.0
        if parca_basi_miktar < min_notional:
            return

        # Her döngüde radardan tek coin al (yığılma olmasın)
        for symbol in targets:
            if not self._is_active:
                break
            if any(p.get("symbol") == symbol for p in positions):
                continue
            if self.binance.get_min_notional(symbol) > parca_basi_miktar:
                continue
            try:
                order = self.binance.order_market_buy(symbol, parca_basi_miktar)
                avg_price, fill_qty = BinanceWrapper.order_fill_summary(order or {})
                if fill_qty > 0 and avg_price > 0:
                    state = load_state()
                    current = (self.binance.get_prices() or {}).get(symbol, avg_price)
                    add_or_merge_position(state, symbol, avg_price, fill_qty, current)
                    logger.info("HEDEF VURULDU: %s | Miktar: %s USDT", symbol, parca_basi_miktar)
                    self.on_report(
                        f"🚀 **ALIM YAPILDI**\n💎 Coin: {symbol}\n💰 Tutar: {parca_basi_miktar:.2f} USDT"
                    )
                break
            except Exception as e:
                logger.debug("Alım atlandı %s: %s", symbol, e)
