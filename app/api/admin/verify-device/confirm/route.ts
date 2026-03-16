import { NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase-admin";
import { verifyAdminAuth } from "@/lib/apiAuth";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(request: Request) {
  try {
    const verified = await verifyAdminAuth(request);
    if (!verified) {
      return NextResponse.json({ ok: false, error: "Yetkisiz" }, { status: 401 });
    }
    const { uid } = verified;

    const body = await request.json().catch(() => ({}));
    const deviceId = typeof body.deviceId === "string" ? body.deviceId.trim() : "";
    const code = typeof body.code === "string" ? body.code.trim() : "";
    if (!deviceId || !code) {
      return NextResponse.json({ ok: false, error: "deviceId ve code gerekli" }, { status: 400 });
    }

    const db = getAdminFirestore();
    if (!db) {
      return NextResponse.json({ ok: false, error: "Veritabanı kullanılamıyor" }, { status: 503 });
    }

    const docId = `${uid}_${deviceId.replace(/\//g, "_")}`;
    const codeRef = db.collection("admin_verification_codes").doc(docId);
    const codeSnap = await codeRef.get();
    if (!codeSnap.exists) {
      return NextResponse.json({ ok: false, error: "Kod bulunamadı veya süresi doldu. Yeni kod isteyin." }, { status: 400 });
    }

    const data = codeSnap.data();
    const storedCode = data?.code;
    const expiresAt = data?.expiresAt?.toMillis?.() ?? 0;
    if (storedCode !== code) {
      return NextResponse.json({ ok: false, error: "Yanlış kod" }, { status: 400 });
    }
    if (Date.now() > expiresAt) {
      await codeRef.delete();
      return NextResponse.json({ ok: false, error: "Kodun süresi doldu. Yeni kod isteyin." }, { status: 400 });
    }

    const devicesRef = db.collection("admin_trusted_devices").doc(uid);
    await devicesRef.set(
      { deviceIds: FieldValue.arrayUnion(deviceId), updatedAt: FieldValue.serverTimestamp() },
      { merge: true }
    );
    await codeRef.delete();

    return NextResponse.json({ ok: true, message: "Cihaz onaylandı" });
  } catch (e) {
    console.error("[verify-device/confirm]", e);
    return NextResponse.json({ ok: false, error: "Sunucu hatası" }, { status: 500 });
  }
}
