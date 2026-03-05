"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, type User } from "firebase/auth";
import { Sidebar } from "@/components/Sidebar";

export default function FeedbackPage() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, setUser);
    return () => unsub();
  }, []);

  return (
    <div className="flex min-h-screen bg-black text-white">
      <div className="hidden sm:block">
        <Sidebar user={user} />
      </div>
      <main className="flex-1 sm:ml-56 flex flex-col items-center justify-center p-8">
        <h1 className="text-2xl font-bold mb-4">Geri bildirim gönder</h1>
        <p className="text-gray-500">Bu özellik yakında eklenecek.</p>
      </main>
    </div>
  );
}
