"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, type User } from "firebase/auth";
import { Sidebar } from "@/components/Sidebar";
import { getMyReports } from "@/lib/reports";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

const REASON_LABELS: Record<string, string> = {
  spam: "Spam",
  uygunsuz: "Uygunsuz içerik",
  telif: "Telif ihlali",
  nefret: "Nefret söylemi",
  şiddet: "Şiddet içeriği",
  diger: "Diğer",
};

export default function ReportsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [reports, setReports] = useState<any[]>([]);
  const [projects, setProjects] = useState<Record<string, any>>({});

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, setUser);
    return () => unsub();
  }, []);

  useEffect(() => {
    const load = async () => {
      if (!user?.uid) {
        setReports([]);
        return;
      }
      const list = await getMyReports(user.uid);
      setReports(list);

      const map: Record<string, any> = {};
      for (const r of list) {
        const pRef = doc(db, "projects", r.projectId);
        const snap = await getDoc(pRef);
        if (snap.exists()) map[r.projectId] = { id: snap.id, ...snap.data() };
      }
      setProjects(map);
    };
    load();
  }, [user?.uid]);

  if (!user) {
    return (
      <div className="flex min-h-screen bg-black text-white">
        <div className="hidden sm:block"><Sidebar user={null} /></div>
        <main className="flex-1 sm:ml-56 flex flex-col items-center justify-center p-8">
          <p className="text-gray-500 mb-4">Bildirim geçmişinizi görmek için giriş yapın.</p>
          <Link href="/" className="text-cyan-400 hover:underline">Ana Sayfa</Link>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#0F0F0F] text-white">
      <div className="hidden sm:block">
        <Sidebar user={user} />
      </div>
      <main className="flex-1 sm:ml-56 p-6 md:p-8">
        <h1 className="text-2xl font-bold mb-6">İçerik Bildirme Geçmişi</h1>
        {reports.length === 0 ? (
          <p className="text-gray-500">Henüz içerik bildiriminiz yok.</p>
        ) : (
          <div className="space-y-4">
            {reports.map((r) => (
              <div key={r.id} className="flex gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
                <Link href={`/project/${r.projectId}`} className="flex-shrink-0">
                  <img
                    src={projects[r.projectId]?.imageUrl || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200"}
                    alt=""
                    className="w-24 h-14 object-cover rounded-lg"
                  />
                </Link>
                <div className="flex-1 min-w-0">
                  <Link href={`/project/${r.projectId}`} className="font-medium hover:text-red-400 truncate block">
                    {projects[r.projectId]?.title || "İçerik kaldırılmış"}
                  </Link>
                  <p className="text-sm text-gray-500 mt-1">
                    Sebep: {REASON_LABELS[r.reason] || r.reason}
                    {r.detail && ` — ${r.detail}`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
