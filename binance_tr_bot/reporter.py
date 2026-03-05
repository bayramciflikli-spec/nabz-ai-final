# -*- coding: utf-8 -*-
"""
Yarı otonom rapor: hata tespiti, kısa onarım önerisi, rapor dosyasına yazma.
"""
import logging
from datetime import datetime, timezone
from pathlib import Path

import config
from state_manager import get_pnl_summary, load_state

logger = logging.getLogger(__name__)


def ensure_log_dir():
    config.LOG_DIR.mkdir(parents=True, exist_ok=True)


def write_report(message: str, level: str = "INFO") -> None:
    """Rapor dosyasına ve log'a yazar."""
    ensure_log_dir()
    ts = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
    line = f"[{ts}] [{level}] {message}\n"
    try:
        with open(config.REPORT_FILE, "a", encoding="utf-8") as f:
            f.write(line)
    except Exception as e:
        logger.warning("Rapor yazılamadı: %s", e)
    if level == "ERROR":
        logger.error(message)
    else:
        logger.info(message)


def diagnose_and_report() -> str:
    """
    Sistem durumunu kontrol eder, sorun varsa raporlar ve kısa öneri döner.
    """
    state = load_state()
    issues = []
    suggestions = []

    if state.get("circuit_breaker_active"):
        issues.append("Zincir stop aktif; işlemler durduruldu.")
        suggestions.append("Binance düzeldiyse 'zincir_kapat' yazıp tekrar 'al' deyin.")

    if not config.API_KEY:
        issues.append("API anahtarı tanımlı değil.")
        suggestions.append(".env dosyasına BINANCE_TR_API_KEY ve BINANCE_TR_API_SECRET ekleyin.")

    pnl = get_pnl_summary(state)
    if pnl["isci_sayisi"] < 1:
        issues.append("İşçi sayısı 0; sermaye veya kâr artırılmalı.")
        suggestions.append("Para ekleyin veya kâr biriktirin.")

    summary = "Sistem kontrolü: " + ("Sorun yok." if not issues else "; ".join(issues))
    if suggestions:
        summary += " Öneriler: " + " | ".join(suggestions)
    write_report(summary, "WARNING" if issues else "INFO")
    return summary
