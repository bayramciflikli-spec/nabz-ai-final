import { NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase-admin";
import { verifyAdminAuth } from "@/lib/apiAuth";
import { ADMIN_SESSION_COOKIE, COLLECTION_SESSIONS } from "@/lib/adminDeviceVerify";

export async function GET(request: Request) {
  try {
    const verified = await verifyAdminAuth(request);
    if (!verified) {
      return NextResponse.json({ ok: false, verified: false }, { status: 401 });
    }

    const sessionId = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
    if (!sessionId) {
      return NextResponse.json({ ok: true, verified: false });
    }

    const db = getAdminFirestore();
    if (!db) {
      return NextResponse.json({ ok: true, verified: false });
    }

    const sessionRef = db.collection(COLLECTION_SESSIONS).doc(sessionId);
    const sessionSnap = await sessionRef.get();
    const data = sessionSnap.data();
    const userId = data?.userId;
    const expiresAt =
      typeof data?.expiresAt === "number"
        ? data.expiresAt
        : (data?.expiresAt as { toMillis?: () => number })?.toMillis?.() ?? 0;

    if (userId !== verified.uid || Date.now() > expiresAt) {
      return NextResponse.json({ ok: true, verified: false });
    }

    return NextResponse.json({ ok: true, verified: true });
  } catch (e) {
    console.error("[verify-device/status]", e);
    return NextResponse.json({ ok: false, verified: false }, { status: 500 });
  }
}
