@echo off
cd /d "%~dp0"
echo Masaustune NABZ-FORTRESS kisayolu olusturuluyor...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$WshShell = New-Object -ComObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut([Environment]::GetFolderPath('Desktop') + '\\NABZ-FORTRESS.lnk'); $Shortcut.TargetPath = '%~dp0NABZ-FORTRESS.bat'; $Shortcut.WorkingDirectory = '%~dp0'; $Shortcut.Description = 'NABZ-AI Fortress'; $Shortcut.Save(); Write-Host 'Tamam. Masaustunde NABZ-FORTRESS kisayolu olusturuldu.'"
echo.
pause
