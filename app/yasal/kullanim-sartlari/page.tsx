"use client";

import Link from "next/link";
import { Sidebar } from "@/components/Sidebar";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, type User } from "firebase/auth";
import { useEffect, useState } from "react";

export default function KullanimSartlariPage() {
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
        <h1 className="text-2xl font-bold mb-6">NABZ-AI Kullanım Şartları</h1>
        <p className="text-sm text-white/60 mb-6">Son güncelleme: Şubat 2026</p>

        <div className="prose prose-invert prose-sm max-w-none space-y-6 text-white/90">
          <section>
            <h2 className="text-lg font-semibold text-white mb-2">1. Genel</h2>
            <p>
              NABZ-AI platformunu kullanarak bu Kullanım Şartlarını kabul etmiş sayılırsınız. Platform, AI tabanlı
              içerik paylaşım hizmeti sunmaktadır. Hizmetlere erişim ve kullanım, bu şartlara tabidir.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">2. Hizmet Tanımı</h2>
            <p>
              NABZ-AI, kullanıcıların AI ile oluşturdukları videoları, müzikleri ve görselleri paylaşmalarına olanak
              tanıyan bir platformdur. Platform, içerik barındırma ve dağıtım imkânı sağlar.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">3. Kullanıcı Sorumlulukları</h2>
            <p>Kullanıcılar aşağıdakileri kabul ve taahhüt eder:</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Paylaştıkları içeriklerin telif haklarına uygun olduğundan veya ticari kullanım hakkına sahip olduklarından sorumludur.</li>
              <li>18+, küfür, hakaret, kumar, uyuşturucu teşviki, dini/milli değerlere hakaret ve ahlaki/etik olmayan içerik paylaşmayacaktır.</li>
              <li>Platformu yasadışı faaliyetler için kullanmayacaktır.</li>
              <li>Hesap bilgilerini güvenli tutacak ve yetkisiz erişime izin vermeyecektir.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">4. Sorumluluk Reddi</h2>
            <p>
              <strong>NABZ-AI, kullanıcılar tarafından paylaşılan içeriklerden sorumlu değildir.</strong> İçeriklerin
              telif hakları, doğruluğu ve yasallığı tamamen kullanıcının sorumluluğundadır. Platform, 5651 sayılı
              Kanun kapsamında içerik sağlayıcı konumundadır; kullanıcı içeriklerinden platform önceden haberdar
              değildir. İhlal bildirimi yapıldığında içerik kaldırılacak ve ilgili kullanıcı hakkında işlem
              yapılabilecektir.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">5. Hesap Askıya Alma ve Engelleme</h2>
            <p>
              Kurallara uymayan kullanıcılar uyarı yapılmaksızın engellenebilir. Spam, sahte hesaplar, yanıltıcı
              içerik ve diğer ihlaller platform yönetiminin takdirinde hesap askıya alma veya kalıcı engelleme
              ile sonuçlanabilir.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">6. Fikri Mülkiyet</h2>
            <p>
              Platformun logosu, markası ve arayüzü NABZ-AI&apos;a aittir. Kullanıcılar, paylaştıkları içeriklerin
              telif haklarını platforma devretmez; ancak yayınlama, gösterim ve dağıtım için sınırlı lisans verir.
            </p>
            <Link href="/yasal/fikri-mulkiyet" className="text-cyan-400 hover:underline text-sm inline-block mt-2">
              Fikri Mülkiyet ve Telif Hakları (IP Rights) detayları →
            </Link>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">7. Değişiklikler</h2>
            <p>
              NABZ-AI, bu şartları önceden bildirimde bulunmaksızın değiştirme hakkını saklı tutar. Değişiklikler
              yayımlandığı anda yürürlüğe girer. Kullanıma devam etmek, güncel şartları kabul anlamına gelir.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">8. Uygulanacak Hukuk</h2>
            <p>
              Bu şartlar Türkiye Cumhuriyeti kanunlarına tabidir. Uyuşmazlıklarda İstanbul Mahkemeleri ve İcra
              Daireleri yetkilidir.
            </p>
          </section>
        </div>

        <div className="mt-10 flex flex-wrap gap-4">
          <Link href="/yasal/fikri-mulkiyet" className="text-cyan-400 hover:underline text-sm">
            Fikri Mülkiyet ve Telif Hakları
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
