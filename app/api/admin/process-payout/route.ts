import { NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase-admin";
import { verifyAdminAuth } from "@/lib/apiAuth";
import { generatePaymentReceipt } from "@/lib/generatePaymentReceipt";

/**
 * POST body: { uid: string, amount: number, currency?: string, description?: string }
 * Admin ödeme işler: bakiyeden düşer, makbuz oluşturulur.
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
    const uid = body?.uid as string | undefined;
    const amount = Number(body?.amount);
    const currency = (body?.currency as string) ?? "USD";
    const description = (body?.description as string) ?? "AI İçerik Üretim Hizmet Bedeli";

    if (!uid || amount <= 0 || isNaN(amount)) {
      return NextResponse.json(
        { ok: false, error: "uid ve amount (pozitif) gerekli" },
        { status: 400 }
      );
    }

    const adminDb = getAdminFirestore();
    if (!adminDb) {
      return NextResponse.json({ ok: false, error: "Firestore yapılandırılmamış" }, { status: 503 });
    }

    const userRef = adminDb.collection("users").doc(uid);

    // Transaction: bakiye kontrolü + düşüm
    await adminDb.runTransaction(async (t) => {
      const snap = await t.get(userRef);
      const data = snap.data();
      const currentBalance = data?.balance ?? data?.totalEarnings ?? 0;
      if (currentBalance < amount) {
        throw new Error("Yetersiz bakiye");
      }
      t.update(userRef, { balance: currentBalance - amount });
    });

    // Makbuz oluştur
    const receiptID = await generatePaymentReceipt(uid, amount, {
      currency,
      description,
    });

    return NextResponse.json({
      ok: true,
      receiptID,
      message: "Ödeme işlendi, makbuz oluşturuldu.",
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Sunucu hatası";
    console.error("process-payout:", e);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
