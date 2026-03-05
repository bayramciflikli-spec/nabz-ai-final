"use client";

import Link from "next/link";
import { Sidebar } from "@/components/Sidebar";
import { LEGAL_EMAIL } from "@/lib/legalContact";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, type User } from "firebase/auth";
import { useEffect, useState } from "react";

export default function FikriMulkiyetPage() {
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
        <h1 className="text-2xl font-bold mb-6">Fikri Mülkiyet ve Telif Hakları (IP Rights)</h1>
        <p className="text-sm text-white/60 mb-6">
          5846 sayılı Fikir ve Sanat Eserleri Kanunu ve ilgili uluslararası sözleşmeler kapsamında
        </p>

        <div className="prose prose-invert prose-sm max-w-none space-y-6 text-white/90">
          <section>
            <h2 className="text-lg font-semibold text-white mb-2">1. Platformun Fikri Mülkiyet Hakları</h2>
            <p>
              NABZ-AI logosu, markası, arayüzü, yazılımı ve platforma özgü tüm tasarım unsurları NABZ-AI&apos;a
              aittir. Bu unsurların izinsiz kopyalanması, çoğaltılması veya ticari kullanımı yasaktır.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">2. Kullanıcı İçeriklerinin Sahipliği</h2>
            <p>
              Kullanıcılar, paylaştıkları içeriklerin (görsel, video, müzik, metin vb.) telif haklarını
              platforma devretmez. İçerik sahipliği paylaşan kullanıcıya aittir.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">3. Lisans Verimi</h2>
            <p>
              Platformda içerik paylaşarak, NABZ-AI&apos;a aşağıdaki sınırlı lisansları verirsiniz:
            </p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>İçeriğin platformda yayınlanması, gösterilmesi ve dağıtılması</li>
              <li>Hizmet sunumu için teknik işleme (sıkıştırma, format dönüşümü vb.)</li>
              <li>Derlenmiş içeriklerde (ör. kanallar, listeler) görüntülenmesi</li>
            </ul>
            <p className="mt-2">
              Bu lisans, platform kullanımıyla sınırlıdır ve içeriğinizi başka platformlarda kullanma
              hakkı vermez.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">4. Telif Uyumluluğu ve Sorumluluk</h2>
            <p>
              Telifli müzik, video veya diğer içerik paylaşımı tamamen kendi sorumluluğunuzdadır. NABZ-AI bu
              içeriklerden dolayı sorumlu değildir. Paylaştığınız içeriklerin:
            </p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Orijinal veya lisanslı olduğundan,</li>
              <li>Üçüncü kişilerin haklarını ihlal etmediğinden</li>
            </ul>
            <p className="mt-2">
              emin olmanız gerekmektedir. İhlal tespit edildiğinde içerik kaldırılabilir ve hesabınız
              yaptırıma tabi tutulabilir.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">5. Telif Kontrolü</h2>
            <p>
              NABZ-AI, yüklenen içerikleri web ve uygulama üzerinden telif kontrolünden geçirir. Bu
              kontroller otomatik veya manuel olarak yapılabilir. İhlal tespit edilirse içerik onaylanmaz
              veya kaldırılır.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">6. Telif İhlali Bildirimi (DMCA / Uyarılar)</h2>
            <p>
              Telif hakkınızın ihlal edildiğini düşünüyorsanız bize bildirimde bulunabilirsiniz. Bildirim
              aşağıdaki bilgileri içermelidir:
            </p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>İhlal edildiğini iddia ettiğiniz eserin tanımı</li>
              <li>İhlal içeriğinin platformdaki konumu (URL vb.)</li>
              <li>İletişim bilgileriniz</li>
              <li>Telif sahibi olduğunuza dair beyan veya yetkili olduğunuza dair açıklama</li>
            </ul>
            <p className="mt-2">
              Geçerli bildirimler değerlendirilerek gerekli işlemler yapılacaktır. Bildirim için{" "}
              <a href={`mailto:${LEGAL_EMAIL}`} className="text-cyan-400 hover:underline">
                {LEGAL_EMAIL}
              </a>{" "}
              adresine e-posta gönderebilir veya{" "}
              <Link href="/yasal/dmca-bildirim" className="text-cyan-400 hover:underline">
                DMCA bildirim formu
              </Link>{" "}
              kullanabilirsiniz.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">7. Yaptırımlar</h2>
            <p>
              Tekrarlayan veya ağır telif ihlallerinde hesap cezalandırılabilir, askıya alınabilir veya
              kalıcı olarak engellenebilir. Türkiye Cumhuriyeti kanunları ve ilgili uluslararası
              sözleşmeler çerçevesinde hukuki işlemler başlatılabilir.
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
          <Link href="/yasal/kvkk" className="text-cyan-400 hover:underline text-sm">
            KVKK Aydınlatma Metni
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
