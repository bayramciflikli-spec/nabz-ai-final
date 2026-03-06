@echo off
chcp 65001 >nul
title NABZ-AI
cd /d "%~dp0"
if not exist "app\" (
  echo HATA: Bu klasorde app klasoru yok. NABZ-AI-Baslat.bat dosyasi NABZ-AI klasorunun icinde olmali.
  echo Simdiki klasor: %CD%
  pause
  exit /b 1
)

set "NPM=%ProgramFiles%\nodejs\npm.cmd"
if not exist "%NPM%" set "NPM=%ProgramFiles(x86)%\nodejs\npm.cmd"
if not exist "%NPM%" (
  echo HATA: Node.js bulunamadi. Lutfen Node.js yukleyin: https://nodejs.org
  pause
  exit /b 1
)

echo NABZ-AI baslatiliyor...
echo Klasor: %CD%
echo.
start "NABZ-AI Sunucu" cmd /k ""%NPM%" run dev"
echo Next.js ilk acilista 20-40 saniye surebilir. Lutfen bekleyin...
echo Tarayici 25 saniye sonra acilacak...
timeout /t 25 /nobreak >nul
start "" "http://127.0.0.1:3000"
echo.
echo Tarayici acildi. Sunucu penceresini kapatmayin.
echo Sayfa acilmadiysa birkaç saniye daha bekleyip tarayicida F5 ile yenileyin.
echo Bu pencereyi kapatabilirsiniz.
pause
