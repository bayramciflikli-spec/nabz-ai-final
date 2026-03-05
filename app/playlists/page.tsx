"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, type User } from "firebase/auth";
import { Sidebar } from "@/components/Sidebar";
import { getPlaylists, createPlaylist, deletePlaylist, type Playlist } from "@/lib/playlists";
import { useToast } from "@/components/ToastContext";
import { VideoCard } from "@/components/VideoCard";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { Plus, Trash2 } from "lucide-react";

export default function PlaylistsPage() {
  const toast = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [projects, setProjects] = useState<Record<string, any>>({});

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, setUser);
    return () => unsub();
  }, []);

  useEffect(() => {
    const load = async () => {
      if (!user?.uid) {
        setPlaylists([]);
        return;
      }
      const list = await getPlaylists(user.uid);
      setPlaylists(list);
    };
    load();
  }, [user?.uid]);

  useEffect(() => {
    const load = async () => {
      if (!expanded) return;
      const pl = playlists.find((p) => p.id === expanded);
      if (!pl?.projectIds?.length) {
        setProjects({});
        return;
      }
      const map: Record<string, any> = {};
      for (const id of pl.projectIds) {
        const pRef = doc(db, "projects", id);
        const snap = await getDoc(pRef);
        if (snap.exists()) map[id] = { id: snap.id, ...snap.data() };
      }
      setProjects(map);
    };
    load();
  }, [expanded, playlists]);

  const handleCreate = async () => {
    if (!newName.trim() || !user) return;
    setCreating(true);
    try {
      await createPlaylist(newName.trim());
      toast.success("Oynatma listesi oluşturuldu.");
      setNewName("");
      const list = await getPlaylists(user.uid);
      setPlaylists(list);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Hata");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (playlistId: string) => {
    if (!confirm("Bu listeyi silmek istediğinize emin misiniz?")) return;
    try {
      await deletePlaylist(playlistId);
      toast.success("Liste silindi.");
      setPlaylists((p) => p.filter((x) => x.id !== playlistId));
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Hata");
    }
  };

  if (!user) {
    return (
      <div className="flex min-h-screen bg-black text-white">
        <div className="hidden sm:block"><Sidebar user={null} /></div>
        <main className="flex-1 sm:ml-56 flex flex-col items-center justify-center p-8">
          <p className="text-gray-500 mb-4">Oynatma listelerini görmek için giriş yapın.</p>
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
        <h1 className="text-2xl font-bold mb-6">Oynatma Listeleri</h1>

        <div className="flex gap-3 mb-8">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Yeni liste adı"
            className="px-4 py-2 rounded-lg bg-white/5 border border-white/20 text-white placeholder-gray-500 focus:border-red-500/50 outline-none"
          />
          <button
            type="button"
            onClick={handleCreate}
            disabled={!newName.trim() || creating}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 disabled:opacity-50 transition"
          >
            <Plus size={18} />
            Oluştur
          </button>
        </div>

        {playlists.length === 0 ? (
          <p className="text-gray-500">Henüz oynatma listeniz yok.</p>
        ) : (
          <div className="space-y-4">
            {playlists.map((pl) => (
              <div key={pl.id} className="border border-white/10 rounded-xl overflow-hidden">
                <div
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/5"
                  onClick={() => setExpanded(expanded === pl.id ? null : pl.id)}
                >
                  <span className="font-semibold">{pl.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">{(pl.projectIds || []).length} video</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(pl.id);
                      }}
                      className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
                {expanded === pl.id && (
                  <div className="p-4 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {(pl.projectIds || []).map((pid: string) => projects[pid]).filter(Boolean).map((v: any) => (
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
                    {(pl.projectIds || []).length === 0 && (
                      <p className="text-gray-500 col-span-full">Liste boş. Videolara "Listeye ekle" ile ekleyebilirsiniz.</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
