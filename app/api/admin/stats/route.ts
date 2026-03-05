import { NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase-admin";
import { verifyAdminAuth } from "@/lib/apiAuth";
import { getContentViews, GLOBAL_PROMOTION_VIEWS_THRESHOLD } from "@/lib/contentDistribution";

/**
 * Admin dashboard istatistikleri
 * - Toplam kullanıcı sayısı (Architects)
 * - Onay bekleyen içerik sayısı
 * - Toplam reklam geliri (yaklaşık)
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

    // Kullanıcı sayısı (üst sınır: 5000)
    const usersSnap = await adminDb.collection("users").limit(5000).get();
    const userCount = usersSnap.size;

    // Onay bekleyen içerik sayısı (üst sınır: 5000 proje taranır)
    const projectsSnap = await adminDb.collection("projects").limit(5000).get();
    let pendingCount = 0;
    projectsSnap.docs.forEach((d) => {
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
      if (views >= GLOBAL_PROMOTION_VIEWS_THRESHOLD && (dist === "local" || !dist)) {
        pendingCount++;
      }
    });

    // Toplam reklam geliri (yaklaşık - tüm projelerin görüntülenmelerinden)
    let totalViews = 0;
    projectsSnap.docs.forEach((d) => {
      const data = d.data();
      const likedBy = (data?.likedBy as string[]) ?? [];
      totalViews += (data?.views ?? 0) + (likedBy.length * 100);
    });
    // Yaklaşık gelir: 1000 görüntüleme = $0.20 (CPM $0.20)
    const estimatedRevenue = (totalViews / 1000) * 0.2;

    return NextResponse.json({
      ok: true,
      stats: {
        userCount,
        pendingContent: pendingCount,
        totalRevenue: estimatedRevenue,
      },
    });
  } catch (e: unknown) {
    console.error("admin-stats:", e);
    const message = e instanceof Error ? e.message : "Sunucu hatası";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
