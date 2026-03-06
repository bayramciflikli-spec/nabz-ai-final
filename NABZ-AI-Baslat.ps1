# NABZ-AI - Cift tikla calistir (her zaman Desktop\NABZ-AI'da calisir)
$ErrorActionPreference = "Stop"
$projectPath = "C:\Users\Yumi4\Desktop\NABZ-AI"
if (-not (Test-Path "$projectPath\app")) {
  Write-Host "HATA: NABZ-AI projesi bulunamadi: $projectPath\app" -ForegroundColor Red
  Write-Host "Lutfen NABZ-AI klasorunun masaustunde oldugundan emin olun."
  pause
  exit 1
}
Set-Location $projectPath

# PATH'e Node ekle (cift tiklamada bazen eksik oluyor)
$nodePath = "C:\Program Files\nodejs"
if (Test-Path $nodePath) { $env:Path = "$nodePath;$env:Path" }

Write-Host "NABZ-AI baslatiliyor..." -ForegroundColor Cyan
Write-Host "Klasor: $projectPath`n" -ForegroundColor Gray

# Sunucuyu yeni pencerede baslat
Start-Process -FilePath "cmd.exe" -ArgumentList '/k', "npm run dev" -WorkingDirectory $projectPath -WindowStyle Normal

# Sunucu hazir olana kadar bekle (en fazla 90 saniye)
Write-Host "Sunucu hazir olana kadar bekleniyor..."
$maxWait = 90
$waited = 0
while ($waited -lt $maxWait) {
  Start-Sleep -Seconds 2
  $waited += 2
  try {
    $r = Invoke-WebRequest -Uri "http://127.0.0.1:3000" -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop
    Write-Host "Sunucu hazir ($waited saniye). Tarayici aciliyor..." -ForegroundColor Green
    break
  } catch {
    Write-Host "  ... $waited sn" -ForegroundColor Gray
  }
}
if ($waited -ge $maxWait) {
  Write-Host "UYARI: Sunucu $maxWait sn icinde yanit vermedi. Tarayici yine de aciliyor." -ForegroundColor Yellow
}

Start-Process "http://127.0.0.1:3000"
Write-Host "`nTarayici acildi. Sunucu penceresini kapatmayin." -ForegroundColor Green
Write-Host "Devam etmek icin bir tusa basin..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
