"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, type User } from "firebase/auth";
import { Sidebar } from "@/components/Sidebar";

export default function ModelsPage() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, setUser);
    return () => unsub();
  }, []);

  return (
    <div className="flex min-h-screen bg-[#0F0F0F] text-white">
      <div className="hidden sm:block">
        <Sidebar user={user} />
      </div>
      <main className="flex-1 sm:ml-56 flex flex-col items-center justify-center p-8">
        <h1 className="text-3xl font-black mb-4">Modellerim</h1>
        <p className="text-gray-400 mb-6">Bu özellik yakında eklenecek.</p>
        <Link href="/" className="text-cyan-400 hover:underline">
          Ana Sayfaya Dön
        </Link>
      </main>
    </div>
  );
}
