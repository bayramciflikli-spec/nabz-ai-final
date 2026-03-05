"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { auth } from "@/lib/firebase";
import { collection, query, where, limit, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { onAuthStateChanged, type User } from "firebase/auth";
import { Sidebar } from "@/components/Sidebar";
import { VideoCard } from "@/components/VideoCard";

export default function LikedPage() {
  const [user, setUser] = useState<User | null>(null);
  const [videos, setVideos] = useState<any[]>([]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, setUser);
    return () => unsub();
  }, []);

  useEffect(() => {
    const load = async () => {
      if (!user?.uid) {
        setVideos([]);
        return;
      }
      const q = query(
        collection(db, "projects"),
        where("likedBy", "array-contains", user.uid),
        limit(100)
      );
      const snap = await getDocs(q);
      setVideos(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    };
    load();
  }, [user?.uid]);

  if (!user) {
    return (
      <div className="flex min-h-screen bg-black text-white">
        <div className="hidden sm:block"><Sidebar user={null} /></div>
        <main className="flex-1 sm:ml-56 flex flex-col items-center justify-center p-8">
          <p className="text-gray-500 mb-4">Beğendiğiniz videoları görmek için giriş yapın.</p>
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
        <h1 className="text-2xl font-bold mb-6">Beğendiğim Videolar</h1>
        {videos.length === 0 ? (
          <p className="text-gray-500">Henüz beğendiğiniz video yok.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {videos.map((v) => (
              <VideoCard
                key={v.id}
                video={{
                  id: v.id,
                  title: v.title || "İsimsiz",
                  imageUrl: v.imageUrl,
                  videoUrl: v.videoUrl,
                  authorImage: v.authorImage,
                  authorName: v.authorName || v.tool,
                  views: String(v.likedBy?.length ?? 0),
                  tags: [v.tool].filter(Boolean),
                }}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
