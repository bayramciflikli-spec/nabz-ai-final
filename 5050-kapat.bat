@echo off
echo Port 5050 kapatiliyor (Flask / NABZ yerel sunucu)...
for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr ":5050"') do taskkill /F /PID %%a 2>nul
powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 5050 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }" 2>nul
echo Tamam. Simdi python scripts/nabz_local_server.py calistirabilirsin.
pause
