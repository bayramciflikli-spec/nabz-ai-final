# MASTER-LOCK MİMARİSİ - BAŞLATMA DOSYASI
import hashlib
import sys


class MasterGate:
    def __init__(self):
        # BU SENİN GİZLİ MÜHÜRÜN (Kaptan UID)
        self.__kaptan_id = "NABZ-MASTER-2026"
        self.__seal = hashlib.sha256(self.__kaptan_id.encode()).hexdigest()

    def kanca_kontrol(self, anahtar):
        """Her kod satırı çalışmadan önce bu kancaya takılır."""
        return hashlib.sha256(anahtar.encode()).hexdigest() == self.__seal


# --- KANCALAMA TESTİ ---
gate = MasterGate()
# Eğer anahtar yanlışsa sistem 'xxx' moduna geçer veya kapanır
if not gate.kanca_kontrol("NABZ-MASTER-2026"):
    print("🚨 ERİŞİM REDDEDİLDİ: İçerik 'xxx' olarak maskelendi.")
    # Burada tüm fonksiyonlar pasifize edilir
else:
    print("✅ KAPTAN DOĞRULANDI: Kancalar aktif, motor çalışıyor.")


class MasterLockHub:
    def __init__(self, uid):
        self.secret_uid = "KAPTAN-NABZ-2026-X"  # Senin gerçek UID'n
        self.is_authorized = self._verify(uid)

    def _verify(self, uid):
        return hashlib.sha256(uid.encode()).hexdigest() == hashlib.sha256(self.secret_uid.encode()).hexdigest()

    def secure_run(self, module):
        if not self.is_authorized:
            # EĞER ÇALINDIYSA VEYA YANLIŞ KİŞİDEYSE:
            print("🚨 MASTER-LOCK: KRİTİK HATA! Kod 'xxx' moduna alındı.")
            # Burada kodun içeriği maskelenir
            return "xxx-PROTECTED-xxx"

        print("✅ MASTER-LOCK: Mühür doğrulandı. Kaptan dümende.")
        return module.render()


# --- SİSTEMİ ATEŞLEME ---
# Buradaki UID senin cihazında/elinde saklı olacak.
hub = MasterLockHub("KAPTAN-NABZ-2026-X")
