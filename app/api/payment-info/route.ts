import { NextResponse } from "next/server";
import { verifyApiAuth } from "@/lib/apiAuth";
import { saveOfficialPaymentInfo } from "@/lib/paymentInfo";
import type { PayoutMethodType, PaymentDetails } from "@/lib/paymentInfo";

/**
 * POST body: { method: PayoutMethodType, details: PaymentDetails }
 * Kullanıcı kendi ödeme bilgilerini kaydeder.
 */
export async function POST(request: Request) {
  try {
    const user = await verifyApiAuth(request);
    if (!user) {
      return NextResponse.json({ ok: false, error: "Giriş gerekli" }, { status: 401 });
    }

    let body: { method?: PayoutMethodType; details?: PaymentDetails } = {};
    try {
      const raw = await request.text();
      if (raw?.trim()) body = JSON.parse(raw) as typeof body;
    } catch {
      return NextResponse.json({ ok: false, error: "Geçersiz istek" }, { status: 400 });
    }
    const method = body?.method;
    const details = body?.details;

    if (!method || !details) {
      return NextResponse.json(
        { ok: false, error: "method ve details gerekli" },
        { status: 400 }
      );
    }

    await saveOfficialPaymentInfo(user.uid, method, details);

    return NextResponse.json({
      ok: true,
      message: "Ödeme bilgileri kaydedildi. Onay bekleniyor.",
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Sunucu hatası";
    console.error("payment-info:", e);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
