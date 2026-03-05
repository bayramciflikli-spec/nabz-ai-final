@echo off
cd /d "%~dp0"
echo Bagimliliklari yukleniyor...
call npm install
if errorlevel 1 (
  echo npm install basarisiz. Internet baglantinizi kontrol edin.
  pause
  exit /b 1
)
echo.
echo ========================================
echo  Sunucu baslatiliyor...
echo ========================================
echo.
echo  Tarayicida ac: http://127.0.0.1:3000
echo  veya:          http://localhost:3000
echo.
echo  Giris animasyonu icin: http://127.0.0.1:3000?intro=1
echo  (sessionStorage temizleyerek veya gizli pencerede de gorebilirsiniz)
echo  Durdurmak icin Ctrl+C
echo ========================================
echo.

call npm run dev

