# Localhost nasıl açılır

1. **Terminal açın** (Cursor içinde: Terminal → New Terminal veya `Ctrl+`` `).

2. **Proje klasörüne gidin:**
   ```powershell
   cd c:\Users\Yumi4\.cursor
   ```

3. **Bağımlılıklar yüklü değilse:**
   ```powershell
   npm install
   ```

4. **Geliştirme sunucusunu başlatın:**
   ```powershell
   npm run dev
   ```
   Çıktıda `Ready on http://0.0.0.0:3000` veya benzeri bir satır görene kadar bekleyin.

5. **Tarayıcıda açın:**
   - http://localhost:3000
   - veya http://127.0.0.1:3000

**Açılmıyorsa kontrol edin:**
- Port 3000 başka bir program tarafından kullanılıyor olabilir. Farklı port için: `npm run dev:3001` → http://localhost:3001
- PowerShell script hatası: `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned`
- Firewall localhost’u engelliyor olabilir.
