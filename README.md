# Proje Portföyü (Firebase + Next.js)

## 3 adım (tek seferde)

**`3-adim.bat`** dosyasına çift tıklayın. Sırayla:
1. **.env.local** – Zaten oluşturuldu; Firebase Console'dan değerleri kopyalayıp `.env.local` içine yapıştırın.
2. **npm install** – Bağımlılıkları yükler.
3. **Firestore index** – İsteğe bağlı; script içindeki komutları kendi terminalinizde çalıştırın.
4. **npm run dev** – Sunucuyu başlatır.

## Manuel

1. `cd c:\Users\Yumi4\.cursor`
2. `.env.local` dosyasını açıp Firebase değerlerini doldurun (Proje ayarları → Genel).
3. `npm install`
4. `npm run dev`
5. Tarayıcı: http://localhost:3000 ve http://localhost:3000/upload

## Python / NABZ yerel API (isteğe bağlı)

Flask ile yerel bir NABZ API köprüsü çalıştırmak için:

1. `pip install -r scripts/requirements.txt`
2. `.env.local` içine `NABZ_API_KEY` (ve isteğe bağlı `NABZ_API_URL`) ekleyin
3. **NABZ-Flask.bat** çift tıklayın veya `python scripts/nabz_local_server.py`  
   → http://127.0.0.1:5050/islem (POST) NABZ'e iletir.  
Port 5050 doluysa **5050-kapat.bat** kullanın. Ayrıntı: **scripts/README.md**

## PowerShell script hatası

```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```
