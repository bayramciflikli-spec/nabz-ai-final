@echo off
cd /d "%~dp0"
echo EPERM veya localhost sorunu icin 127.0.0.1 ile baslatiliyor...
echo.
if exist .next (
  echo .next temizleniyor...
  rmdir /s /q .next
)
echo.
echo Tarayicida ac: http://127.0.0.1:3000
echo Durdurmak icin Ctrl+C
echo.
call npm run dev:127
