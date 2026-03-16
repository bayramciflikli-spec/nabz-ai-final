"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, type User } from "firebase/auth";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { ArrowUpCircle } from "lucide-react";
import type { UserRole } from "@/lib/userAccess";

const ROLES: { value: UserRole; label: string }[] = [
  { value: "explorer", label: "Explorer (izleyici)" },
  { value: "architect", label: "Architect (%10 pay)" },
  { value: "master_architect", label: "Master Architect (%15 pay)" },
  { value: "guardian", label: "Guardian (moderatör)" },
  { value: "admin", label: "Admin" },
];

export default function AdminUsersPage() {
  const [user, setUser] = useState<User | null>(null);
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, setUser);
    return () => unsub();
  }, []);
  const [uid, setUid] = useState("");
  const [newRole, setNewRole] = useState<UserRole>("architect");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const handlePromote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uid.trim()) {
      setMessage({ type: "err", text: "UID girin" });
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetchWithAuth("/api/admin/promote-user", {
        method: "POST",
        body: JSON.stringify({ uid: uid.trim(), newRole }),
      });
      const data = await res.json();
      if (data.ok) {
        setMessage({ type: "ok", text: `Kullanıcı ${newRole} rütbesine yükseltildi. Güven puanı: 100` });
        setUid("");
      } else {
        setMessage({ type: "err", text: data.error || "İşlem başarısız" });
      }
    } catch {
      setMessage({ type: "err", text: "İşlem başarısız" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
          <h1 className="text-2xl font-bold mb-8">Kullanıcı Terfi</h1>

          <div className="max-w-md p-6 bg-[#111] border border-white/10 rounded-xl">
            <p className="text-sm text-white/60 mb-4">
              Kullanıcıyı yeni rütbeye yükselt. Güven puanı 100 yapılır, varsa ban kaldırılır.
            </p>
            <form onSubmit={handlePromote} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-white/50 uppercase mb-1">Kullanıcı UID</label>
                <input
                  type="text"
                  value={uid}
                  onChange={(e) => setUid(e.target.value)}
                  placeholder="Örn: sxT56ThMSZekWnOo48OJJKQufCb2"
                  className="w-full px-4 py-2 rounded-lg bg-black/50 border border-white/20 text-white placeholder-white/30 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-white/50 uppercase mb-1">Yeni Rütbe</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as UserRole)}
                  className="w-full px-4 py-2 rounded-lg bg-black/50 border border-white/20 text-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                >
                  {ROLES.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold disabled:opacity-50"
              >
                <ArrowUpCircle size={18} />
                {loading ? "..." : "Terfi Et"}
              </button>
            </form>
            {message && (
              <p className={`mt-4 text-sm ${message.type === "ok" ? "text-green-400" : "text-red-400"}`}>
                {message.text}
              </p>
            )}
          </div>

          <div className="mt-8 flex gap-4">
            <Link href="/admin/global-control" className="text-sm text-cyan-400 hover:underline">
              ← Global Kuyruk
            </Link>
            <Link href="/admin" className="text-sm text-white/50 hover:text-white">
              Admin Ana Sayfa
            </Link>
          </div>
    </div>
  );
}
