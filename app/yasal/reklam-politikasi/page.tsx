"use client";

import Link from "next/link";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, type User } from "firebase/auth";
import { useEffect, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { AD_POLICY } from "@/lib/adPolicy";

export default function ReklamPolitikasiPage() {
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
        <h1 className="text-2xl font-bold mb-6">NABZ-AI Reklam Politikası</h1>
        <p className="text-sm text-white/60 mb-6">Son güncelleme: Şubat 2026</p>

        <div className="prose prose-invert prose-sm max-w-none space-y-6 text-white/90">
          <section>
            <h2 className="text-lg font-semibold text-white mb-2">1. Genel İlke</h2>
            <p>
              NABZ-AI platformunda <strong>yalnızca etik ve ahlaki kurallarımıza uygun reklamlar</strong> gösterilir.
              Platformumuzda, bu politikaya aykırı hiçbir reklam anlaşması yapılmaz ve bu tür reklamlar asla
              kabul edilmez.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">2. Yasaklanan Reklam Kategorileri</h2>
            <p className="mb-3">
              Aşağıdaki kategorilerdeki reklamlar NABZ-AI tarafından <strong>kesinlikle reddedilir</strong> ve
              platformda gösterilmez:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-red-300/90">
              {AD_POLICY.blockedCategories.map((cat) => (
                <li key={cat}>{cat}</li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">3. Kabul Edilen Reklam Örnekleri</h2>
            <p className="mb-3">
              Etik ve ahlaki standartlarımıza uygun reklam kategorileri örnekleri:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-green-300/90">
              {AD_POLICY.allowedExamples.map((ex) => (
                <li key={ex}>{ex}</li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">4. Uygulama</h2>
            <p>
              Bu politikaya aykırı herhangi bir reklam tespit edildiğinde <strong>anında kaldırılır</strong> ve
              ilgili reklam anlaşması iptal edilir. NABZ-AI, reklam sağlayıcıları (örn. Google AdSense) ile
              çalışırken bu standartların uygulanmasını sağlar.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">5. Monetizasyon Başvurusu</h2>
            <p>
              Kanal monetizasyonu için başvuran kullanıcılar, bu Reklam Politikasını kabul etmekle yükümlüdür.
              Reklam geliri elde etmek isteyen kanal sahipleri, yalnızca bu politikaya uygun reklamların
              kanallarında gösterileceğini kabul eder.
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
          <Link href="/yasal/fikri-mulkiyet" className="text-cyan-400 hover:underline text-sm">
            Fikri Mülkiyet ve Telif Hakları
          </Link>
          <Link href="/" className="text-white/50 hover:text-white text-sm">
            Ana Sayfa
          </Link>
        </div>
      </div>
    </div>
  );
}
