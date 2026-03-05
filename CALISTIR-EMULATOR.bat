@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo.
echo ========================================
echo   NABZ-AI - Auth Emulator ile Çalıştır
echo ========================================
echo.
echo Bu modda giriş yöntemleri (Google, E-posta vb.)
echo Firebase Console ayarı OLMADAN çalışır.
echo.

where firebase >nul 2>nul
if errorlevel 1 (
  echo Firebase CLI yüklü değil. Yükleniyor: npm install -g firebase-tools
  call npm install -g firebase-tools
)

echo [1] Auth emulator başlatılıyor (port 9099)...
echo [2] Ayrı bir terminalde: npm run dev
echo.
echo .env.local'de NEXT_PUBLIC_USE_AUTH_EMULATOR=true olduğundan emin olun.
echo.

start "Firebase Auth Emulator" cmd /k "firebase emulators:start --only auth"
timeout /t 3 /nobreak >nul
echo.
echo Emulator başlatıldı. Şimdi 'npm run dev' çalıştırın.
echo.
pause
