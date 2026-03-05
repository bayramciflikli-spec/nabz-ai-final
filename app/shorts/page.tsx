"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, type User } from "firebase/auth";
import { fetchShortsFeed, setShortsFeedToStorage } from "@/lib/contentDiscovery";
import type { DiscoverProject } from "@/lib/contentDiscovery";
import { LoadingPulse } from "@/components/LoadingPulse";

export default function ShortsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [shorts, setShorts] = useState<DiscoverProject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, setUser);
    return () => unsub();
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const list = await fetchShortsFeed(30);
        setShorts(list);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const openShort = (short: DiscoverProject, index: number) => {
    const ids = shorts.map((s) => s.id);
    setShortsFeedToStorage(ids);
    router.push(`/shorts/${short.id}`);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-black text-white items-center justify-center">
        <LoadingPulse />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-black text-white">
      <div className="hidden sm:block">
        <Sidebar user={user} />
      </div>
      <div className="flex-1 min-w-0 sm:ml-56 flex flex-col overflow-hidden">
        <h1 className="text-2xl font-bold px-6 pt-6 pb-2 shrink-0">Shorts</h1>
        <div className="flex-1 overflow-hidden">
          {shorts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <p className="text-lg">Henüz short yok</p>
              <p className="text-sm mt-2">Video yükleyerek başlayın</p>
              <Link href="/upload" className="mt-4 px-6 py-2 bg-red-600 hover:bg-red-500 rounded-full font-semibold">
                Yükle
              </Link>
            </div>
          ) : (
            <div className="flex flex-row flex-nowrap animate-video-slide gap-6 pt-4 pb-6 pl-6">
              {shorts.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => openShort(s, i)}
                  className="group cursor-pointer flex-shrink-0 w-44 min-w-44 max-w-44 text-left"
                >
                  <div className="w-full aspect-[9/16] bg-white/5 border border-white/10 rounded-lg mb-2 group-hover:border-red-500/30 transition-colors overflow-hidden">
                    {s.imageUrl || s.videoUrl ? (
                      <img
                        src={s.imageUrl || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400"}
                        alt={s.title}
                        className="w-full h-full object-cover"
                      />
                    ) : null}
                  </div>
                  <p className="font-semibold text-sm truncate">{s.title}</p>
                  <p className="text-xs text-gray-500 mt-1 truncate">{s.authorName || "NABZ-AI"}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
