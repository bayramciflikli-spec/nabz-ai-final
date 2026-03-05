import { NextRequest, NextResponse } from "next/server";
import { verifyAdminAuth } from "@/lib/apiAuth";
import { claimFounderRole } from "@/lib/claimFounderRole";

/**
 * POST — "Ben Kurucuyum" talebi.
 * Sadece NEXT_PUBLIC_ADMIN_UIDS'deki admin kullanıcılar talep edebilir.
 * admins/{uid} dokümanı oluşturulur.
 */
export async function POST(request: NextRequest) {
  try {
    const admin = await verifyAdminAuth(request);
    if (!admin) {
      return NextResponse.json({ ok: false, error: "Yetkisiz" }, { status: 401 });
    }

    const result = await claimFounderRole(admin.uid);

    if (!result.ok) {
      return NextResponse.json(
        { ok: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Kritik: Sistem yetkileri kurucu seviyesine yükseltildi.",
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Sunucu hatası";
    console.error("claim-founder:", e);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
