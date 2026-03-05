import { NextResponse } from "next/server";
import { verifyApiAuth } from "@/lib/apiAuth";
import { checkUserLegalStatus } from "@/lib/confirmLegalAcceptance";

/**
 * Kullanıcının yasal kabul geçmişi var mı kontrol eder.
 * GET — auth token ile.
 */
export async function GET(request: Request) {
  try {
    const auth = await verifyApiAuth(request);
    if (!auth) {
      return NextResponse.json({ error: "Giriş yapmanız gerekiyor." }, { status: 401 });
    }

    const status = await checkUserLegalStatus(auth.uid);

    return NextResponse.json({
      ok: true,
      status,
      message:
        status === "LEGAL_CLEAR_TO_PROCEED"
          ? "Yasal kabul kayıtlı"
          : "Yasal kabul kaydı bulunamadı. Abone ol sayfasından şartları kabul edin.",
    });
  } catch (e: unknown) {
    console.error("[check-legal-status]", e);
    const message = e instanceof Error ? e.message : "Kontrol başarısız";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
