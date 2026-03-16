import { NextRequest, NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase-admin";
import { verifyApiAuth } from "@/lib/apiAuth";
import { isAdmin } from "@/lib/isAdmin";
import { ADMIN_SESSION_COOKIE, COLLECTION_SESSIONS } from "@/lib/adminDeviceVerify";

function getSystemUids(): string[] {
  const raw = process.env.NEXT_PUBLIC_ADMIN_UIDS ?? "";
  return raw.split(",").map((id) => id.replace(/['"]+/g, "").trim()).filter(Boolean);
}

export async function GET(request: NextRequest) {
  try {
    const verified = await verifyApiAuth(request);
    if (!verified) {
      return NextResponse.json({ ok: false, verified: false }, { status: 401 });
    }

    const gelenUid = verified.uid.trim();
    if (!isAdmin(gelenUid)) {
      const sistemdekiUids = getSystemUids();
      console.error("[verify-device/status] UID eşleşmedi. Sistemdeki UID:", JSON.stringify(sistemdekiUids), "| Gelen UID:", JSON.stringify(gelenUid));
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

    if ((userId ?? "").trim() !== gelenUid || Date.now() > expiresAt) {
      return NextResponse.json({ ok: true, verified: false });
    }

    return NextResponse.json({ ok: true, verified: true });
  } catch (e) {
    console.error("[verify-device/status]", e);
    return NextResponse.json({ ok: false, verified: false }, { status: 500 });
  }
}
