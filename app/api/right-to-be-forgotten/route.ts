import { NextResponse } from "next/server";
import { verifyApiAuth } from "@/lib/apiAuth";
import { rightToBeForgotten } from "@/lib/rightToBeForgotten";

/**
 * GDPR Madde 17 — Kullanıcı kendi silinme hakkını talep edebilir.
 * Giriş yapmış kullanıcı sadece kendi hesabını silebilir.
 */
export async function POST(request: Request) {
  try {
    const auth = await verifyApiAuth(request);
    if (!auth) {
      return NextResponse.json({ error: "Giriş yapmanız gerekiyor." }, { status: 401 });
    }

    let body: { userId?: string } = {};
    try {
      const raw = await request.text();
      if (raw?.trim()) body = JSON.parse(raw) as typeof body;
    } catch {}
    const userId = body?.userId;

    // Kullanıcı sadece kendi hesabını silebilir
    const targetId = userId?.trim() || auth.uid;
    if (targetId !== auth.uid) {
      return NextResponse.json(
        { error: "Sadece kendi hesabınızı silebilirsiniz." },
        { status: 403 }
      );
    }

    await rightToBeForgotten(targetId);

    return NextResponse.json({
      ok: true,
      message: "Hesabınız anonimleştirildi. Kişisel verileriniz silindi.",
    });
  } catch (e: unknown) {
    console.error("[right-to-be-forgotten]", e);
    const message = e instanceof Error ? e.message : "İşlem başarısız";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
