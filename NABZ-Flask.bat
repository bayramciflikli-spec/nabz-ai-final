@echo off
title NABZ-AI Yerel Sunucu (Flask - Port 5050)
cd /d "%~dp0"

echo NABZ-AI Flask sunucusu baslatiliyor...
echo Port 5050 doluysa once 5050-kapat.bat calistirin.
echo.

python -c "import flask" 2>nul || (
  echo Flask yuklu degil. Calistir: pip install -r scripts/requirements.txt
  pause
  exit /b 1
)

python scripts/nabz_local_server.py

pause
