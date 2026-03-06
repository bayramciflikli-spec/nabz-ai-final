@echo off
cd /d "%~dp0"
echo Bu klasorun guncel hali Vercel'e gonderiliyor...
call vercel --prod --force
pause
