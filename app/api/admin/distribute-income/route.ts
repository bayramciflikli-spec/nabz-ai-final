import { NextResponse } from "next/server";
import { verifyAdminAuth } from "@/lib/apiAuth";
import { distributeIncome } from "@/lib/distributeIncome";

/**
 * POST body: { saleAmount: number, architectUid: string, architectRate?: number, description?: string }
 * Gelir dağıtımı — sadece admin erişebilir.
 */
export async function POST(request: Request) {
  try {
    const admin = await verifyAdminAuth(request);
    if (!admin) {
      return NextResponse.json({ ok: false, error: "Yetkisiz" }, { status: 401 });
    }

    let body: Record<string, unknown> = {};
    try {
      const raw = await request.text();
      if (raw?.trim()) body = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ ok: false, error: "Geçersiz istek" }, { status: 400 });
    }
    const saleAmount = Number(body?.saleAmount);
    const architectUid = body?.architectUid as string | undefined;
    const architectRate = body?.architectRate != null ? Number(body.architectRate) / 100 : undefined;
    const description = body?.description as string | undefined;

    if (!architectUid || saleAmount <= 0 || isNaN(saleAmount)) {
      return NextResponse.json(
        { ok: false, error: "saleAmount (pozitif sayı) ve architectUid gerekli" },
        { status: 400 }
      );
    }

    await distributeIncome(saleAmount, architectUid, {
      architectRate,
      description,
    });

    return NextResponse.json({
      ok: true,
      message: "Gelir dağıtımı tamamlandı.",
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Sunucu hatası";
    console.error("distribute-income:", e);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
