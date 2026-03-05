@echo off
cd /d "%~dp0"
echo Masaustune NABZ-AI kisayolu olusturuluyor...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$WshShell = New-Object -ComObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut([Environment]::GetFolderPath('Desktop') + '\\NABZ-AI.lnk'); $Shortcut.TargetPath = '%~dp0NABZ-Masaustu.bat'; $Shortcut.WorkingDirectory = '%~dp0'; $Shortcut.Description = 'NABZ-AI Uygulamasi'; $Shortcut.Save(); Write-Host 'Tamam. Masaustunde NABZ-AI kisayolu olusturuldu.'"
echo.
pause
