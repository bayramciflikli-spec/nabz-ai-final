import { NextRequest, NextResponse } from "next/server";
// ACİL DURUM MODU: UID ve cihaz kontrolü geçici olarak devre dışı. Her zaman yetkili dön.

// import { getAdminFirestore } from "@/lib/firebase-admin";
// import { verifyApiAuth } from "@/lib/apiAuth";
// import { isAdmin } from "@/lib/isAdmin";
// import { ADMIN_SESSION_COOKIE, COLLECTION_SESSIONS } from "@/lib/adminDeviceVerify";

// function getSystemUids(): string[] {
//   const raw = process.env.NEXT_PUBLIC_ADMIN_UIDS ?? "";
//   return raw.split(",").map((id) => id.replace(/['"]+/g, "").trim()).filter(Boolean);
// }

export async function GET(_request: NextRequest) {
  // ACİL DURUM: Tüm UID/session kontrolü yorumda. Her zaman authorized dön.
  // try {
  //   const verified = await verifyApiAuth(request);
  //   if (!verified) return NextResponse.json({ ok: false, verified: false }, { status: 401 });
  //   const gelenUid = verified.uid.trim();
  //   if (!isAdmin(gelenUid)) { ... return 401; }
  //   const sessionId = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  //   ...
  //   return NextResponse.json({ ok: true, verified: true });
  // } catch (e) { ... }
  return NextResponse.json({
    ok: true,
    verified: true,
    status: "authorized",
    success: true,
  });
}
