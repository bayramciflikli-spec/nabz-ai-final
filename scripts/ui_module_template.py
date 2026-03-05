# MÜHENDİSE VERİLEN ŞABLON — Sadece bu dosyayı düzenleyin.
# Merkez (MasterHub) kaptan tarafından sağlanır; burada sadece hub'a istek atarsınız.


class UIModule:
    """Arayüz modülü: Tüm hassas işlemler merkeze (master_hub) istek ile yapılır."""

    def __init__(self, master_hub):
        self.hub = master_hub  # Kaptanın ana merkezine bağlanma noktası

    def login_button_clicked(self):
        # Mühendis burada sadece merkeze veri gönderir
        username = "Kaptan"
        print("UI: Veri merkeze gönderiliyor...")

        # Merkeze (Kaptan'ın gizli koduna) sesleniyor:
        response = self.hub.request_action("VERIFY_SUBSCRIPTION", username)

        if response == "SUCCESS":
            print("UI: Giriş Başarılı! Renkleri Yeşile Döndür.")
        else:
            print("UI: Giriş reddedildi veya abonelik yok.")
