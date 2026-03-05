# Proje klasorune git
Set-Location $PSScriptRoot

Write-Host "Bagimliliklari yukleniyor..." -ForegroundColor Cyan
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "npm install basarisiz. Internet baglantinizi kontrol edin." -ForegroundColor Red
    Read-Host "Cikmak icin Enter'a basin"
    exit 1
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host " Sunucu baslatiliyor..." -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Tarayicida ac: http://127.0.0.1:3000" -ForegroundColor White
Write-Host " veya:          http://localhost:3000" -ForegroundColor White
Write-Host " localhost calismazsa 127.0.0.1 deneyin" -ForegroundColor Yellow
Write-Host " Durdurmak icin Ctrl+C`n" -ForegroundColor Yellow
npm run dev
