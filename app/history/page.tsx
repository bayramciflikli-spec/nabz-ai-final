"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { auth } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { onAuthStateChanged, type User } from "firebase/auth";
import { Sidebar } from "@/components/Sidebar";
import { VideoCard } from "@/components/VideoCard";

export default function HistoryPage() {
  const [user, setUser] = useState<User | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [projects, setProjects] = useState<Record<string, any>>({});

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, setUser);
    return () => unsub();
  }, []);

  useEffect(() => {
    const load = async () => {
      if (!user?.uid) {
        setHistory([]);
        return;
      }
      const userRef = doc(db, "users", user.uid);
      const snap = await getDoc(userRef);
      const watchHistory = (snap.data()?.watchHistory as Array<{ projectId: string; at: string; title?: string; imageUrl?: string; authorName?: string }>) || [];
      setHistory(watchHistory);

      const ids = watchHistory.map((h) => h.projectId);
      const projMap: Record<string, any> = {};
      for (const h of watchHistory) {
        const pRef = doc(db, "projects", h.projectId);
        const pSnap = await getDoc(pRef);
        if (pSnap.exists()) {
          projMap[h.projectId] = { id: pSnap.id, ...pSnap.data() };
        }
      }
      setProjects(projMap);
    };
    load();
  }, [user?.uid]);

  if (!user) {
    return (
      <div className="flex min-h-screen bg-black text-white">
        <div className="hidden sm:block"><Sidebar user={null} /></div>
        <main className="flex-1 sm:ml-56 flex flex-col items-center justify-center p-8">
          <p className="text-gray-500 mb-4">Geçmişi görmek için giriş yapın.</p>
          <Link href="/" className="text-cyan-400 hover:underline">Ana Sayfa</Link>
        </main>
      </div>
    );
  }

  const items = history
    .map((h) => ({ ...h, project: projects[h.projectId] }))
    .filter((h) => h.project);

  return (
    <div className="flex min-h-screen bg-[#0F0F0F] text-white">
      <div className="hidden sm:block">
        <Sidebar user={user} />
      </div>
      <main className="flex-1 sm:ml-56 p-6 md:p-8">
        <h1 className="text-2xl font-bold mb-6">İzleme Geçmişi</h1>
        {items.length === 0 ? (
          <p className="text-gray-500">Henüz izlediğiniz içerik yok.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {items.map((h) => (
              <VideoCard
                key={h.projectId}
                video={{
                  id: h.projectId,
                  title: h.project.title || "İsimsiz",
                  imageUrl: h.project.imageUrl,
                  videoUrl: h.project.videoUrl,
                  authorImage: h.project.authorImage,
                  authorName: h.project.authorName || h.project.tool,
                  views: String(h.project.likedBy?.length ?? 0),
                  tags: [h.project.tool].filter(Boolean),
                }}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
