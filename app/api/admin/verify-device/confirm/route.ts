import { NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase-admin";
import { verifyAdminAuth } from "@/lib/apiAuth";
import {
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_MAX_AGE_DAYS,
  COLLECTION_VERIFICATION_CODES,
  COLLECTION_SESSIONS,
  ADMIN_MAX_ATTEMPTS,
  ADMIN_LOCKOUT_MINUTES,
} from "@/lib/adminDeviceVerify";

export async function POST(request: Request) {
  try {
    const verified = await verifyAdminAuth(request);
    if (!verified) {
      return NextResponse.json({ ok: false, error: "Yetkisiz" }, { status: 401 });
    }
    const uid = verified.uid;

    const body = await request.json().catch(() => ({}));
    const code = typeof body.code === "string" ? body.code.trim().replace(/\D/g, "") : "";
    if (code.length < 6) {
      return NextResponse.json({ ok: false, error: "Geçerli 6 haneli kodu girin." }, { status: 400 });
    }

    const db = getAdminFirestore();
    if (!db) {
      return NextResponse.json({ ok: false, error: "Veritabanı kullanılamıyor" }, { status: 503 });
    }

    const codesRef = db.collection(COLLECTION_VERIFICATION_CODES).doc(uid);
    const codeSnap = await codesRef.get();
    const codeData = codeSnap.data();
    const rawLocked = codeData?.lockedUntil;
    const lockedUntil =
      typeof rawLocked === "number"
        ? rawLocked
        : (rawLocked as { toMillis?: () => number } | undefined)?.toMillis?.() ?? 0;
    if (Date.now() < lockedUntil) {
      const mins = Math.ceil((lockedUntil - Date.now()) / 60000);
      return NextResponse.json(
        { ok: false, error: `Çok fazla yanlış deneme. ${mins} dakika sonra tekrar deneyin.` },
        { status: 429 }
      );
    }

    const storedCode = codeData?.code;
    const expiresAt = typeof codeData?.expiresAt === "number" ? codeData.expiresAt : 0;
    if (!storedCode || Date.now() > expiresAt) {
      return NextResponse.json({ ok: false, error: "Kod süresi doldu veya geçersiz. Yeni kod isteyin." }, { status: 400 });
    }

    const attempts = (codeData?.attempts as number) ?? 0;
    if (attempts >= ADMIN_MAX_ATTEMPTS) {
      const locked = Date.now() + ADMIN_LOCKOUT_MINUTES * 60 * 1000;
      await codesRef.update({ lockedUntil: locked });
      return NextResponse.json(
        { ok: false, error: `Çok fazla yanlış deneme. ${ADMIN_LOCKOUT_MINUTES} dakika sonra tekrar deneyin.` },
        { status: 429 }
      );
    }

    if (code !== storedCode) {
      await codesRef.update({ attempts: attempts + 1 });
      return NextResponse.json({ ok: false, error: "Kod hatalı. Tekrar deneyin." }, { status: 400 });
    }

    const sessionId = crypto.randomUUID();
    const expiresAtSession = Date.now() + ADMIN_SESSION_MAX_AGE_DAYS * 24 * 60 * 60 * 1000;
    await db.collection(COLLECTION_SESSIONS).doc(sessionId).set({
      userId: uid,
      createdAt: Date.now(),
      expiresAt: expiresAtSession,
    });

    await codesRef.delete();

    const res = NextResponse.json({ ok: true });
    res.cookies.set(ADMIN_SESSION_COOKIE, sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: ADMIN_SESSION_MAX_AGE_DAYS * 24 * 60 * 60,
      path: "/",
    });
    return res;
  } catch (e) {
    console.error("[verify-device/confirm]", e);
    return NextResponse.json({ ok: false, error: "Sunucu hatası" }, { status: 500 });
  }
}
