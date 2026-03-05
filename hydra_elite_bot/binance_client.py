# -*- coding: utf-8 -*-
"""Binance API sarmalayıcı: rate limit, hata yönetimi, yardımcı fonksiyonlar."""
import logging
import time
from typing import Any, Dict, List, Optional, Tuple

from binance.client import Client
from binance.enums import SIDE_BUY, SIDE_SELL, ORDER_TYPE_MARKET
from binance.exceptions import BinanceAPIException, BinanceRequestException

import config
from state_manager import load_state, save_state, reset_daily_count_if_new_day

logger = logging.getLogger(__name__)


class BinanceWrapper:
    def __init__(self):
        self._client = Client(config.API_KEY, config.API_SECRET)
        self._last_order_time = 0.0
        self._exchange_info = None
        self._tickers = {}

    def _wait_rate_limit(self) -> None:
        """24.000 işlem/gün: order'lar arası minimum aralık."""
        state = load_state()
        reset_daily_count_if_new_day(state)
        if state.get("order_count_today", 0) >= config.ORDERS_PER_DAY:
            raise RuntimeError("Günlük işlem limiti (24.000) doldu.")
        elapsed = time.time() - self._last_order_time
        if elapsed < config.MIN_INTERVAL_ORDERS:
            time.sleep(config.MIN_INTERVAL_ORDERS - elapsed)
        self._last_order_time = time.time()

    def _inc_order_count(self) -> None:
        state = load_state()
        state["order_count_today"] = state.get("order_count_today", 0) + 1
        save_state(state)

    def ping(self) -> bool:
        try:
            self._client.ping()
            return True
        except Exception:
            return False

    def get_exchange_info(self) -> Dict:
        if self._exchange_info is None:
            self._exchange_info = self._client.get_exchange_info()
        return self._exchange_info

    def get_symbol_info(self, symbol: str) -> Optional[Dict]:
        info = self.get_exchange_info()
        for s in info.get("symbols", []):
            if s["symbol"] == symbol:
                return s
        return None

    def get_symbols_usdt(self) -> List[str]:
        """USDT ile işlem yapılan, trade edilebilir semboller."""
        info = self.get_exchange_info()
        out = []
        for s in info.get("symbols", []):
            if not s.get("status") == "TRADING":
                continue
            if s.get("quoteAsset") != "USDT":
                continue
            if s.get("symbol") in ("USDCUSDT", "BUSDUSDT", "TUSDUSDT"):
                continue
            out.append(s["symbol"])
        return out

    def get_market(self) -> List[str]:
        """
        [Yıldırım Avcısı] Önce filtre, sonra sıralama.
        - İsim eşleşmesi: yasakli_kelimeler sembol içinde geçen her şeyi eler (WBTC, BTCUP, BTCDOWN vb.).
        - Sıralama hatası önleme: En yüksek hacimliyi filtreye bakmadan alma; önce tüm listeyi süz, sonra hacme göre sıralayıp ilk 30'u al.
        """
        try:
            data = self._client.get_ticker()
        except Exception as e:
            logger.warning("24h ticker alınamadı: %s", e)
            yasakli_kelimeler = ("BTC", "ETH", "BNB", "USDC", "FDUSD")
            fallback = [
                s for s in self.get_symbols_usdt()
                if not any(w in s.upper() for w in yasakli_kelimeler)
            ]
            return fallback[:30]

        # İçinde bu kelimeler geçen her sembol elenir (BTCUSDT, WBTCUSDT, BTCUP, BTCDOWN vb.)
        yasakli_kelimeler = ("BTC", "ETH", "BNB", "USDC", "FDUSD")
        # Önce filtrele (hacim 2M–30M, USDT, yasaklı kelime yok)
        adaylar = []
        for s in data:
            sym = s.get("symbol", "")
            sym_upper = (sym or "").upper()
            try:
                hacim = float(s.get("quoteVolume", 0))
                if not sym.endswith("USDT"):
                    continue
                if any(word in sym_upper for word in yasakli_kelimeler):
                    continue
                if 2_000_000 < hacim < 30_000_000:
                    adaylar.append((sym, hacim))
            except (TypeError, ValueError):
                continue
        # Sonra hacme göre sırala, en yüksek hacimli 30 çevik altcoini döndür (filtreyi delip en üsttekileri kapma)
        adaylar.sort(key=lambda x: x[1], reverse=True)
        return [sym for sym, _ in adaylar[:30]]

    def _round_qty(self, symbol: str, qty: float) -> str:
        info = self.get_symbol_info(symbol)
        if not info:
            return f"{qty:.8f}"
        for f in info.get("filters", []):
            if f.get("filterType") == "LOT_SIZE":
                step = float(f.get("stepSize", "0.001"))
                if step <= 0:
                    return f"{qty:.8f}"
                n = round(qty / step) * step
                return f"{n:.8f}".rstrip("0").rstrip(".")
        return f"{qty:.8f}"

    def get_min_notional(self, symbol: str) -> float:
        info = self.get_symbol_info(symbol)
        if not info:
            return 10.0
        for f in info.get("filters", []):
            if f.get("filterType") == "NOTIONAL":
                return float(f.get("minNotional", 10))
        return 10.0

    def get_prices(self) -> Dict[str, float]:
        """Sembol -> son fiyat."""
        try:
            ticks = self._client.get_all_tickers()
            return {t["symbol"]: float(t["price"]) for t in ticks}
        except Exception as e:
            logger.warning("Fiyatlar alınamadı: %s", e)
            return {}

    def get_account_balances(self) -> List[Dict[str, str]]:
        """Tüm bakiye (free, locked)."""
        try:
            acc = self._client.get_account()
            return acc.get("balances", [])
        except Exception as e:
            logger.warning("Hesap alınamadı: %s", e)
            return []

    def get_asset_balance(self, asset: str) -> Optional[Dict]:
        try:
            return self._client.get_asset_balance(asset=asset)
        except Exception:
            return None

    def order_market_buy(self, symbol: str, quote_amount_usdt: float) -> Optional[Dict]:
        """Market al - quoteOrderQty ile USDT harcar. Dönen order'da fills ile ortalama fiyat ve miktar hesaplanır."""
        self._wait_rate_limit()
        try:
            order = self._client.create_order(
                symbol=symbol,
                side=SIDE_BUY,
                type=ORDER_TYPE_MARKET,
                quoteOrderQty=quote_amount_usdt,
            )
            self._inc_order_count()
            return order
        except BinanceAPIException as e:
            logger.warning("Market buy hatası %s: %s", symbol, e)
            raise
        except Exception as e:
            logger.warning("Market buy %s: %s", symbol, e)
            raise

    @staticmethod
    def order_fill_summary(order: Dict) -> tuple:
        """Order cevabından ortalama doldurma fiyatı ve toplam miktar. (avg_price, total_qty)"""
        if not order or not order.get("fills"):
            return 0.0, 0.0
        total_qty = 0.0
        total_quote = 0.0
        for f in order["fills"]:
            p = float(f.get("price", 0))
            q = float(f.get("qty", 0))
            total_qty += q
            total_quote += p * q
        avg = total_quote / total_qty if total_qty else 0.0
        return avg, total_qty

    def order_market_sell(self, symbol: str, quantity: float) -> Optional[Dict]:
        """Market sat - miktar ile."""
        self._wait_rate_limit()
        qty_str = self._round_qty(symbol, quantity)
        try:
            order = self._client.create_order(
                symbol=symbol,
                side=SIDE_SELL,
                type=ORDER_TYPE_MARKET,
                quantity=qty_str,
            )
            self._inc_order_count()
            return order
        except BinanceAPIException as e:
            logger.warning("Market sell hatası %s: %s", symbol, e)
            raise
        except Exception as e:
            logger.warning("Market sell %s: %s", symbol, e)
            raise

    def close_all_to_usdt(self) -> List[Tuple[str, float, Optional[Dict]]]:
        """
        USDT ve BNB hariç tüm varlıkları piyasa fiyatından sat (Madde 4: sat komutu).
        Returns: [(symbol, qty, order_result), ...]
        """
        balances = self.get_account_balances()
        prices = self.get_prices()
        sold = []
        for b in balances:
            asset = b.get("asset", "")
            free = float(b.get("free", 0))
            if free <= 0:
                continue
            if asset in ("USDT", "BUSD", "USDC"):
                continue
            symbol = f"{asset}USDT"
            if symbol not in prices:
                continue
            try:
                order = self.order_market_sell(symbol, free)
                sold.append((symbol, free, order))
            except Exception as e:
                logger.warning("Satış yapılamadı %s: %s", symbol, e)
                sold.append((symbol, free, None))
        return sold
