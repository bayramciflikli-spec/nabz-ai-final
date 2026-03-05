import { NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase-admin";
import { getContentViews, GLOBAL_PROMOTION_VIEWS_THRESHOLD } from "@/lib/contentDistribution";
import { verifyAdminAuth } from "@/lib/apiAuth";

export interface PendingItem {
  id: string;
  title: string;
  tool?: string;
  kategori?: string;
  views: number;
  likedBy: number;
  authorName?: string;
  authorId?: string;
  distribution?: string;
  isAdult?: boolean;
  imageUrl?: string;
  videoUrl?: string;
  country?: string;
  ai_report?: string;
}

/**
 * 1M+ görüntülenme ve distribution=local olan içerikleri döndürür.
 * Sadece admin (NEXT_PUBLIC_ADMIN_UIDS'deki UID) erişebilir.
 */
export async function GET(request: Request) {
  try {
    const admin = await verifyAdminAuth(request);
    if (!admin) {
      return NextResponse.json({ ok: false, error: "Yetkisiz" }, { status: 401 });
    }

    const adminDb = getAdminFirestore();
    if (!adminDb) {
      return NextResponse.json(
        { ok: false, error: "Firestore Admin yapılandırılmamış" },
        { status: 503 }
      );
    }

    const snap = await adminDb.collection("projects").limit(3000).get();
    const items: PendingItem[] = [];
    let totalGlobal = 0;
    let totalBlocked = 0;

    snap.docs.forEach((d) => {
      const data = d.data();
      const dist = data?.distribution as string | undefined;
      if (dist === "global") totalGlobal++;
      if (dist === "locked") totalBlocked++;

      const likedBy = (data?.likedBy as string[]) ?? [];
      const views = getContentViews({
        id: d.id,
        likedBy,
        views: data?.views,
        kategori: data?.kategori,
        isAdult: data?.isAdult,
      });

      if (
        views >= GLOBAL_PROMOTION_VIEWS_THRESHOLD &&
        (dist === "local" || !dist || dist === undefined)
      ) {
        items.push({
          id: d.id,
          title: (data?.title as string) || "İsimsiz",
          tool: data?.tool,
          kategori: data?.kategori,
          views,
          likedBy: likedBy.length,
          authorName: data?.authorName,
          authorId: data?.authorId || data?.owner_uid,
          distribution: dist,
          isAdult: !!data?.isAdult,
          imageUrl: data?.imageUrl,
          videoUrl: data?.videoUrl,
          country: (data?.country as string) || "TR",
          ai_report: (data?.ai_report as string) || "Clean",
        });
      }
    });

    const totalViews = snap.docs.reduce((s, d) => {
      const data = d.data();
      const likedBy = (data?.likedBy as string[]) ?? [];
      return s + (data?.views ?? likedBy.length * 100);
    }, 0);

    return NextResponse.json({
      ok: true,
      pending: items.sort((a, b) => b.views - a.views),
      stats: {
        totalGlobal,
        pendingCount: items.length,
        todayViews: (totalViews / 1_000_000).toFixed(1) + "M",
        blockedCount: totalBlocked,
      },
    });
  } catch (e: unknown) {
    console.error("global-pending:", e);
    const message = e instanceof Error ? e.message : "Sunucu hatası";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
