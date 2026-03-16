# Admin modülü (dosya bazında ayrı)

Kontrol Kulesi ile ilgili **sadece admin** kodları bu klasörde. Uygulama aynı (tek Next.js, tek deploy); sadece dosya yapısı ayrı.

- **`admin/components/`** – AdminShell, AdminDeviceVerify vb.
- **`admin/lib/`** – adminDevice (cihaz kimliği) vb.

Sayfa ve API route’ları hâlâ `app/admin/` ve `app/api/admin/` altında; buradakiler sadece admin’e özel bileşen ve yardımcılar.

Import örneği: `import { AdminShell } from "@/admin/components/AdminShell"`
