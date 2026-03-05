# localhost Erişim Sorunu Çözümleri

## 0. EPERM (spawn) Hatası Alıyorsanız
`Error: spawn EPERM` veya `code: 'EPERM'` görüyorsanız:
1. `.next` klasörünü silin (veya `npm run dev:clean` kullanın)
2. **Turbopack yerine Webpack deneyin:** `npm run dev:webpack` (Next.js 16 Turbopack Windows'ta EPERM verebiliyor)
3. **`npm run dev:127`** kullanın (0.0.0.0 yerine 127.0.0.1)
4. Hâlâ olmuyorsa: CMD'yi **Yönetici olarak** açıp `calistir-127.bat` çalıştırın

## 1. 127.0.0.1 Kullanın
`localhost` çalışmıyorsa tarayıcıda şunu deneyin:
```
http://127.0.0.1:3000
```

## 2. Ağ IP'si ile Deneyin
Sunucu başladığında terminalde "Network: http://192.168.x.x:3000" görünür. Bu adresi kullanın.

## 3. Farklı Port
Port 3000 engelliyse:
```bash
npm run dev:3001
```
Sonra: http://127.0.0.1:3001

## 4. EPERM Hatası Alıyorsanız
- Tüm Node/Next.js süreçlerini kapatın (Ctrl+C)
- `.next` klasörünü silin
- Yeniden başlatın:
```bash
npm run dev:clean
```

## 5. Yönetici Olarak Çalıştırın
PowerShell veya CMD'yi **Yönetici olarak** açıp `npm run dev` çalıştırın.

## 6. Antivirüs / Firewall
Windows Defender veya antivirüs localhost'u engelliyor olabilir. Geçici olarak devre dışı bırakın veya proje klasörünü istisnaya ekleyin.
- **Proje klasörünü istisnaya ekleyin:** Windows Güvenlik → Virüs ve tehdit koruması → Ayarlar → İstisnalar → Klasör ekle → `C:\Users\Yumi4\.cursor` seçin

## 7. hosts Dosyası
`C:\Windows\System32\drivers\etc\hosts` dosyasında localhost tanımlı mı kontrol edin:
```
127.0.0.1       localhost
```
