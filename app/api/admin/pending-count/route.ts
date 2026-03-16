import { NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase-admin";
import { getContentViews, GLOBAL_PROMOTION_VIEWS_THRESHOLD } from "@/lib/contentDistribution";
import { verifyAdminAuth } from "@/lib/apiAuth";

/** Hafif endpoint: sadece onay bekleyen içerik sayısı. Admin değilse 200 + pendingCount: 0 (konsol 401 hatası önlenir). */
export async function GET(request: Request) {
  try {
    const admin = await verifyAdminAuth(request);
    if (!admin) {
      return NextResponse.json({ ok: true, pendingCount: 0 });
    }

    const adminDb = getAdminFirestore();
    if (!adminDb) {
      return NextResponse.json({ pendingCount: 0 });
    }

    const snap = await adminDb.collection("projects").limit(5000).get();
    let pendingCount = 0;

    snap.docs.forEach((d) => {
      const data = d.data();
      const dist = data?.distribution as string | undefined;
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
        pendingCount++;
      }
    });

    return NextResponse.json({ pendingCount });
  } catch {
    return NextResponse.json({ pendingCount: 0 });
  }
}
