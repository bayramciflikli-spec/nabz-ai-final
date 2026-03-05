import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  doc,
  updateDoc,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface Notification {
  id: string;
  userId: string;
  type: "comment" | "like" | "subscribe" | "mention" | "system";
  title: string;
  body?: string;
  link?: string;
  read: boolean;
  createdAt?: { toMillis: () => number };
}

export async function createNotification(data: {
  userId: string;
  type: Notification["type"];
  title: string;
  body?: string;
  link?: string;
}): Promise<void> {
  try {
    await addDoc(collection(db, "notifications"), {
      ...data,
      read: false,
      createdAt: serverTimestamp(),
    });
  } catch (e) {
    console.error("createNotification error:", e);
  }
}

export async function fetchNotifications(
  userId: string,
  limitCount = 20
): Promise<Notification[]> {
  try {
    const q = query(
      collection(db, "notifications"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc"),
      limit(limitCount)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        userId: data.userId as string,
        type: (data.type as Notification["type"]) || "system",
        title: (data.title as string) || "Bildirim",
        body: data.body as string | undefined,
        link: data.link as string | undefined,
        read: !!data.read,
        createdAt: data.createdAt as { toMillis: () => number } | undefined,
      };
    });
  } catch (e) {
    console.error("fetchNotifications error:", e);
    return [];
  }
}

export async function markNotificationRead(notificationId: string): Promise<void> {
  try {
    await updateDoc(doc(db, "notifications", notificationId), { read: true });
  } catch (e) {
    console.error("markNotificationRead error:", e);
  }
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  try {
    const q = query(
      collection(db, "notifications"),
      where("userId", "==", userId),
      where("read", "==", false)
    );
    const snap = await getDocs(q);
    await Promise.all(
      snap.docs.map((d) => updateDoc(doc(db, "notifications", d.id), { read: true }))
    );
  } catch (e) {
    console.error("markAllNotificationsRead error:", e);
  }
}
