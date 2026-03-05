import { NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase-admin";
import {
  evaluateContentPromotion,
  getContentViews,
  type ContentForEvaluation,
} from "@/lib/contentDistribution";

/**
 * İçerik promosyon değerlendirmesi - 1M+ görüntülenme eşiği
 * POST body: { projectId: string }
 */
export async function POST(request: Request) {
  try {
    let body: { projectId?: string } = {};
    try {
      const raw = await request.text();
      if (raw?.trim()) body = JSON.parse(raw) as { projectId?: string };
    } catch {
      return NextResponse.json({ ok: false, error: "Geçersiz istek" }, { status: 400 });
    }
    const projectId = body?.projectId;
    if (!projectId) {
      return NextResponse.json({ ok: false, error: "projectId gerekli" }, { status: 400 });
    }

    const adminDb = getAdminFirestore();
    if (!adminDb) {
      return NextResponse.json({ ok: false, error: "Firestore Admin yapılandırılmamış" }, { status: 503 });
    }

    const projectRef = adminDb.collection("projects").doc(projectId);
    const snap = await projectRef.get();
    if (!snap.exists) {
      return NextResponse.json({ ok: false, error: "Proje bulunamadı" }, { status: 404 });
    }

    const data = snap.data();
    const content: ContentForEvaluation = {
      id: projectId,
      category: data?.kategori ?? data?.category,
      kategori: data?.kategori,
      isAdult: !!data?.isAdult,
      views: data?.views,
      likedBy: data?.likedBy ?? [],
      distribution: data?.distribution as "local" | "global" | "locked" | undefined,
    };

    if (content.distribution === "locked" || content.distribution === "global") {
      return NextResponse.json({ ok: true, status: content.distribution, skipped: true });
    }

    const result = evaluateContentPromotion(content);
    if (result === "pending") {
      return NextResponse.json({
        ok: true,
        status: "pending",
        views: getContentViews(content),
      });
    }

    await projectRef.update({
      distribution: result === "lock" ? "locked" : "global",
      distributionUpdatedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      ok: true,
      status: result,
      views: getContentViews(content),
    });
  } catch (e: unknown) {
    console.error("evaluate-promotion:", e);
    const message = e instanceof Error ? e.message : "Sunucu hatası";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
