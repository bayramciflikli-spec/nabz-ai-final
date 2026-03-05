import { NextResponse } from "next/server";
import { verifyAdminAuth } from "@/lib/apiAuth";
import { applyStrike } from "@/lib/applyStrike";

/**
 * Telif ihlali cezası uygula. Admin only.
 * POST body: { contentID: string, reason: string }
 */
export async function POST(request: Request) {
  try {
    const admin = await verifyAdminAuth(request);
    if (!admin) {
      return NextResponse.json({ ok: false, error: "Yetkisiz" }, { status: 401 });
    }

    let body: { contentID?: string; reason?: string } = {};
    try {
      const raw = await request.text();
      if (raw?.trim()) body = JSON.parse(raw) as { contentID?: string; reason?: string };
    } catch {
      return NextResponse.json({ ok: false, error: "Geçersiz istek" }, { status: 400 });
    }
    const contentID = body?.contentID;
    const reason = body?.reason;

    if (!contentID || !reason?.trim()) {
      return NextResponse.json(
        { ok: false, error: "contentID ve reason gerekli." },
        { status: 400 }
      );
    }

    const result = await applyStrike(contentID, reason.trim());

    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({ ok: true, message: "Ceza uygulandı." });
  } catch (e: unknown) {
    console.error("[apply-strike]", e);
    const message = e instanceof Error ? e.message : "Sunucu hatası";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
