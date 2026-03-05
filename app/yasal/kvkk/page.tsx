"use client";

import Link from "next/link";
import { Sidebar } from "@/components/Sidebar";
import { LEGAL_EMAIL } from "@/lib/legalContact";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, type User } from "firebase/auth";
import { useEffect, useState } from "react";

export default function KVKKPage() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, setUser);
    return () => unsub();
  }, []);

  return (
    <div className="flex min-h-screen bg-[#050505] text-white">
      <div className="hidden sm:block">
        <Sidebar user={user} />
      </div>
      <div className="flex-1 sm:ml-56 p-8 max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">KVKK Aydınlatma Metni</h1>
        <p className="text-sm text-white/60 mb-6">6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında</p>

        <div className="prose prose-invert prose-sm max-w-none space-y-6 text-white/90">
          <section>
            <h2 className="text-lg font-semibold text-white mb-2">1. Veri Sorumlusu</h2>
            <p>
              Kişisel verileriniz, 6698 sayılı Kanun uyarınca veri sorumlusu sıfatıyla NABZ-AI tarafından
              işlenmektedir.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">2. İşlenen Kişisel Veriler</h2>
            <p>Aşağıdaki kişisel verileriniz işlenebilmektedir:</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li><strong>Kimlik:</strong> Ad, soyad</li>
              <li><strong>İletişim:</strong> E-posta adresi</li>
              <li><strong>Görsel:</strong> Profil fotoğrafı</li>
              <li><strong>İşlem güvenliği:</strong> IP adresi, oturum bilgileri</li>
              <li><strong>İçerik:</strong> Paylaşılan videolar, müzikler, görseller ve ilgili meta veriler</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">3. İşleme Amaçları ve Hukuki Sebepleri</h2>
            <p>
              Verileriniz; hizmet sunumu, sözleşmenin ifası, yasal yükümlülükler ve meşru menfaat
              kapsamında işlenmektedir. Açık rızanız gerektiren işlemler için ayrıca onay alınacaktır.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">4. Veri Aktarımı</h2>
            <p>
              Verileriniz, hizmet sağlayıcılar (barındırma, kimlik doğrulama vb.) ile sınırlı olarak
              paylaşılabilir. Yurt dışı aktarımda gerekli güvenlik tedbirleri alınmaktadır.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">5. Saklama Süresi</h2>
            <p>
              Kişisel verileriniz, işleme amacının gerektirdiği süre boyunca saklanır. Yasal süreler
              dolduğunda veya talebiniz üzerine silinir veya anonim hale getirilir.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">6. Haklarınız</h2>
            <p>KVKK md. 11 uyarınca şu haklara sahipsiniz:</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme</li>
              <li>İşlenmişse buna ilişkin bilgi talep etme</li>
              <li>İşlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme</li>
              <li>Yurt içinde veya yurt dışında aktarıldığı üçüncü kişileri bilme</li>
              <li>Eksik veya yanlış işlenmişse düzeltilmesini isteme</li>
              <li>md. 7’deki şartlar çerçevesinde silinmesini veya yok edilmesini isteme</li>
              <li>Otomatik sistemler vasıtasıyla analiz edilmesi sonucu aleyhinize bir sonucun ortaya çıkmasına itiraz etme</li>
              <li>Kanuna aykırı işlenmesi sebebiyle zarara uğramanız halinde tazminat talep etme</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">7. Başvuru</h2>
            <p>
              Haklarınızı kullanmak için yazılı başvuru yapabilirsiniz. Talebiniz en geç 30 gün içinde
              değerlendirilerek sonuçlandırılacaktır. Başvuru için{" "}
              <a href={`mailto:${LEGAL_EMAIL}`} className="text-cyan-400 hover:underline">
                {LEGAL_EMAIL}
              </a>{" "}
              adresine e-posta gönderebilirsiniz.
            </p>
          </section>
        </div>

        <div className="mt-10 flex flex-wrap gap-4">
          <Link href="/yasal/kullanim-sartlari" className="text-cyan-400 hover:underline text-sm">
            Kullanım Şartları
          </Link>
          <Link href="/yasal/gizlilik" className="text-cyan-400 hover:underline text-sm">
            Gizlilik Politikası
          </Link>
          <Link href="/yasal/fikri-mulkiyet" className="text-cyan-400 hover:underline text-sm">
            Fikri Mülkiyet ve Telif Hakları
          </Link>
          <Link href="/yasal/reklam-politikasi" className="text-cyan-400 hover:underline text-sm">
            Reklam Politikası
          </Link>
          <Link href="/" className="text-white/50 hover:text-white text-sm">
            Ana Sayfa
          </Link>
        </div>
      </div>
    </div>
  );
}
