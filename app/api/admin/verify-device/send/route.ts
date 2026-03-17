import { NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { Resend } from "resend";
import { getAdminFirestore } from "@/lib/firebase-admin";
import { verifyAdminAuth } from "@/lib/apiAuth";
import {
  COLLECTION_VERIFICATION_CODES,
  ADMIN_CODE_EXPIRY_MINUTES,
  ADMIN_CODE_LENGTH,
  ADMIN_SEND_COOLDOWN_SECONDS,
} from "@/lib/adminDeviceVerify";

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

function generateCode(): string {
  const digits = "0123456789";
  let code = "";
  for (let i = 0; i < ADMIN_CODE_LENGTH; i++) {
    code += digits[Math.floor(Math.random() * digits.length)];
  }
  return code;
}

export async function POST(request: Request) {
  try {
    const verified = await verifyAdminAuth(request);
    if (!verified) {
      return NextResponse.json({ ok: false, error: "Yetkisiz" }, { status: 401 });
    }
    const uid = verified.uid;

    const db = getAdminFirestore();
    if (!db) {
      return NextResponse.json({ ok: false, error: "Veritabanı kullanılamıyor" }, { status: 503 });
    }

    const codesRef = db.collection(COLLECTION_VERIFICATION_CODES).doc(uid);
    const existing = await codesRef.get();
    const data = existing.data();
    const lastSent =
      typeof data?.lastSentAt === "number"
        ? data.lastSentAt
        : (data?.lastSentAt as { toMillis?: () => number } | undefined)?.toMillis?.() ?? 0;
    const now = Date.now();
    if (now - lastSent < ADMIN_SEND_COOLDOWN_SECONDS * 1000) {
      const wait = Math.ceil((ADMIN_SEND_COOLDOWN_SECONDS * 1000 - (now - lastSent)) / 1000);
      return NextResponse.json(
        { ok: false, error: `Lütfen ${wait} saniye sonra tekrar kod isteyin.` },
        { status: 429 }
      );
    }

    let email: string | null = null;
    try {
      const auth = getAuth();
      const userRecord = await auth.getUser(uid);
      email = userRecord.email ?? null;
    } catch {
      // Firebase Admin başlatılmamış veya kullanıcı yok
    }
    if (!email) {
      return NextResponse.json(
        { ok: false, error: "E-posta adresiniz bulunamadı. Giriş yaptığınız hesabın e-postası kullanılır." },
        { status: 400 }
      );
    }

    const code = generateCode();
    const expiresAt = new Date(now + ADMIN_CODE_EXPIRY_MINUTES * 60 * 1000);

    await codesRef.set({
      code,
      email,
      expiresAt: expiresAt.getTime(),
      lastSentAt: now,
      attempts: 0,
    });

    const resend = getResend();
    if (!resend) {
      return NextResponse.json({ ok: false, error: "E-posta servisi yapılandırılmamış" }, { status: 503 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://nabz-rmyhxkg8k-bayramciflikli-1198s-projects.vercel.app";
    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM || "NABZ AI <onboarding@resend.dev>",
      to: email,
      subject: "[NABZ-AI] Admin paneli giriş doğrulama kodu",
      html: `
        <h2>Admin paneli doğrulama kodu</h2>
        <p>Yeni bir cihazdan Kontrol Kulesi'ne giriş denemesi yapıldı. Doğrulama kodunuz:</p>
        <p style="font-size:24px;letter-spacing:4px;font-weight:bold;">${code}</p>
        <p>Bu kodu uygulamada açılan "Kodu gir" alanına yazın. Kod ${ADMIN_CODE_EXPIRY_MINUTES} dakika geçerlidir.</p>
        <p>Bu işlemi siz yapmadıysanız hesabınızı güvenceye alın ve şifrenizi değiştirin.</p>
        <p style="color:#888;font-size:12px;">NABZ-AI Admin – ${appUrl}</p>
      `,
    });

    if (error) {
      console.error("[verify-device/send] Resend error:", error);
      return NextResponse.json({ ok: false, error: "E-posta gönderilemedi" }, { status: 500 });
    }

    const masked = email.replace(/(.{2})(.*)(@.*)/, "$1***$3");
    return NextResponse.json({
      ok: true,
      message: `Kod ${masked} adresine gönderildi.`,
    });
  } catch (e) {
    console.error("[verify-device/send]", e);
    return NextResponse.json({ ok: false, error: "Sunucu hatası" }, { status: 500 });
  }
}
