@echo off
cd /d "%~dp0"
echo Masaustune NABZ-AI (Normal Calistir) kisayolu ekleniyor...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$WshShell = New-Object -ComObject WScript.Shell; $Desktop = [Environment]::GetFolderPath('Desktop'); $Shortcut = $WshShell.CreateShortcut($Desktop + '\\NABZ-AI Normal Calistir.lnk'); $Shortcut.TargetPath = '%~dp0NABZ-Masaustu.bat'; $Shortcut.WorkingDirectory = '%~dp0'; $Shortcut.Description = 'NABZ-AI - Sunucu ve tarayici'; $Shortcut.Save(); Write-Host 'Tamam. Masaustunde NABZ-AI Normal Calistir kisayolu olusturuldu.'"
echo.
pause
