# -*- coding: utf-8 -*-
"""
Komutlar: Al, Dur, Bakiye, para ekle/çek.
"""
import logging
from typing import Optional

from state_manager import (
    add_deposit,
    add_withdrawal,
    get_pnl_summary,
    load_state,
    save_state,
)

logger = logging.getLogger(__name__)


def cmd_al() -> str:
    """Tüm işçiler alıma geçer."""
    state = load_state()
    if state.get("circuit_breaker_active"):
        return "Zincir stop aktif. Önce 'Zincir stop kapat' ile kapatın."
    state["mode"] = "al"
    save_state(state)
    return "Al modu açıldı. Tüm işçiler alıma geçti."


def cmd_dur() -> str:
    """Bot durur; para yatırma/çekme yapılabilir."""
    state = load_state()
    state["mode"] = "dur"
    save_state(state)
    return "Dur modu. İşlemler durdu. Para yatırma veya çekme yapabilirsiniz."


def cmd_bakiye() -> str:
    """Güncel kar/zarar ve özet."""
    state = load_state()
    pnl = get_pnl_summary(state)
    lines = [
        "--- Bakiye ---",
        "Sermaye (yatırılan - çekilen): %.2f" % pnl["sermaye"],
        "Gerçekleşen kâr: %.2f" % pnl["gerceklesen_kar"],
        "Gerçekleşmemiş kâr: %.2f" % pnl["gerceklesmemis_kar"],
        "Toplam equity: %.2f" % pnl["toplam_equity"],
        "İşçi sayısı: %d" % pnl["isci_sayisi"],
        "Mod: %s" % pnl["mod"],
    ]
    if state.get("circuit_breaker_active"):
        lines.append("UYARI: Zincir stop aktif.")
    return "\n".join(lines)


def cmd_para_ekle(miktar: float) -> str:
    """Sermayeye para ekler."""
    if miktar <= 0:
        return "Geçersiz miktar."
    state = load_state()
    add_deposit(state, miktar)
    return "%.2f TL/USD eklendi. Güncel sermaye: %.2f" % (
        miktar,
        state["capital_usd"],
    )


def cmd_para_cek(miktar: float) -> str:
    """Sermayeden para çeker."""
    if miktar <= 0:
        return "Geçersiz miktar."
    state = load_state()
    if miktar > state.get("capital_usd", 0):
        return "Yetersiz bakiye. Maksimum: %.2f" % state.get("capital_usd", 0)
    add_withdrawal(state, miktar)
    return "%.2f çekildi. Kalan sermaye: %.2f" % (
        miktar,
        state["capital_usd"],
    )


def cmd_zincir_kapat() -> str:
    """Circuit breaker'ı kapatır."""
    state = load_state()
    if not state.get("circuit_breaker_active"):
        return "Zincir stop zaten kapalı."
    state["circuit_breaker_active"] = False
    save_state(state)
    return "Zincir stop kapatıldı. 'Al' ile tekrar başlatabilirsiniz."


def parse_command(line: str) -> tuple:
    """
    Kullanıcı girişini parse eder.
    Returns: (komut_adi, arg) örn. ("al", None), ("para_ekle", 100.0)
    """
    line = (line or "").strip().lower()
    if not line:
        return "unknown", None
    parts = line.split()
    cmd = parts[0]
    arg = float(parts[1]) if len(parts) > 1 and _is_number(parts[1]) else None
    if cmd in ("al", "başla"):
        return "al", None
    if cmd in ("dur", "stop", "durdur"):
        return "dur", None
    if cmd in ("bakiye", "özet", "kar", "zarar"):
        return "bakiye", None
    if cmd == "para_ekle" and arg is not None:
        return "para_ekle", arg
    if cmd == "para_cek" and arg is not None:
        return "para_cek", arg
    if cmd in ("zincir_kapat", "circuit_kapat"):
        return "zincir_kapat", None
    return "unknown", None


def _is_number(s: str) -> bool:
    try:
        float(s)
        return True
    except ValueError:
        return False
