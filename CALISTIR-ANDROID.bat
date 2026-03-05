@echo off
cd /d "%~dp0"
echo ============================================
echo  NABIZ - Android Emulator icin Calistirma
echo ============================================
echo.
echo ONEMLI: Once baska bir terminalde sunucuyu baslatin:
echo   calistir.bat   veya   npm run dev
echo.
echo Sunucu calisiyorsa Enter'a basin...
pause

echo.
echo Android emulator baslatiliyor...
call npm run dev:android

pause
