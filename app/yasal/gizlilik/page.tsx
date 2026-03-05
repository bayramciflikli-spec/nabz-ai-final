"use client";

import Link from "next/link";
import { Sidebar } from "@/components/Sidebar";
import { LEGAL_EMAIL } from "@/lib/legalContact";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, type User } from "firebase/auth";
import { useEffect, useState } from "react";

export default function GizlilikPage() {
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
        <h1 className="text-2xl font-bold mb-6">NABZ-AI Gizlilik Politikası</h1>
        <p className="text-sm text-white/60 mb-6">Son güncelleme: Şubat 2026</p>

        <div className="prose prose-invert prose-sm max-w-none space-y-6 text-white/90">
          <section>
            <h2 className="text-lg font-semibold text-white mb-2">1. Toplanan Veriler</h2>
            <p>
              NABZ-AI, hizmet sunumu için aşağıdaki kişisel verileri toplayabilir: e-posta adresi, ad-soyad,
              profil fotoğrafı, giriş sağlayıcı bilgileri (Google, Yahoo, Microsoft), paylaşılan içerikler ve
              kullanım verileri.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">2. Veri Kullanım Amaçları</h2>
            <p>Toplanan veriler şu amaçlarla kullanılır:</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Hesap oluşturma ve kimlik doğrulama</li>
              <li>İçerik paylaşımı ve platform işlevselliği</li>
              <li>Kullanıcı deneyimini iyileştirme</li>
              <li>Yasal yükümlülüklerin yerine getirilmesi</li>
              <li>İhlal bildirimleri ve güvenlik</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">3. Veri Saklama ve Güvenlik</h2>
            <p>
              Verileriniz güvenli sunucularda saklanır. Şifreler şifrelenmiş olarak tutulur. Üçüncü taraflarla
              veri paylaşımı yalnızca hizmet sağlayıcılar (ör. Firebase) ile sınırlıdır ve sözleşmelerle
              korunmaktadır.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">4. Çerezler</h2>
            <p>
              Platform, oturum yönetimi ve tercihler için çerez kullanabilir. Zorunlu çerezler hizmet
              sunumu için gereklidir; isteğe bağlı çerezler kullanıcı onayına tabidir.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">5. Haklarınız</h2>
            <p>
              KVKK kapsamında verilerinize erişim, düzeltme, silme ve işleme itirazı haklarınız bulunmaktadır.
              Talepleriniz için{" "}
              <a href={`mailto:${LEGAL_EMAIL}`} className="text-cyan-400 hover:underline">
                {LEGAL_EMAIL}
              </a>{" "}
              adresinden bizimle iletişime geçebilirsiniz.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">6. Değişiklikler</h2>
            <p>
              Gizlilik politikası güncellendiğinde bu sayfa üzerinden bilgilendirileceksiniz. Önemli
              değişikliklerde e-posta ile bildirim yapılabilir.
            </p>
          </section>
        </div>

        <div className="mt-10 flex flex-wrap gap-4">
          <Link href="/yasal/kullanim-sartlari" className="text-cyan-400 hover:underline text-sm">
            Kullanım Şartları
          </Link>
          <Link href="/yasal/kvkk" className="text-cyan-400 hover:underline text-sm">
            KVKK Aydınlatma Metni
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
