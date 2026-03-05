"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { fetchNotifications, markNotificationRead, type Notification } from "@/lib/notifications";
import { Bell } from "lucide-react";

export default function NotificationsPage() {
  const [user, setUser] = useState<{ uid: string } | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u ? { uid: u.uid } : null));
    return () => unsub();
  }, []);

  useEffect(() => {
    const load = async () => {
      if (!user?.uid) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const list = await fetchNotifications(user.uid, 50);
        setNotifications(list);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.uid]);

  const handleRead = async (n: Notification) => {
    if (!n.read) {
      await markNotificationRead(n.id);
      setNotifications((prev) =>
        prev.map((x) => (x.id === n.id ? { ...x, read: true } : x))
      );
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0F0F0F] text-white flex flex-col items-center justify-center p-8">
        <p className="text-lg mb-4">Bildirimleri görmek için giriş yapın.</p>
        <Link href="/" className="text-red-400 font-bold hover:underline">
          Ana sayfaya dön
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white p-8">
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="text-blue-400 font-bold mb-6 inline-block hover:underline">
          ← Geri Dön
        </Link>
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Bell size={28} />
          Bildirimler
        </h1>

        {loading ? (
          <div className="text-center py-12 text-white/50">Yükleniyor...</div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12 text-white/50">Henüz bildirim yok</div>
        ) : (
          <ul className="space-y-2">
            {notifications.map((n) => (
              <li key={n.id}>
                <Link
                  href={n.link || "#"}
                  onClick={() => handleRead(n)}
                  className={`block p-4 rounded-xl border transition-colors ${
                    !n.read
                      ? "bg-red-500/10 border-red-500/30"
                      : "bg-white/5 border-white/10 hover:bg-white/10"
                  }`}
                >
                  <p className="font-medium">{n.title}</p>
                  {n.body && <p className="text-sm text-white/60 mt-1">{n.body}</p>}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
