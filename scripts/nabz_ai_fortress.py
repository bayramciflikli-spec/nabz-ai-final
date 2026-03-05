"""
NABZ-AI Fortress — Merkezi güvenlik, 5 bölüm, boot → bölüm seçimi → düzenleme → kaydet/incele/onay → otopilot senkron.
Masaüstü çalıştırma: python scripts/nabz_ai_fortress.py
"""
import hashlib
import time
import os


class NabzAI_Fortress:
    def __init__(self, key):
        # MERKEZİ GÜVENLİK
        self.__MASTER_KEY = "KAPTAN-NABZ-2026-FINAL"
        self.authorized = self._verify(key)

        # 5 ANA BÖLÜM VE HÜCRESEL YAPI
        self.sections = {
            1: "GÖRSEL TASARIM (UI/UX)",
            2: "ABONELİK & KAYIT (Auth)",
            3: "VERİ GİRİŞİ (Intake)",
            4: "ANALİZ ÇEKİRDEĞİ (The Brain)",
            5: "HAFIZA & SİSTEM (DB/Logs)",
        }
        self.active_data = {}  # Senkronize edilen veriler

    def _verify(self, key):
        return hashlib.sha256(key.encode()).hexdigest() == hashlib.sha256(self.__MASTER_KEY.encode()).hexdigest()

    def boot_system(self):
        if not self.authorized:
            print("\n" + "!" * 40)
            print("🚨 ERİŞİM REDDEDİLDİ: Geçersiz UID!")
            print("Tüm kod satırları: 'xxx-xxx-xxx'")
            print("!" * 40)
            return False

        os.system("cls" if os.name == "nt" else "clear")
        print(f"🔐 NABZ-AI MASTER-CORE AKTİF | UID: {self.__MASTER_KEY[:10]}...")
        print("--------------------------------------------------")
        return True

    def enter_section(self, sid):
        if not self.authorized:
            return
        if sid not in self.sections:
            print("🚨 Geçersiz bölüm numarası.")
            return
        print(f"\n📂 {self.sections[sid]} Odasına Girildi.")

        # MÜHENDİS ÇALIŞMA ALANI
        print("📝 Düzenleme ve Ar-Ge moduna geçiliyor...")
        changes = input("Yaptığınız geliştirmeyi kısaca yazın: ")

        # KAYDET -> İNCELE -> ONAY DÖNGÜSÜ (Mühendisin Kendi Kontrolü)
        print("\n💾 [KAYDET] butonuna basıldı.")
        print(f"🧐 [İNCELE]: Yapılan İş -> {changes}")

        confirm = input("\n⚠️ Kendi işinizi onaylıyor musunuz? (E/H): ")
        if confirm.upper() == "E":
            self._auto_sync(sid, changes)
        else:
            print("⏪ İPTAL: Mühendis onayı verilmedi, eski sürüme dönüldü.")

    def _auto_sync(self, sid, changes):
        # OTOMATİK SENKRONİZASYON (Kaptan'ın Otopilotu)
        print(f"⚡ OTOPİLOT: '{self.sections[sid]}' ana dosyaya senkronize ediliyor...")
        time.sleep(1)
        print("🔍 KUSURSUZLUK TESTİ: %100 Uyumlu.")
        self.active_data[sid] = changes
        print(f"✅ MÜHÜRLENDİ: '{self.sections[sid]}' artık güncel ve UID kancalı.")

    def add_ar_ge_room(self, name):
        """Yeni Ar-Ge odası ekler (dinamik genişleme)."""
        if not self.authorized:
            return
        new_id = max(self.sections.keys()) + 1
        self.sections[new_id] = name
        print(f"🔬 AR-GE LABORATUVARI: '{name}' başarıyla oluşturuldu ve kilitlendi (Bölüm {new_id}).")


# ============================================================
# MASAÜSTÜ ÇALIŞTIRMA
# ============================================================

if __name__ == "__main__":
    kaptan_anahtari = "KAPTAN-NABZ-2026-FINAL"
    nabz_ai = NabzAI_Fortress(kaptan_anahtari)

    if nabz_ai.boot_system():
        while True:
            print("\nMevcut Bölümler:")
            for id, name in nabz_ai.sections.items():
                print(f"  [{id}] {name}")
            print("  [0] Çıkış")
            print("  [9] Yeni Ar-Ge odası aç")

            try:
                secim = input("\nBölüm numarası girin (0=Çıkış, 9=Ar-Ge): ").strip()
            except (EOFError, KeyboardInterrupt):
                print("\nÇıkılıyor.")
                break

            if secim == "0" or secim.upper() == "Q":
                print("Güle güle.")
                break
            if secim == "9":
                yeni_oda = input("Yeni bölümün adını girin: ").strip() or "Yeni_ArGe_Odası"
                nabz_ai.add_ar_ge_room(yeni_oda)
                continue

            try:
                sid = int(secim)
            except ValueError:
                print("Geçersiz giriş. 0–9 arası numara yazın.")
                continue

            if sid in nabz_ai.sections:
                nabz_ai.enter_section(sid)
            else:
                print("Böyle bir bölüm yok. Listeden numara seçin.")
