import { NextResponse } from "next/server";
import { verifyAdminAuth } from "@/lib/apiAuth";
import { promoteUser } from "@/lib/promoteUser";
import type { UserRole } from "@/lib/userAccess";

/**
 * POST body: { uid: string, newRole: UserRole }
 * Sadece admin erişebilir.
 */
export async function POST(request: Request) {
  try {
    const admin = await verifyAdminAuth(request);
    if (!admin) {
      return NextResponse.json({ ok: false, error: "Yetkisiz" }, { status: 401 });
    }

    let body: { uid?: string; newRole?: UserRole } = {};
    try {
      const raw = await request.text();
      if (raw?.trim()) body = JSON.parse(raw) as { uid?: string; newRole?: UserRole };
    } catch {
      return NextResponse.json({ ok: false, error: "Geçersiz istek" }, { status: 400 });
    }
    const uid = body?.uid;
    const newRole = body?.newRole;

    if (!uid || !newRole) {
      return NextResponse.json({ ok: false, error: "uid ve newRole gerekli" }, { status: 400 });
    }

    await promoteUser(uid, newRole);

    return NextResponse.json({
      ok: true,
      message: `Kullanıcı ${newRole} rütbesine yükseltildi.`,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Sunucu hatası";
    console.error("promote-user:", e);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
