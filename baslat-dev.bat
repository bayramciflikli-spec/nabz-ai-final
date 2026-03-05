@echo off
cd /d "%~dp0"
if exist ".next\dev\lock" del /f ".next\dev\lock"

REM Sunucuyu YENI bir pencerede baslat - o pencereyi KAPATMA
start "NABZ Sunucu - BU PENCEREYI KAPATMAYIN" cmd /k "cd /d "%~dp0" && (if exist .next\dev\lock del /f .next\dev\lock) && echo Sunucu baslatiliyor... && npm run dev:127"

echo.
echo Tarayici 12 saniye sonra acilacak. Bekleyin...
timeout /t 12 /nobreak >nul 2>nul
start "" "http://127.0.0.1:3000"
echo.
echo Tarayici acildi. Ana sayfa acilmadiysa adres cubuguna yazin: http://127.0.0.1:3000
echo Bu pencereyi kapatabilirsiniz. Sunucu diger pencerede calisiyor.
timeout /t 3 /nobreak >nul 2>nul
