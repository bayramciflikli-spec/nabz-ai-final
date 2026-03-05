# -*- coding: utf-8 -*-
"""
Binance TR REST API istemcisi (HMAC imzalı istekler, rate limit).
"""
import hashlib
import hmac
import logging
import time
import urllib.parse
from typing import Any, Dict, Optional

import requests

import config

logger = logging.getLogger(__name__)


class BinanceTRClient:
    def __init__(self, api_key: str = None, api_secret: str = None):
        self.api_key = (api_key or config.API_KEY).strip()
        self.api_secret = (api_secret or config.API_SECRET).strip()
        self.base = config.BASE_URL.rstrip("/")
        self.session = requests.Session()
        self.session.headers["X-MBX-APIKEY"] = self.api_key
        self._last_request_time = 0.0
        self._order_interval = config.MIN_INTERVAL_BETWEEN_ORDERS

    def _sign(self, params: dict) -> str:
        query = urllib.parse.urlencode(sorted(params.items()))
        return hmac.new(
            self.api_secret.encode("utf-8"),
            query.encode("utf-8"),
            hashlib.sha256,
        ).hexdigest()

    def _rate_limit_wait(self):
        elapsed = time.time() - self._last_request_time
        if elapsed < self._order_interval:
            time.sleep(self._order_interval - elapsed)
        self._last_request_time = time.time()

    def _request(
        self,
        method: str,
        path: str,
        signed: bool = False,
        params: Optional[Dict] = None,
        data: Optional[Dict] = None,
        use_base_me: bool = False,
    ) -> dict:
        base = config.API_BASE_ME if use_base_me else self.base
        url = f"{base}{path}" if path.startswith("/") else f"{base}/{path}"
        params = dict(params or {})
        if signed:
            params["timestamp"] = int(time.time() * 1000)
            params["recvWindow"] = config.RECV_WINDOW
            params["signature"] = self._sign(params)

        if method.upper() == "GET":
            resp = self.session.get(url, params=params, timeout=15)
        else:
            resp = self.session.post(url, params=params, data=data, timeout=15)

        out = resp.json() if resp.headers.get("content-type", "").startswith("application/json") else {}
        if resp.status_code == 429:
            retry = int(resp.headers.get("Retry-After", 60))
            logger.warning("Rate limit (429). %s saniye bekleniyor.", retry)
            time.sleep(retry)
            return self._request(method, path, signed=signed, params=params, data=data, use_base_me=use_base_me)
        if resp.status_code == 418:
            logger.error("IP ban (418). Retry-After kadar bekleyin.")
            raise RuntimeError("Binance TR: IP ban (418)")

        if resp.status_code != 200:
            logger.error("API hata: %s %s", resp.status_code, out)
            resp.raise_for_status()

        # Binance TR: code 0 = başarı
        if out.get("code") != 0 and "data" not in out:
            raise RuntimeError("API cevap hatası: %s" % out.get("msg", out))
        return out

    def ping(self) -> bool:
        """Sunucu zamanı ile bağlantı kontrolü."""
        try:
            r = self.session.get(f"{self.base}/open/v1/common/time", timeout=10)
            if r.status_code != 200:
                return False
            d = r.json()
            return d.get("code") == 0
        except Exception as e:
            logger.debug("Ping hatası: %s", e)
            return False

    def get_symbols(self) -> list:
        """İşlem görebileceğimiz tüm semboller (Binance TR format: BASE_QUOTE)."""
        out = self._request("GET", "/open/v1/common/symbols", signed=False)
        list_ = out.get("data", {}).get("list", [])
        result = []
        for s in list_:
            if not s.get("spotTradingEnable", True):
                continue
            sym = s.get("symbol")
            quote = s.get("quoteAsset")
            if sym and quote in config.QUOTE_ASSETS:
                result.append({
                    "symbol": sym,
                    "baseAsset": s.get("baseAsset"),
                    "quoteAsset": quote,
                    "filters": s.get("filters", []),
                })
        return result

    def get_account_spot(self) -> dict:
        """Spot bakiye (SIGNED)."""
        return self._request("GET", "/open/v1/account/spot", signed=True)

    def get_ticker_price(self, symbol: str) -> Optional[float]:
        """Tek sembol fiyatı (api.binance.me format: BTCUSDT)."""
        try:
            # Binance TR bazen symbol = BTC_USDT; api.binance.me için BTCUSDT
            sym_global = symbol.replace("_", "")
            url = f"{config.API_BASE_ME}/api/v3/ticker/price"
            r = self.session.get(url, params={"symbol": sym_global}, timeout=10)
            if r.status_code != 200:
                return None
            d = r.json()
            return float(d.get("price", 0))
        except Exception:
            return None

    def place_order(
        self,
        symbol: str,
        side: int,  # 0 BUY, 1 SELL
        order_type: int,  # 1 LIMIT, 2 MARKET
        quantity: str = None,
        price: str = None,
        quote_order_qty: str = None,
        client_id: str = None,
    ) -> dict:
        """Sipariş gönder. Rate limit beklemesi çağıran tarafında (executor)."""
        params = {
            "symbol": symbol,
            "side": side,
            "type": order_type,
        }
        if quantity is not None:
            params["quantity"] = str(quantity)
        if price is not None:
            params["price"] = str(price)
        if quote_order_qty is not None:
            params["quoteOrderQty"] = str(quote_order_qty)
        if client_id:
            params["clientId"] = client_id

        self._rate_limit_wait()
        return self._request("POST", "/open/v1/orders", signed=True, params=params)

    def cancel_order(self, symbol: str, order_id: int = None, client_id: str = None) -> dict:
        params = {"symbol": symbol}
        if order_id is not None:
            params["orderId"] = order_id
        if client_id:
            params["clientId"] = client_id
        return self._request("POST", "/open/v1/orders/cancel", signed=True, params=params)

    def get_open_orders(self, symbol: str) -> list:
        out = self._request(
            "GET", "/open/v1/orders",
            signed=True,
            params={"symbol": symbol, "type": 1},
        )
        return out.get("data", {}).get("list", [])
