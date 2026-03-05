import { NextRequest, NextResponse } from "next/server";
import { verifyAdminAuth } from "@/lib/apiAuth";
import { seedLegalSettings } from "@/lib/seedLegalSettings";

/**
 * POST: Admin tarafından legal_settings koleksiyonuna varsayılan dokümanları ekler.
 * Global_Standard, KVKK_Compliance, GDPR_Compliance dokümanları oluşturulur.
 */
export async function POST(request: NextRequest) {
  try {
    const admin = await verifyAdminAuth(request);
    if (!admin) {
      return NextResponse.json({ ok: false, error: "Yetkisiz" }, { status: 401 });
    }

    const result = await seedLegalSettings();
    if (!result.ok) {
      return NextResponse.json(
        { ok: false, error: result.error, created: result.created },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: "legal_settings dokümanları oluşturuldu.",
      created: result.created,
    });
  } catch (e: unknown) {
    console.error("[seed-legal-settings]", e);
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Sunucu hatası" },
      { status: 500 }
    );
  }
}
