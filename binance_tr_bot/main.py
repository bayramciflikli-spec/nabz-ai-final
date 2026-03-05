# -*- coding: utf-8 -*-
"""
Ana döngü: semboller yükle, rate limit ile al/sat döngüsü, komut dinleyici, acil stop, rapor.
"""
import logging
import queue
import sys
import threading
import time

import config
from api_client import BinanceTRClient
from commands import parse_command, cmd_al, cmd_dur, cmd_bakiye, cmd_para_ekle, cmd_para_cek, cmd_zincir_kapat
from emergency_stop import check_binance_ok, activate_circuit_breaker, monitor_and_trip, should_stop_trading
from executor import Executor
from reporter import write_report, diagnose_and_report
from state_manager import load_state, save_state

# Logging
config.LOG_DIR.mkdir(parents=True, exist_ok=True)
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler(config.LOG_DIR / "bot.log", encoding="utf-8"),
    ],
)
logger = logging.getLogger(__name__)

# Komut kuyruğu (thread-safe)
cmd_queue = queue.Queue()
consecutive_errors = 0


def command_listener():
    """Arka planda komut dinler (Al, Dur, Bakiye, para ekle/çek)."""
    while True:
        try:
            line = input().strip()
            if line:
                cmd_queue.put(line)
        except EOFError:
            break
        except Exception:
            break


def process_commands():
    """Kuyruktaki komutları işler."""
    try:
        while True:
            line = cmd_queue.get_nowait()
            cmd, arg = parse_command(line)
            if cmd == "al":
                print(cmd_al())
            elif cmd == "dur":
                print(cmd_dur())
            elif cmd == "bakiye":
                print(cmd_bakiye())
            elif cmd == "para_ekle" and arg is not None:
                print(cmd_para_ekle(arg))
            elif cmd == "para_cek" and arg is not None:
                print(cmd_para_cek(arg))
            elif cmd == "zincir_kapat":
                print(cmd_zincir_kapat())
            else:
                print("Bilinmeyen komut. Kullanım: al | dur | bakiye | para_ekle <miktar> | para_cek <miktar> | zincir_kapat")
    except queue.Empty:
        pass


def main():
    global consecutive_errors

    if not config.API_KEY or not config.API_SECRET:
        logger.warning("BINANCE_TR_API_KEY ve BINANCE_TR_API_SECRET .env veya ortam değişkeninde tanımlayın.")
        write_report("API anahtarları eksik. .env dosyasını kontrol edin.", "ERROR")

    client = BinanceTRClient()
    if not client.ping():
        logger.warning("Binance TR'ye bağlanılamadı. API anahtarı veya ağ kontrol edin.")
        write_report("Binance TR ping başarısız.", "ERROR")

    try:
        symbols = client.get_symbols()
    except Exception as e:
        logger.exception("Semboller alınamadı: %s", e)
        symbols = []
    if not symbols:
        logger.warning("İşlem yapılabilecek sembol bulunamadı. QUOTE_ASSETS veya exchange kontrol edin.")

    executor = Executor(client, symbols)
    write_report("Bot başlatıldı. Komutlar: al, dur, bakiye, para_ekle <miktar>, para_cek <miktar>, zincir_kapat")

    # Komut dinleyici thread
    t = threading.Thread(target=command_listener, daemon=True)
    t.start()

    cycle = 0
    while True:
        try:
            process_commands()

            if should_stop_trading():
                time.sleep(10)
                continue

            state = load_state()
            if state.get("mode") == "al":
                try:
                    placed = executor.run_cycle()
                    if placed > 0:
                        consecutive_errors = 0
                except Exception as e:
                    consecutive_errors += 1
                    logger.exception("Döngü hatası: %s", e)
                    if monitor_and_trip(consecutive_errors):
                        write_report("Zincir stop tetiklendi (ardışık API hataları).", "ERROR")

            # Trailing stop kontrolü (kısa aralıklarla)
            try:
                triggered = executor.check_trailing_stops()
                for symbol, stop_price, pos in triggered:
                    # Burada ilgili pozisyonu kapatmak için satış order'ı atılabilir
                    logger.info("Trailing stop tetiklendi %s @ %s", symbol, stop_price)
                    write_report("Trailing stop: %s @ %s" % (symbol, stop_price), "INFO")
            except Exception as e:
                logger.debug("Trailing stop kontrolü: %s", e)

            # Periyodik rapor
            cycle += 1
            if cycle % 60 == 0:
                diagnose_and_report()

            time.sleep(max(1.0, config.MIN_INTERVAL_BETWEEN_ORDERS * 0.5))
        except KeyboardInterrupt:
            cmd_dur()
            write_report("Bot kullanıcı tarafından durduruldu (Ctrl+C).", "INFO")
            break
        except Exception as e:
            logger.exception("Beklenmeyen hata: %s", e)
            write_report("Beklenmeyen hata: %s" % e, "ERROR")
            time.sleep(30)


if __name__ == "__main__":
    main()
