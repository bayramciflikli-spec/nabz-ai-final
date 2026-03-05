@echo off
title NABZ-AI Fortress
cd /d "%~dp0"

REM Once py (Windows Launcher), sonra python dene
py scripts/nabz_ai_fortress.py 2>nul
if errorlevel 1 (
  python scripts/nabz_ai_fortress.py 2>nul
)
if errorlevel 1 (
  echo.
  echo Python bulunamadi. Yapilacaklar:
  echo 1. https://www.python.org/downloads/ adresinden Python indirip kurun.
  echo 2. Kurulumda "Add Python to PATH" kutusunu isaretleyin.
  echo 3. Bu pencereyi kapatip NABZ-FORTRESS'i tekrar calistirin.
  echo.
)
pause
