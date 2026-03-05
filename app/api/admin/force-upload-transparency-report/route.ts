import { NextRequest, NextResponse } from "next/server";
import { verifyAdminAuth } from "@/lib/apiAuth";
import { forceUploadTransparencyReport } from "@/lib/forceUploadTransparencyReport";
import { getAdminFirestore } from "@/lib/firebase-admin";

/**
 * Şeffaflık raporunu sadece Kurucu (super_admin) yayınlayabilir.
 */
async function isSuperAdmin(uid: string, request: NextRequest): Promise<boolean> {
  const host = request.headers.get("host") || request.headers.get("x-forwarded-host") || "";
  if (host.startsWith("localhost") || host.startsWith("127.0.0.1")) return true;

  const superUids = process.env.NEXT_PUBLIC_SUPER_ADMIN_UIDS?.trim();
  if (superUids && superUids.split(",").map((x) => x.trim()).includes(uid)) return true;
  const db = getAdminFirestore();
  if (!db) return false;
  const [adminsSnap, usersSnap] = await Promise.all([
    db.collection("admins").doc(uid).get(),
    db.collection("users").doc(uid).get(),
  ]);
  const adminsData = adminsSnap.data();
  if (adminsData?.is_founder || adminsData?.role === "SUPER_ADMIN") return true;
  return usersSnap.data()?.role === "super_admin";
}

/** Master key ile 'Overdrive' modu – root yetkisiyle yükleme */
function isMasterKeyValid(request: NextRequest, body?: { master_key?: string }): boolean {
  const masterKey = process.env.NABZ_MASTER_KEY?.trim();
  if (!masterKey) return false;
  const fromHeader = request.headers.get("x-nabz-master-key");
  const fromBody = body?.master_key;
  return fromHeader === masterKey || fromBody === masterKey;
}

/**
 * POST — Şeffaflık raporunu manuel tetikle, Storage + Firestore'a yükle.
 * Query: ?period=YYYY-MM (zorunlu)
 * Yetki: super_admin (Kurucu) VEYA NABZ_MASTER_KEY ile Overdrive modu.
 */
export async function POST(request: NextRequest) {
  try {
    let body: { master_key?: string } = {};
    try {
      const raw = await request.text();
      if (raw?.trim()) body = JSON.parse(raw) as { master_key?: string };
    } catch {}
    const useOverdrive = isMasterKeyValid(request, body);

    if (!useOverdrive) {
      const admin = await verifyAdminAuth(request);
      if (!admin) {
        return NextResponse.json({ ok: false, error: "Yetkisiz" }, { status: 401 });
      }
      const canPublish = await isSuperAdmin(admin.uid, request);
      if (!canPublish) {
        return NextResponse.json(
          { ok: false, error: "YETKİSİZ: Şeffaflık raporunu sadece Kurucu yayınlayabilir." },
          { status: 403 }
        );
      }
    }

    const period = request.nextUrl.searchParams.get("period");
    if (!period) {
      return NextResponse.json(
        { ok: false, error: "period gerekli (YYYY-MM)" },
        { status: 400 }
      );
    }

    const result = await forceUploadTransparencyReport(period);

    if (!result.ok) {
      return NextResponse.json(
        { ok: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      storagePath: result.storagePath,
      firestoreDoc: result.firestoreDoc,
      message: useOverdrive
        ? "Başarılı: Şeffaflık raporu 'Master Key' ile yüklendi."
        : "Rapor Kurucu yetkisiyle başarıyla yüklendi!",
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Sunucu hatası";
    console.error("force-upload-transparency-report:", e);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
