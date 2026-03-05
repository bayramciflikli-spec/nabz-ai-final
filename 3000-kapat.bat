@echo off
echo Port 3000 kapatiliyor...
for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr ":3000"') do taskkill /F /PID %%a 2>nul
powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }" 2>nul
echo Tamam. Simdi NABZ-BASLAT.bat veya NABZ-AC.bat calistirabilirsin.
pause
