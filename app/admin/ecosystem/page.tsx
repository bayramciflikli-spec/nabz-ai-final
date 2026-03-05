"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sidebar } from "@/components/Sidebar";
import { auth } from "@/lib/firebase";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { onAuthStateChanged, type User } from "firebase/auth";
import { GripVertical, Users, FileVideo, ExternalLink } from "lucide-react";

interface EcosystemUser {
  id: string;
  displayName: string;
  email?: string;
  role: string;
  createdAt: number | null;
}

interface EcosystemProject {
  id: string;
  title: string;
  authorId?: string;
  status: string;
  distribution?: string;
  createdAt: number | null;
}

export default function AdminEcosystemPage() {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<EcosystemUser[]>([]);
  const [projects, setProjects] = useState<EcosystemProject[]>([]);
  const [stats, setStats] = useState({ totalUsers: 0, totalProjects: 0, ecosystemOwnerUid: "" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, setUser);
    return () => unsub();
  }, []);

  useEffect(() => {
    const load = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const res = await fetchWithAuth("/api/admin/ecosystem");
        const data = await res.json();
        if (data.ok) {
          setUsers(data.users ?? []);
          setProjects(data.projects ?? []);
          setStats(data.stats ?? { totalUsers: 0, totalProjects: 0, ecosystemOwnerUid: "" });
        }
      } catch {
        setUsers([]);
        setProjects([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  return (
    <div className="flex min-h-screen bg-[#0a0a0a] text-white">
      <div className="hidden sm:block">
        <Sidebar user={user} />
      </div>

      <div className="flex-1 sm:ml-56 flex">
        <aside className="w-[260px] bg-[#111] border-r border-white/10 flex flex-col p-6 shrink-0">
          <div className="font-['Orbitron'] font-black text-xl mb-12 bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
            NABZ-AI CTRL
          </div>
          <nav className="flex flex-col gap-2">
            {[
              { label: "Kontrol Kulesi", href: "/admin", active: false },
              { label: "Ekosistemim", href: "/admin/ecosystem", active: true },
              { label: "Global Onay Kuyruğu", href: "/admin/global-control", active: false },
              { label: "Kullanıcı Yönetimi", href: "/admin/users", active: false },
              { label: "Financial Hub", href: "/admin/financial", active: false },
              { label: "Şeffaflık Raporu", href: "/admin/transparency", active: false },
              { label: "Hukuki Filtreler", href: "/admin/legal-filters", active: false },
              { label: "Yasaklı Kelime/İçerik", href: "/admin/banned-content", active: false },
            ].map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={`px-4 py-3 rounded-lg transition-colors flex items-center gap-2 ${
                  item.active ? "bg-cyan-500/10 text-cyan-400" : "hover:bg-white/5 text-white/70"
                }`}
              >
                <GripVertical size={14} className="opacity-50" />
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        <main className="flex-1 p-8 overflow-y-auto">
          <h1 className="text-2xl font-bold mb-2 flex items-center gap-2">
            <Users size={28} className="text-cyan-400" />
            Ekosistemim
          </h1>
          <p className="text-white/60 text-sm mb-6">
            Senin admin UID&apos;in altında birleşen tüm kullanıcılar ve içerikler. Her giriş yapan kullanıcı otomatik olarak bu ekosisteme eklenir.
          </p>

          {loading ? (
            <p className="text-white/50">Yükleniyor...</p>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-[#1a1a1a] p-6 rounded-xl border border-white/10">
                  <p className="text-white/50 text-xs uppercase mb-1">Ekosistemdeki kullanıcılar</p>
                  <p className="text-3xl font-bold text-cyan-400">{stats.totalUsers}</p>
                </div>
                <div className="bg-[#1a1a1a] p-6 rounded-xl border border-white/10">
                  <p className="text-white/50 text-xs uppercase mb-1">Ekosistemdeki içerikler</p>
                  <p className="text-3xl font-bold text-purple-400">{stats.totalProjects}</p>
                </div>
              </div>

              <section className="mb-8">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Users size={20} />
                  Kullanıcılar
                </h2>
                <div className="bg-[#111] border border-white/10 rounded-xl overflow-hidden">
                  {users.length === 0 ? (
                    <p className="p-6 text-white/50">Henüz ekosisteme eklenen kullanıcı yok. Giriş yapan herkes otomatik eklenir.</p>
                  ) : (
                    <ul className="divide-y divide-white/10">
                      {users.slice(0, 50).map((u) => (
                        <li key={u.id} className="px-4 py-3 flex items-center justify-between gap-4">
                          <div>
                            <p className="font-medium">{u.displayName}</p>
                            <p className="text-xs text-white/50">{u.email || u.id}</p>
                          </div>
                          <span className="text-xs px-2 py-1 rounded bg-white/10">{u.role}</span>
                          <Link href={`/channel/${u.id}`} className="text-cyan-400 hover:underline text-sm flex items-center gap-1">
                            Kanal <ExternalLink size={14} />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                  {users.length > 50 && (
                    <p className="px-4 py-2 text-xs text-white/50 border-t border-white/10">
                      İlk 50 kullanıcı gösteriliyor. Toplam: {users.length}
                    </p>
                  )}
                </div>
              </section>

              <section>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <FileVideo size={20} />
                  İçerikler
                </h2>
                <div className="bg-[#111] border border-white/10 rounded-xl overflow-hidden">
                  {projects.length === 0 ? (
                    <p className="p-6 text-white/50">Henüz ekosistemde içerik yok. Yüklenen tüm projeler burada listelenir.</p>
                  ) : (
                    <ul className="divide-y divide-white/10">
                      {projects.slice(0, 50).map((p) => (
                        <li key={p.id} className="px-4 py-3 flex items-center justify-between gap-4">
                          <div className="min-w-0 flex-1">
                            <p className="font-medium truncate">{p.title}</p>
                            <p className="text-xs text-white/50">{p.status} · {p.distribution || "local"}</p>
                          </div>
                          <Link href={`/project/${p.id}`} className="text-cyan-400 hover:underline text-sm shrink-0 flex items-center gap-1">
                            Aç <ExternalLink size={14} />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                  {projects.length > 50 && (
                    <p className="px-4 py-2 text-xs text-white/50 border-t border-white/10">
                      İlk 50 içerik gösteriliyor. Toplam: {projects.length}
                    </p>
                  )}
                </div>
              </section>
            </>
          )}

          <div className="mt-8 flex gap-4">
            <Link href="/admin" className="text-sm text-cyan-400 hover:underline">
              ← Kontrol Kulesi
            </Link>
            <Link href="/admin/users" className="text-sm text-white/50 hover:text-white">
              Kullanıcı Yönetimi
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}
