@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo.
echo ========================================
echo   Firebase Auth - Kurulum Adımları
echo ========================================
echo.

echo [1/5] npm run setup-auth çalıştırılıyor...
call npm run setup-auth

echo.
echo [2/5] Tamamlandı. Tarayıcıda açılan sekmelerde:
echo    - Service Account: Yeni özel anahtar oluştur ^> JSON indir
echo    - Auth: Email/Password ve Google'ı Enable yapın
echo.

echo [3/5] .env.local dosyasına FIREBASE_SERVICE_ACCOUNT_KEY ekleyin:
echo    JSON içeriğini tek satır olarak yapıştırın
echo.

echo [4/5] Tekrar çalıştırın: npm run enable-auth
echo.

echo [5/5] Uygulamayı başlatın: npm run dev
echo.

pause
