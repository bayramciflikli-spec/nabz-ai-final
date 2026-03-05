# -*- coding: utf-8 -*-
"""
HydraElite - Telegram ile kontrol edilen Binance Spot botu.
Madde 1: Sadece USER_UID komut verebilir.
Motor ayrı thread'te çalışır; al/sat/dur komutları anında işlenir.
"""
import logging
import sys
import threading
import time

import telebot
from dotenv import load_dotenv

load_dotenv()

import config
from binance_client import BinanceWrapper
from engine import HydraEngine
from state_manager import (
    load_state,
    save_state,
    set_mode,
    add_deposit,
    add_withdrawal,
    get_equity,
    get_positions,
)

# --- Logging ---
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout),
    ],
)
logger = logging.getLogger(__name__)

# --- Yetki: Madde 1 - Sadece bu UID komut verebilir
def is_authorized(user_id) -> bool:
    uid = str(user_id)
    if config.USER_UID and uid != config.USER_UID:
        return False
    return True


def main():
    if not config.API_KEY or not config.API_SECRET:
        print("HATA: .env içinde BINANCE_API_KEY ve BINANCE_API_SECRET tanımlayın.")
        return
    if not config.TG_TOKEN:
        print("HATA: TELEGRAM_BOT_TOKEN tanımlayın.")
        return
    if not config.CHAT_ID:
        print("HATA: TELEGRAM_CHAT_ID tanımlayın (raporların gideceği chat).")
        return

    tg_bot = telebot.TeleBot(config.TG_TOKEN)
    binance = BinanceWrapper()

    def _send_report(msg: str) -> None:
        """Raporu last_chat_id (kaptan) varsa oraya, yoksa CHAT_ID'ye gönderir."""
        state = load_state()
        chat_id = state.get("last_chat_id") or config.CHAT_ID
        if chat_id:
            try:
                tg_bot.send_message(chat_id, msg)
            except Exception as e:
                logger.warning("Rapor gönderilemedi: %s", e)

    engine = HydraEngine(binance, _send_report)

    def engine_loop():
        """[Snowball] Bütçeyi parçalara böl, radardaki coinlere her döngüde tek alım."""
        print("🐉 Hydra Elite Çelik Zırhlı Final Versiyon Aktif!")
        while True:
            try:
                state = load_state()
                positions = get_positions(state)
                budget = state.get("budget", 0)
                mode = state.get("mode", "dur")
                print(
                    f"⚙️ Sistem Durumu: {mode.upper()} | Bakiye: {budget:.2f} | Pozisyon: {len(positions)}"
                )

                if mode == "al":
                    if budget < 11:
                        print("⚠️ UYARI: Bütçe yetersiz (11 USDT altı). İşlem yapılamıyor!")
                    else:
                        parca = 4 if budget < 500 else 6 if budget < 1000 else 10
                        print(f"🔍 Radarda hedef taranıyor (parça: {parca})...")
                    if engine.is_active:
                        engine.run_cycle()
                    time.sleep(5)
                elif mode == "dur":
                    print("💤 Bot beklemede... Telegram'dan 'al' komutu bekleniyor.")
                    time.sleep(10)
                else:
                    time.sleep(max(1.0, config.MIN_INTERVAL_ORDERS * 0.5))
            except Exception as e:
                logger.exception("Motor hatası: %s", e)
                time.sleep(max(1.0, config.MIN_INTERVAL_ORDERS * 0.5))

    engine_thread = threading.Thread(target=engine_loop, daemon=True)
    engine_thread.start()

    # [MADDE 1-5]: Zırhlı Telegram Komuta Zinciri – bloklar net, hata alsa bile kapanmaz
    @tg_bot.message_handler(func=lambda m: True)
    def control_center(message):
        chat_id = None
        try:
            if not message or not getattr(message, "from_user", None):
                return
            chat_id = getattr(message.chat, "id", None)
            logger.info("Komut alındı: chat_id=%s text=%r", chat_id, getattr(message, "text", None))

            if not is_authorized(message.from_user.id):
                try:
                    tg_bot.reply_to(message, "xxx")
                except Exception:
                    if chat_id is not None:
                        try:
                            tg_bot.send_message(chat_id, "xxx")
                        except Exception:
                            pass
                return

            # Kaptanın yerini öğren (raporlar bu chat'e de gidebilir)
            state = load_state()
            state["last_chat_id"] = message.chat.id
            save_state(state)

            text = (message.text or "").lower().strip()
            if text.startswith("/"):
                text = text.lstrip("/").strip()
            parts = text.split()
            head = parts[0] if parts else ""

            def _reply(msg_text: str) -> None:
                try:
                    tg_bot.reply_to(message, msg_text)
                except Exception:
                    try:
                        tg_bot.send_message(chat_id, msg_text)
                    except Exception as e:
                        logger.warning("Cevap gönderilemedi chat_id=%s: %s", chat_id, e)

            if text == "al":
                set_mode(load_state(), "al")
                engine.start()
                _reply("🚀 Hydra Okyanusa Açıldı!")

            elif text == "sat" or text == "dur":
                _reply("🛑 Durduruluyor...")
                if text == "sat":
                    engine.run_sell_all()
                set_mode(load_state(), "dur")
                engine.stop()
                _reply("🛑 Operasyon Durduruldu. Yeni alım yapılmayacak.")

            elif text == "bakiye":
                state = load_state()
                positions = get_positions(state)
                res = (
                    f"📊 Bakiye: {state.get('budget', 0):.2f}\n"
                    f"Açık Poz: {len(positions)}"
                )
                if state.get("circuit_breaker"):
                    res += "\n⚠️ Zincir stop AKTİF."
                _reply(res)

            elif head == "para_ekle" and len(parts) >= 2:
                try:
                    amount = float(parts[1])
                    if amount <= 0:
                        _reply("❌ Geçersiz miktar.")
                        return
                    state = load_state()
                    add_deposit(state, amount)
                    _reply(f"💰 {parts[1]} USDT eklendi.")
                except ValueError:
                    _reply("❌ Kullanım: para_ekle 100")

            elif head == "para_cek" and len(parts) >= 2:
                try:
                    amount = float(parts[1])
                    if amount <= 0:
                        _reply("❌ Geçersiz miktar.")
                        return
                    state = load_state()
                    if amount > state.get("budget", 0):
                        _reply(f"❌ Yetersiz bakiye. Maks: {state.get('budget', 0):.2f}")
                        return
                    add_withdrawal(state, amount)
                    _reply(f"💸 {parts[1]} USDT çekildi.")
                except ValueError:
                    _reply("❌ Kullanım: para_cek 50")

            elif text == "zincir_kapat":
                state = load_state()
                if not state.get("circuit_breaker"):
                    _reply("Zincir stop zaten kapalı.")
                    return
                state["circuit_breaker"] = False
                save_state(state)
                _reply("✅ Zincir stop kapatıldı. 'al' ile tekrar başlatabilirsiniz.")

            else:
                _reply(
                    "Komutlar: al | sat | dur | bakiye | para_ekle <miktar> | para_cek <miktar> | zincir_kapat"
                )

            save_state(load_state())
        except Exception as e:
            logger.exception("Telegram Komut Hatası: %s", e)
            print(f"⚠️ Komut hatası: {e}")
            try:
                if chat_id is not None:
                    tg_bot.send_message(chat_id, "⚠️ Komut işlenirken hata oluştu. Konsolu kontrol et.")
            except Exception:
                pass

    if config.USER_UID and config.USER_UID != "xxx":
        print("🐲 Sistem sahibi doğrulandı. Frankfurt bağlantısı hazır.")
    else:
        print("⚠️ USER_UID .env'de ayarlayın; yoksa herkes komut verebilir.")

    # Hataya dayanıklı döngü: bağlantı koparsa kapanmaz, 5 sn sonra tekrar dener
    while True:
        try:
            print("📡 Telegram Bağlantısı Kuruluyor...")
            tg_bot.infinity_polling(timeout=20, long_polling_timeout=10)
        except Exception as e:
            print(f"🔄 Bağlantı koptu, 5 sn sonra tekrar bağlanıyor... Hata: {e}")
            time.sleep(5)


if __name__ == "__main__":
    main()
