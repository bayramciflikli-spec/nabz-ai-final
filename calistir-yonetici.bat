@echo off
:: EPERM hatasi icin - CMD'yi Yonetici olarak acip bu dosyaya sag tiklayin,
:: "Yonetici olarak calistir" secin.
cd /d "%~dp0"

if exist .next (
  echo .next temizleniyor...
  rmdir /s /q .next
)

echo.
echo ========================================
echo  Sunucu baslatiliyor (127.0.0.1)
echo ========================================
echo  Tarayicida ac: http://127.0.0.1:3000
echo  Durdurmak icin Ctrl+C
echo ========================================
echo.

call npm run dev:127

pause
