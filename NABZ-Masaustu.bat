@echo off
cd /d "%~dp0"
title NABZ-AI Baslatiliyor...

REM Port 3000 ve lock temizle
for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr ":3000"') do taskkill /F /PID %%a 2>nul
powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 3000 -EA SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -EA SilentlyContinue }" 2>nul
if exist ".next\dev\lock" del /f ".next\dev\lock" 2>nul
timeout /t 2 /nobreak >nul 2>nul

REM Sunucuyu MINIMIZE pencerede baslat (arka planda calisir)
start /min cmd /k "cd /d "%~dp0" && title NABZ Sunucu && npm run dev:127"

echo NABZ-AI sunucu baslatiliyor...
echo Tarayici 15 saniye icinde acilacak.
timeout /t 15 /nobreak >nul 2>nul

start "" "http://127.0.0.1:3000"
echo.
echo NABZ-AI acildi. Sunucu arka planda (kucultulmus pencere) calisiyor.
timeout /t 3 /nobreak >nul 2>nul
