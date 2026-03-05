@echo off
cd /d "%~dp0"
title NABZ - Baslatiliyor

REM Eski sunucu ve lock temizle - tek tikla her zaman calissin
if exist ".next\dev\lock" del /f ".next\dev\lock" 2>nul
for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr ":3000"') do taskkill /F /PID %%a 2>nul
powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 3000 -EA SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -EA SilentlyContinue }" 2>nul
timeout /t 2 /nobreak >nul 2>nul

REM Sunucuyu ac (bu pencereyi kapatma)
start "NABZ Sunucu - BU PENCEREYI KAPATMAYIN" cmd /k "cd /d "%~dp0" && (if exist .next\dev\lock del /f .next\dev\lock 2>nul) && echo. && echo NABZ sunucu baslatiliyor... && echo Ready yazinca tarayici acilacak. && echo. && npm run dev:127"

echo.
echo Tarayici 15 saniye sonra acilacak: http://127.0.0.1:3000
timeout /t 15 /nobreak >nul 2>nul
start "" "http://127.0.0.1:3000"
echo.
echo Tamam. Tarayici acildi. Sunucu diger pencerede - onu kapatma.
timeout /t 2 /nobreak >nul 2>nul
