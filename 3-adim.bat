@echo off
cd /d "%~dp0"
echo ============================================
echo   ADIM 1: .env.local - Zaten olusturuldu.
echo   Firebase Console'dan degerleri .env.local
echo   dosyasina kopyalayin (Proje ayarlari - Genel)
echo ============================================
echo.

echo ADIM 2: Bagimliliklari yukleniyor (npm install)...
call npm install
if errorlevel 1 (
  echo HATA: npm install basarisiz. Internet baglantinizi kontrol edin.
  pause
  exit /b 1
)
echo OK.
echo.

echo ADIM 3: Firestore index (opsiyonel)
echo Firebase CLI yuklu degilse: npm install -g firebase-tools
echo Sonra: firebase login
echo       firebase use --add
echo       firebase deploy --only firestore:indexes
echo.
echo Simdi gelistirme sunucusu baslatiliyor...
echo Tarayicida: http://localhost:3000
echo Durdurmak icin Ctrl+C
echo.
call npm run dev
pause
