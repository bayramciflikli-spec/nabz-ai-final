@echo off
cd /d "%~dp0"
title NABZ - Sunucu [Bu pencereyi KAPATMA]

REM Port 3000 ve lock temizle
echo Port ve lock temizleniyor...
for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr ":3000"') do taskkill /F /PID %%a 2>nul
powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 3000 -EA SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -EA SilentlyContinue }" 2>nul
if exist ".next\dev\lock" del /f ".next\dev\lock" 2>nul
timeout /t 2 /nobreak >nul 2>nul

echo.
echo ============================================================
echo   TARAYICIDA SU ADRESI AC:
echo   http://127.0.0.1:3000
echo.
echo   "Ready" yazana kadar bekleyin, sonra adresi tarayiciya yazin.
echo   BU PENCEREYI KAPATMAYIN - sunucu burada calisiyor.
echo ============================================================
echo.

npm run dev:127

pause
