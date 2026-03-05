import { NextResponse } from "next/server";
import { verifyAdminAuth } from "@/lib/apiAuth";
import { rightToBeForgotten } from "@/lib/rightToBeForgotten";

/**
 * GDPR Madde 17 — Silinme hakkı.
 * Admin veya kullanıcı talebi üzerine çağrılır.
 * POST body: { userId: string }
 */
export async function POST(request: Request) {
  try {
    const admin = await verifyAdminAuth(request);
    if (!admin) {
      return NextResponse.json({ ok: false, error: "Yetkisiz" }, { status: 401 });
    }

    let body: { userId?: string } = {};
    try {
      const raw = await request.text();
      if (raw?.trim()) body = JSON.parse(raw) as { userId?: string };
    } catch {
      return NextResponse.json({ ok: false, error: "Geçersiz istek" }, { status: 400 });
    }
    const userId = body?.userId;

    if (!userId?.trim()) {
      return NextResponse.json(
        { ok: false, error: "userId gerekli." },
        { status: 400 }
      );
    }

    await rightToBeForgotten(userId.trim());

    return NextResponse.json({ ok: true, message: "Silinme hakkı uygulandı." });
  } catch (e: unknown) {
    console.error("[right-to-be-forgotten]", e);
    const message = e instanceof Error ? e.message : "Sunucu hatası";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
