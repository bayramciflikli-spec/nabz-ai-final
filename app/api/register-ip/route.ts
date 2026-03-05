import { NextRequest, NextResponse } from "next/server";
import { verifyApiAuth } from "@/lib/apiAuth";
import { isValidUrl, rateLimit } from "@/lib/security";
import { registerIP } from "@/lib/registerIP";

/**
 * IP Pasaportu oluşturma — yükleme öncesi çağrılır.
 * POST body: { imageUrl?, videoUrl?, tool }
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyApiAuth(request);
    if (!auth) {
      return NextResponse.json({ error: "Giriş yapmanız gerekiyor." }, { status: 401 });
    }

    if (!rateLimit(`register-ip:${auth.uid}`)) {
      return NextResponse.json({ error: "Çok fazla istek." }, { status: 429 });
    }

    let body: { imageUrl?: string; videoUrl?: string; tool?: string } = {};
    try {
      const raw = await request.text();
      if (raw?.trim()) body = JSON.parse(raw) as typeof body;
    } catch {
      return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 });
    }
    const { imageUrl, videoUrl, tool } = body;

    const primaryUrl = videoUrl || imageUrl;
    if (!primaryUrl || !isValidUrl(primaryUrl)) {
      return NextResponse.json(
        { error: "Geçerli görsel veya video URL gerekli." },
        { status: 400 }
      );
    }

    const contentID = await registerIP(
      auth.uid,
      { imageUrl, videoUrl, primaryUrl },
      tool || "Suno"
    );

    return NextResponse.json({ ok: true, contentID });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "IP kaydı başarısız.";
    if (msg.includes("zaten bir başkasına ait")) {
      return NextResponse.json({ ok: false, error: msg }, { status: 409 });
    }
    console.error("[register-ip]", error);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
