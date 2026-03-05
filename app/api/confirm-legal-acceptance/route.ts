import { NextRequest, NextResponse } from "next/server";
import { verifyApiAuth } from "@/lib/apiAuth";
import { confirmLegalAcceptance } from "@/lib/confirmLegalAcceptance";

function getClientIp(request: NextRequest): string | null {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    request.headers.get("cf-connecting-ip") ||
    null
  );
}

function getUserAgent(request: NextRequest): string | null {
  return request.headers.get("user-agent") || null;
}

/**
 * Yasal kabul kaydı. Abone ol butonundan önce çağrılır.
 * İstek IP ve User-Agent otomatik alınır.
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyApiAuth(request);
    if (!auth) {
      return NextResponse.json({ error: "Giriş yapmanız gerekiyor." }, { status: 401 });
    }

    const ip = getClientIp(request);
    const userAgent = getUserAgent(request);
    const body = await request.json().catch(() => ({}));
    const fingerprint = body?.fingerprint as string | undefined;

    const signatureId = await confirmLegalAcceptance(auth.uid, {
      ip: ip ?? undefined,
      userAgent: userAgent ?? undefined,
      fingerprint: fingerprint ?? undefined,
    });

    return NextResponse.json({ ok: true, message: "Yasal kabul kaydedildi.", signatureId });
  } catch (e: unknown) {
    console.error("[confirm-legal-acceptance]", e);
    const message = e instanceof Error ? e.message : "Kayıt başarısız";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
