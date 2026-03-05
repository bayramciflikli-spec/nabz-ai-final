import { NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase-admin";
import { verifyAdminAuth } from "@/lib/apiAuth";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await verifyAdminAuth(request);
    if (!admin) {
      return NextResponse.json({ ok: false, error: "Yetkisiz" }, { status: 401 });
    }

    const { id } = await params;
    const adminDb = getAdminFirestore();
    if (!adminDb) {
      return NextResponse.json(
        { ok: false, error: "Firestore yapılandırılmamış" },
        { status: 503 }
      );
    }

    let body: { action?: string } = {};
    try {
      const raw = await request.text();
      if (raw?.trim()) body = JSON.parse(raw) as { action?: string };
    } catch {
      return NextResponse.json({ ok: false, error: "Geçersiz istek" }, { status: 400 });
    }
    const action = body.action as "approve" | "reject" | undefined;
    if (!action || !["approve", "reject"].includes(action)) {
      return NextResponse.json(
        { ok: false, error: "action: approve veya reject gerekli" },
        { status: 400 }
      );
    }

    const ref = adminDb.collection("sponsors").doc(id);
    const snap = await ref.get();
    if (!snap.exists) {
      return NextResponse.json({ ok: false, error: "Sponsor bulunamadı" }, { status: 404 });
    }

    const newStatus = action === "approve" ? "completed" : "rejected";

    await ref.update({
      paymentStatus: newStatus,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true, paymentStatus: newStatus });
  } catch (e: unknown) {
    console.error("sponsor PATCH:", e);
    const message = e instanceof Error ? e.message : "Sunucu hatası";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
