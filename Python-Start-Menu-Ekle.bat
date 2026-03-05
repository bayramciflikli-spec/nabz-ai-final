@echo off
cd /d "%~dp0"
echo Python'u normal uygulama gibi Baslat menusune ekliyorum...

set PYEXE=C:\Users\Yumi4\AppData\Local\Programs\Python\Python312\python.exe
set PYDIR=C:\Users\Yumi4\AppData\Local\Programs\Python\Python312
if not exist "%PYEXE%" (
  set PYEXE=C:\Users\Yumi4\AppData\Local\Programs\Python\Launcher\py.exe
  set PYDIR=C:\Users\Yumi4\AppData\Local\Programs\Python\Launcher
)

set STARTMENU=%APPDATA%\Microsoft\Windows\Start Menu\Programs

REM 1) Baslat Menusu - Python 3.12 (konsol acilir)
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$Wsh = New-Object -ComObject WScript.Shell; " ^
  "$s = $Wsh.CreateShortcut(env:APPDATA + '\\Microsoft\\Windows\\Start Menu\\Programs\\Python 3.12.lnk'); " ^
  "$s.TargetPath = 'cmd.exe'; " ^
  "$s.Arguments = '/k \"%PYEXE%\"'; " ^
  "$s.WorkingDirectory = env:USERPROFILE; " ^
  "$s.Description = 'Python 3.12'; " ^
  "$s.Save()"

REM 2) IDLE varsa onu da ekle (Python ile gelen editör)
if exist "%PYDIR%\Lib\idlelib\idle.py" (
  powershell -NoProfile -ExecutionPolicy Bypass -Command ^
    "$Wsh = New-Object -ComObject WScript.Shell; " ^
    "$s = $Wsh.CreateShortcut(env:APPDATA + '\\Microsoft\\Windows\\Start Menu\\Programs\\Python 3.12 IDLE.lnk'); " ^
    "$s.TargetPath = '%PYEXE%'; " ^
    "$s.Arguments = '-m idlelib'; " ^
    "$s.WorkingDirectory = env:USERPROFILE; " ^
    "$s.Description = 'Python IDLE'; " ^
    "$s.Save()"
  echo IDLE kisayolu da eklendi.
)

echo.
echo Tamam. Simdi BASLAT'a tiklayip "Python" yazin - Python 3.12 gorunecek.
echo (Bazen 1-2 dakika gecikmeyle listeye eklenir.)
echo.
echo Store uyarisi: Baslat'ta "Python" yazinca Microsoft Store aciliyorsa:
echo   Ayarlar - Uygulamalar - Gelişmiş ayarlar - Uygulama yürütme diğer adlari
echo   "python.exe" ve "python3.exe" (App Installer) KAPATIN.
echo.
pause
