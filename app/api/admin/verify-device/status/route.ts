import { NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase-admin";
import { verifyAdminAuth } from "@/lib/apiAuth";

export async function GET(request: Request) {
  try {
    const verified = await verifyAdminAuth(request);
    if (!verified) {
      return NextResponse.json({ ok: false, trusted: false }, { status: 401 });
    }
    const { uid } = verified;

    const url = new URL(request.url);
    const deviceId = url.searchParams.get("deviceId")?.trim() ?? "";
    if (!deviceId) {
      return NextResponse.json({ ok: true, trusted: false });
    }

    const db = getAdminFirestore();
    if (!db) {
      return NextResponse.json({ ok: true, trusted: false });
    }

    const doc = await db.collection("admin_trusted_devices").doc(uid).get();
    const data = doc.data();
    const deviceIds: string[] = Array.isArray(data?.deviceIds) ? data.deviceIds : [];
    const trusted = deviceIds.includes(deviceId);

    return NextResponse.json({ ok: true, trusted });
  } catch (e) {
    console.error("[verify-device/status]", e);
    return NextResponse.json({ ok: false, trusted: false }, { status: 500 });
  }
}
