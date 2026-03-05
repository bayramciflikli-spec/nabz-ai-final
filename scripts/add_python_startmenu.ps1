$Wsh = New-Object -ComObject WScript.Shell
$path = Join-Path $env:APPDATA "Microsoft\Windows\Start Menu\Programs\Python 3.12.lnk"
$s = $Wsh.CreateShortcut($path)
$s.TargetPath = "cmd.exe"
$s.Arguments = '/k "C:\Users\Yumi4\AppData\Local\Programs\Python\Python312\python.exe"'
$s.WorkingDirectory = $env:USERPROFILE
$s.Description = "Python 3.12"
$s.Save()
Write-Host "Python 3.12 Start Menu kisayolu olusturuldu: $path"

$pyDir = "C:\Users\Yumi4\AppData\Local\Programs\Python\Python312"
$idlePath = Join-Path $pyDir "Lib\idlelib\idle.py"
if (Test-Path $idlePath) {
  $path2 = Join-Path $env:APPDATA "Microsoft\Windows\Start Menu\Programs\Python 3.12 IDLE.lnk"
  $s2 = $Wsh.CreateShortcut($path2)
  $s2.TargetPath = Join-Path $pyDir "python.exe"
  $s2.Arguments = "-m idlelib"
  $s2.WorkingDirectory = $env:USERPROFILE
  $s2.Description = "Python IDLE"
  $s2.Save()
  Write-Host "Python 3.12 IDLE kisayolu olusturuldu."
}

$desk = [Environment]::GetFolderPath("Desktop")
$deskPath = Join-Path $desk "Python 3.12.lnk"
$sd = $Wsh.CreateShortcut($deskPath)
$sd.TargetPath = "cmd.exe"
$sd.Arguments = '/k "C:\Users\Yumi4\AppData\Local\Programs\Python\Python312\python.exe"'
$sd.WorkingDirectory = $env:USERPROFILE
$sd.Description = "Python 3.12"
$sd.Save()
Write-Host "Masaustu kisayolu olusturuldu: $deskPath"
