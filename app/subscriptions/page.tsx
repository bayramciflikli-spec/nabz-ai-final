"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { db, auth } from "@/lib/firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { Sparkles, LayoutGrid, List } from "lucide-react";
import { VideoCard } from "@/components/VideoCard";
import { Sidebar } from "@/components/Sidebar";
import { useAuth } from "@/components/AuthProvider";

export default function SubscriptionsPage() {
  const { user } = useAuth();
  const [subscribedVideos, setSubscribedVideos] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  useEffect(() => {
    const fetchSubscribedContent = async () => {
      if (!auth.currentUser) {
        setSubscribedVideos([]);
        return;
      }

      // 1. Kullanıcının abone olduğu kanalları bul (following dizisi)
      const userRef = doc(db, "users", auth.currentUser.uid);
      const userSnap = await getDoc(userRef);
      const followingIds = userSnap.data()?.following || [];

      if (followingIds.length === 0) {
        setSubscribedVideos([]);
        return;
      }

      // Firestore "in" sorgusu max 10 değer kabul eder - gruplar halinde çek
      const chunkSize = 10;
      const allVideos: any[] = [];

      for (let i = 0; i < followingIds.length; i += chunkSize) {
        const idsToFetch = followingIds.slice(i, i + chunkSize);
        const vq = query(
          collection(db, "projects"),
          where("authorId", "in", idsToFetch),
          orderBy("createdAt", "desc")
        );
        const vSnap = await getDocs(vq);
        allVideos.push(
          ...vSnap.docs.map((d) => ({ id: d.id, ...d.data() }))
        );
      }

      // Tarihe göre sırala (en yeni en üstte)
      allVideos.sort((a, b) => {
        const aTime = a.createdAt?.toMillis?.() ?? a.createdAt ?? 0;
        const bTime = b.createdAt?.toMillis?.() ?? b.createdAt ?? 0;
        return bTime - aTime;
      });

      setSubscribedVideos(allVideos);
    };

    fetchSubscribedContent();
  }, [user?.uid]);

  if (!user) return null;

  return (
    <div className="flex min-h-screen bg-[#050505] text-white">
      <div className="hidden sm:block">
        <Sidebar user={user} />
      </div>
      <div className="flex-1 sm:ml-56 min-w-0 p-8">
      {/* BAŞLIK VE FİLTRELER */}
      <div className="flex justify-between items-center mb-10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-xl shadow-[0_0_15px_rgba(6,182,212,0.5)]">
            <Sparkles size={24} className="text-white" />
          </div>
          <h1 className="text-3xl font-black tracking-tighter">Abonelikler</h1>
        </div>

        <div className="flex bg-[#111] p-1 rounded-2xl border border-white/5">
          <button
            type="button"
            onClick={() => setViewMode("grid")}
            className={`p-2 rounded-xl transition ${
              viewMode === "grid" ? "bg-white/10 text-cyan-400" : "text-gray-500"
            }`}
          >
            <LayoutGrid size={20} />
          </button>
          <button
            type="button"
            onClick={() => setViewMode("list")}
            className={`p-2 rounded-xl transition ${
              viewMode === "list" ? "bg-white/10 text-cyan-400" : "text-gray-500"
            }`}
          >
            <List size={20} />
          </button>
        </div>
      </div>

      {/* VİDEO AKIŞI */}
      {subscribedVideos.length > 0 ? (
        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
              : "flex flex-col gap-6 max-w-4xl mx-auto"
          }
        >
          {subscribedVideos.map((video) => (
            <VideoCard
              key={video.id}
              video={{
                id: video.id,
                title: video.title,
                imageUrl: video.imageUrl,
                videoUrl: video.videoUrl,
                authorImage: video.authorImage,
                authorName: video.authorName || video.tool,
                views: video.viewCount ?? "2.4K",
                tags: [video.tool, video.category].filter(Boolean),
              }}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-gray-500">
          <p className="mb-4">Henüz abone olduğunuz kanal yok.</p>
          <Link href="/" className="text-cyan-400 hover:underline">
            Kanalları Keşfet →
          </Link>
        </div>
      )}
      </div>
    </div>
  );
}
