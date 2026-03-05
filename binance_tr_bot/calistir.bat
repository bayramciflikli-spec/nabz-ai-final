@echo off
chcp 65001 >nul
cd /d "%~dp0"
if not exist ".env" (
    echo .env dosyasi bulunamadi. .env.example kopyalayip BINANCE_TR_API_KEY ve SECRET doldurun.
    pause
    exit /b 1
)
python -c "import requests" 2>nul || pip install -r requirements.txt
python main.py
pause
