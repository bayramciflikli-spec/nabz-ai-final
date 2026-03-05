import {
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  where,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  filterByLegalCompliance,
  type ContentForEvaluation,
} from "@/lib/contentDistribution";

export interface DiscoverProject extends ContentForEvaluation {
  id: string;
  title: string;
  imageUrl?: string;
  videoUrl?: string;
  tool?: string;
  kategori?: string;
  authorName?: string;
  authorImage?: string;
  authorId?: string;
  likedBy?: string[];
  dislikedBy?: string[];
  createdAt?: { toMillis: () => number };
}

function toProject(doc: { id: string; data: () => Record<string, unknown> }): DiscoverProject | null {
  const data = doc.data();
  if (data.status === "BANNED_CONTENT" || data.isVisible === false || data.rtbfDeleted === true) return null;
  return {
    id: doc.id,
    title: (data.title as string) || "İsimsiz",
    imageUrl: data.imageUrl as string | undefined,
    videoUrl: data.videoUrl as string | undefined,
    tool: data.tool as string | undefined,
    kategori: data.kategori as string | undefined,
    category: (data.kategori ?? data.category) as string | undefined,
    authorName: (data.authorName as string) || "NABZ-AI",
    authorImage: data.authorImage as string | undefined,
    authorId: data.authorId as string | undefined,
    likedBy: (data.likedBy as string[]) || [],
    dislikedBy: (data.dislikedBy as string[]) || [],
    distribution: (data.distribution as "local" | "global" | "locked") ?? "local",
    isAdult: !!data.isAdult,
    createdAt: data.createdAt as { toMillis: () => number } | undefined,
  };
}

/** Kullanıcı ülkesine göre içerikleri filtrele (global içerikler için yasal uyum) */
export function applyLegalFilter<T extends DiscoverProject>(
  items: T[],
  userCountry: string | null
): T[] {
  return filterByLegalCompliance(items, userCountry);
}


/** En yeni içerikler (son eklenenler) */
export async function fetchNewContent(limitCount = 16): Promise<DiscoverProject[]> {
  try {
    const q = query(
      collection(db, "projects"),
      orderBy("createdAt", "desc"),
      limit(limitCount)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => toProject({ id: d.id, data: () => d.data() })).filter((p): p is DiscoverProject => p !== null);
  } catch (e) {
    console.error("fetchNewContent error:", e);
    return [];
  }
}

/** En çok beğenilen (trending) - client-side sıralama */
export async function fetchTrendingContent(limitCount = 16): Promise<DiscoverProject[]> {
  try {
    const q = query(
      collection(db, "projects"),
      orderBy("createdAt", "desc"),
      limit(100)
    );
    const snap = await getDocs(q);
    const projects = snap.docs.map((d) => toProject({ id: d.id, data: () => d.data() })).filter((p): p is DiscoverProject => p !== null);
    projects.sort((a, b) => (b.likedBy?.length ?? 0) - (a.likedBy?.length ?? 0));
    return projects.slice(0, limitCount);
  } catch (e) {
    console.error("fetchTrendingContent error:", e);
    return [];
  }
}

/** Kategoriye göre içerik */
export async function fetchByCategory(
  kategori: string,
  limitCount = 12
): Promise<DiscoverProject[]> {
  try {
    const q = query(
      collection(db, "projects"),
      where("kategori", "==", kategori),
      orderBy("createdAt", "desc"),
      limit(limitCount)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => toProject({ id: d.id, data: () => d.data() })).filter((p): p is DiscoverProject => p !== null);
  } catch (e) {
    console.error("fetchByCategory error:", e);
    return [];
  }
}

/** Sizin için önerilen - izleme geçmişine göre kişiselleştirilmiş */
export async function fetchRecommendedForUser(
  watchHistoryIds: string[],
  limitCount = 16
): Promise<DiscoverProject[]> {
  if (watchHistoryIds.length === 0) return fetchTrendingContent(limitCount);

  try {
    const categories = new Set<string>();
    for (const id of watchHistoryIds.slice(0, 20)) {
      const snap = await getDoc(doc(db, "projects", id));
      const data = snap.data();
      const k = (data?.kategori ?? data?.category ?? data?.tool) as string | undefined;
      if (k) categories.add(k);
    }

    if (categories.size === 0) return fetchTrendingContent(limitCount);

    const seen = new Set(watchHistoryIds);
    const results: DiscoverProject[] = [];
    for (const cat of categories) {
      const items = await fetchByCategory(cat, limitCount + 5);
      for (const p of items) {
        if (!seen.has(p.id)) {
          seen.add(p.id);
          results.push(p);
          if (results.length >= limitCount) break;
        }
      }
      if (results.length >= limitCount) break;
    }

    if (results.length < limitCount) {
      const trend = await fetchTrendingContent(limitCount * 2);
      for (const p of trend) {
        if (!seen.has(p.id)) {
          results.push(p);
          if (results.length >= limitCount) break;
        }
      }
    }
    return results.slice(0, limitCount);
  } catch (e) {
    console.error("fetchRecommendedForUser error:", e);
    return fetchTrendingContent(limitCount);
  }
}

/** Shorts feed - dikey kaydırma için sıralı liste */
const SHORTS_FEED_KEY = "nabz_shorts_feed";

export function getShortsFeedFromStorage(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(SHORTS_FEED_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as string[];
  } catch {
    return [];
  }
}

export function setShortsFeedToStorage(ids: string[]): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(SHORTS_FEED_KEY, JSON.stringify(ids));
  } catch {
    // ignore
  }
}

export async function fetchShortsFeed(limitCount = 30): Promise<DiscoverProject[]> {
  return fetchNewContent(limitCount);
}

/** Benzer içerikler - aynı kategori veya araç, mevcut hariç */
export async function fetchSimilarContent(
  excludeId: string,
  kategori?: string,
  tool?: string,
  limitCount = 6
): Promise<DiscoverProject[]> {
  try {
    let q;
    if (kategori) {
      q = query(
        collection(db, "projects"),
        where("kategori", "==", kategori),
        orderBy("createdAt", "desc"),
        limit(limitCount + 5)
      );
    } else if (tool) {
      q = query(
        collection(db, "projects"),
        where("tool", "==", tool),
        orderBy("createdAt", "desc"),
        limit(limitCount + 5)
      );
    } else {
      q = query(
        collection(db, "projects"),
        orderBy("createdAt", "desc"),
        limit(limitCount + 5)
      );
    }
    const snap = await getDocs(q);
    const projects = snap.docs
      .map((d) => toProject({ id: d.id, data: () => d.data() }))
      .filter((p): p is DiscoverProject => p !== null && p.id !== excludeId)
      .slice(0, limitCount);
    return projects;
  } catch (e) {
    console.error("fetchSimilarContent error:", e);
    return [];
  }
}
