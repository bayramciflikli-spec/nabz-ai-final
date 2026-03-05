"use client";

import Link from "next/link";
import { Sidebar } from "@/components/Sidebar";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, type User } from "firebase/auth";
import { useEffect, useState } from "react";

export default function LGPDPage() {
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
        <h1 className="text-2xl font-bold mb-6">LGPD – Lei Geral de Proteção de Dados</h1>
        <p className="text-sm text-white/60 mb-6">Para residentes do Brasil – Lei nº 13.709/2018</p>

        <div className="prose prose-invert prose-sm max-w-none space-y-6 text-white/90">
          <section>
            <h2 className="text-lg font-semibold text-white mb-2">1. Seus Direitos</h2>
            <p>
              Nos termos da Lei Geral de Proteção de Dados (LGPD), os titulares têm direito a:
            </p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Confirmar a existência de tratamento de dados</li>
              <li>Acessar os dados pessoais</li>
              <li>Corrigir dados incompletos, inexatos ou desatualizados</li>
              <li>Anonimizar, bloquear ou eliminar dados desnecessários</li>
              <li>Portabilidade dos dados</li>
              <li>Revogar o consentimento</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">2. Informações que Coletamos</h2>
            <p>Podemos coletar: nome, e-mail, foto de perfil, endereço IP, dados de uso e conteúdo compartilhado.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">3. Como Exercer seus Direitos</h2>
            <p>
              Entre em contato conosco ou use as configurações da sua conta para solicitar acesso,
              correção ou exclusão. Responderemos em até 15 dias.
            </p>
          </section>
        </div>

        <div className="mt-8 flex flex-wrap gap-4 text-sm">
          <Link href="/yasal/kullanim-sartlari" className="text-cyan-400 hover:underline">
            Termos de Serviço
          </Link>
          <Link href="/yasal/gizlilik" className="text-cyan-400 hover:underline">
            Política de Privacidade
          </Link>
          <Link href="/yasal/fikri-mulkiyet" className="text-cyan-400 hover:underline">
            Direitos de Propriedade Intelectual
          </Link>
          <Link href="/yasal/reklam-politikasi" className="text-cyan-400 hover:underline">
            Política de Anúncios
          </Link>
          <Link href="/" className="text-white/50 hover:text-white">
            Início
          </Link>
        </div>
      </div>
    </div>
  );
}
