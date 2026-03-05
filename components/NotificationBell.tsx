"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Bell, Shield } from "lucide-react";
import { fetchNotifications, markNotificationRead, type Notification } from "@/lib/notifications";
import { isAdmin } from "@/lib/isAdmin";
import { fetchWithAuth } from "@/lib/fetchWithAuth";

interface NotificationBellProps {
  userId: string | null;
}

export function NotificationBell({ userId }: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);
  const admin = isAdmin(userId ?? undefined);

  useEffect(() => {
    if (!admin) return;
    const load = async () => {
      try {
        const res = await fetchWithAuth("/api/admin/pending-count");
        const data = await res.json();
        setPendingCount(data.pendingCount ?? 0);
      } catch {
        setPendingCount(0);
      }
    };
    load();
    const interval = setInterval(load, 60000); // her dakika
    return () => clearInterval(interval);
  }, [admin]);

  useEffect(() => {
    const hide = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("click", hide);
    return () => document.removeEventListener("click", hide);
  }, []);

  useEffect(() => {
    const load = async () => {
      if (!userId) return;
      setLoading(true);
      try {
        const list = await fetchNotifications(userId, 15);
        setNotifications(list);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [userId]);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const badgeCount = admin && pendingCount > 0 ? unreadCount + pendingCount : unreadCount;

  const handleNotificationClick = async (n: Notification) => {
    if (!n.read) {
      await markNotificationRead(n.id);
      setNotifications((prev) =>
        prev.map((x) => (x.id === n.id ? { ...x, read: true } : x))
      );
    }
    setOpen(false);
  };

  if (!userId) return null;

  return (
    <div ref={menuRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/5 border border-white/20 shrink-0 flex items-center justify-center hover:bg-white/10 transition-all"
        aria-label="Bildirimler"
        aria-expanded={open}
      >
        <Bell size={18} className="text-white/90" />
        {badgeCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {badgeCount > 99 ? "99+" : badgeCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-2 w-[calc(100vw-2rem)] max-w-[320px] sm:w-80 max-h-[70vh] sm:max-h-96 bg-black/95 border border-white/20 rounded-xl shadow-2xl z-50 overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
            <h3 className="font-semibold text-sm">Bildirimler</h3>
            <Link
              href="/notifications"
              onClick={() => setOpen(false)}
              className="text-xs text-red-400 hover:underline"
            >
              Tümünü gör
            </Link>
          </div>
          <div className="overflow-y-auto flex-1">
            {admin && pendingCount > 0 && (
              <Link
                href="/admin/global-control"
                onClick={() => setOpen(false)}
                className="block px-4 py-3 bg-amber-500/20 border-b border-amber-500/30 hover:bg-amber-500/30 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Shield size={16} className="text-amber-400" />
                  <span className="text-sm font-semibold text-amber-400">
                    {pendingCount} içerik onay bekliyor
                  </span>
                </div>
                <p className="text-xs text-amber-400/80 mt-0.5">Global Kontrol →</p>
              </Link>
            )}
            {loading ? (
              <div className="p-6 text-center text-sm text-white/50">
                Yükleniyor...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-6 text-center text-sm text-white/50">
                Henüz bildirim yok
              </div>
            ) : (
              <div className="py-2">
                {notifications.map((n) => (
                  <Link
                    key={n.id}
                    href={n.link || "#"}
                    onClick={() => handleNotificationClick(n)}
                    className={`block px-4 py-3 hover:bg-white/10 transition-colors ${!n.read ? "bg-red-500/10" : ""}`}
                  >
                    <p className="text-sm font-medium truncate">{n.title}</p>
                    {n.body && (
                      <p className="text-xs text-white/60 truncate mt-0.5">
                        {n.body}
                      </p>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
