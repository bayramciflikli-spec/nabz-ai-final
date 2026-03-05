import {
  collection,
  query,
  orderBy,
  startAt,
  endAt,
  getDocs,
  limit,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getSearchVariations, matchesQuery } from "./searchUtils";

export type SearchFilters = {
  uploadDate?: "hour" | "today" | "week" | "month" | "all";
};

function toMs(v: unknown): number {
  if (!v) return 0;
  if (typeof v === "object" && "toMillis" in v) return (v as { toMillis: () => number }).toMillis();
  if (typeof v === "object" && "seconds" in v) return ((v as { seconds: number }).seconds ?? 0) * 1000;
  if (v instanceof Date) return v.getTime();
  return 0;
}

function getSinceDate(uploadDate: string): number | null {
  const now = Date.now();
  if (uploadDate === "hour") return now - 60 * 60 * 1000;
  if (uploadDate === "today") {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }
  if (uploadDate === "week") return now - 7 * 24 * 60 * 60 * 1000;
  if (uploadDate === "month") return now - 30 * 24 * 60 * 60 * 1000;
  return null;
}

export const searchAitube = async (searchTerm: string, filters?: SearchFilters) => {
  if (!searchTerm.trim()) return { videos: [], channels: [] };

  const uploadDate = filters?.uploadDate ?? "all";
  const sinceMs = getSinceDate(uploadDate);

  const variations = getSearchVariations(searchTerm);
  const seenVideoIds = new Set<string>();
  const seenChannelIds = new Set<string>();
  const videos: { id: string; createdAt?: { toMillis?: () => number }; [key: string]: unknown }[] = [];
  const channels: { id: string; [key: string]: unknown }[] = [];

  try {
    for (const term of variations) {
      if (!term) continue;

      try {
        const videoQuery = query(
          collection(db, "projects"),
          orderBy("titleLower"),
          startAt(term),
          endAt(term + "\uf8ff"),
          limit(50)
        );

        const channelQuery = query(
          collection(db, "users"),
          orderBy("displayNameLower"),
          startAt(term),
          endAt(term + "\uf8ff"),
          limit(15)
        );

        const [videoSnap, channelSnap] = await Promise.all([
          getDocs(videoQuery),
          getDocs(channelQuery),
        ]);

        for (const d of videoSnap.docs) {
          const raw = d.data() as Record<string, unknown>;
          const data = { id: d.id, ...raw };
          if (!seenVideoIds.has(d.id)) {
            seenVideoIds.add(d.id);
            const ms = toMs(raw.createdAt);
            if (sinceMs == null || ms >= sinceMs) videos.push(data);
          }
        }

        for (const d of channelSnap.docs) {
          const data = { id: d.id, ...d.data() };
          if (!seenChannelIds.has(d.id)) {
            seenChannelIds.add(d.id);
            channels.push(data);
          }
        }
      } catch {
        // Bu varyasyon için index yoksa devam et
      }
    }

    // Prefix sonuç yoksa: tüm projeleri çek, client-side filtrele
    if (videos.length === 0 && channels.length === 0) {
      try {
        const allProjects = await getDocs(
          query(collection(db, "projects"), limit(150))
        );
        const allUsers = await getDocs(
          query(collection(db, "users"), limit(50))
        );

        for (const d of allProjects.docs) {
          const data = d.data();
          const title = (data.title || "") as string;
          if (matchesQuery(title, searchTerm)) {
            const ms = toMs(data.createdAt);
            if (sinceMs == null || ms >= sinceMs) {
              videos.push({ id: d.id, ...data });
            }
          }
        }

        for (const d of allUsers.docs) {
          const data = d.data();
          const name = (data.displayName || "") as string;
          if (matchesQuery(name, searchTerm)) {
            channels.push({ id: d.id, ...data });
          }
        }
      } catch (e) {
        console.error("Client-side arama hatası:", e);
      }
    }

    return { videos, channels };
  } catch (error) {
    console.error("Arama hatası:", error);
    return { videos: [], channels: [] };
  }
};
