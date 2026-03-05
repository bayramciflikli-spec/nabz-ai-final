@echo off
cd /d "%~dp0"
echo Masaustune Python kisayolu olusturuluyor...

set PYEXE=C:\Users\Yumi4\AppData\Local\Programs\Python\Python312\python.exe
if not exist "%PYEXE%" set PYEXE=C:\Users\Yumi4\AppData\Local\Programs\Python\Launcher\py.exe

REM Kisayol: CMD acilir, Python konsolu acik kalir
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$WshShell = New-Object -ComObject WScript.Shell; " ^
  "$s = $WshShell.CreateShortcut([Environment]::GetFolderPath('Desktop') + '\\Python 3.12.lnk'); " ^
  "$s.TargetPath = 'cmd.exe'; " ^
  "$s.Arguments = '/k \"%PYEXE%\"'; " ^
  "$s.WorkingDirectory = [Environment]::GetFolderPath('UserProfile'); " ^
  "$s.Description = 'Python 3.12 Konsolu'; " ^
  "$s.Save(); " ^
  "Write-Host 'Tamam. Masaustunde Python 3.12 kisayolu olusturuldu.'"

echo.
pause
