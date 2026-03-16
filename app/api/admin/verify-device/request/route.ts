import { NextResponse } from "next/server";
import { Resend } from "resend";
import { getAuth } from "firebase-admin/auth";
import { getAdminFirestore } from "@/lib/firebase-admin";
import { verifyAdminAuth } from "@/lib/apiAuth";

const CODE_TTL_MS = 10 * 60 * 1000; // 10 dakika

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

export async function POST(request: Request) {
  try {
    const verified = await verifyAdminAuth(request);
    if (!verified) {
      return NextResponse.json({ ok: false, error: "Yetkisiz" }, { status: 401 });
    }
    const { uid } = verified;

    const body = await request.json().catch(() => ({}));
    const deviceId = typeof body.deviceId === "string" ? body.deviceId.trim() : "";
    if (!deviceId) {
      return NextResponse.json({ ok: false, error: "deviceId gerekli" }, { status: 400 });
    }

    const db = getAdminFirestore();
    if (!db) {
      return NextResponse.json({ ok: false, error: "Veritabanı kullanılamıyor" }, { status: 503 });
    }

    let email: string | null = null;
    try {
      const auth = getAuth();
      const userRecord = await auth.getUser(uid);
      email = userRecord.email ?? null;
    } catch (e) {
      console.error("[verify-device/request] getUser error:", e);
      return NextResponse.json({ ok: false, error: "E-posta alınamadı" }, { status: 500 });
    }

    if (!email) {
      return NextResponse.json({ ok: false, error: "Hesabınızda e-posta yok; admin doğrulama yapılamaz." }, { status: 400 });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + CODE_TTL_MS);

    const docId = `${uid}_${deviceId.replace(/\//g, "_")}`;
    await db.collection("admin_verification_codes").doc(docId).set({
      code,
      expiresAt,
      uid,
      deviceId,
    });

    const resend = getResend();
    if (!resend) {
      return NextResponse.json({ ok: false, error: "E-posta servisi yapılandırılmamış" }, { status: 503 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.nabz-ai.com";
    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM || "NABZ AI <onboarding@resend.dev>",
      to: email,
      subject: "[NABZ-AI] Admin giriş doğrulama kodu",
      html: `
        <h2>Admin giriş doğrulama</h2>
        <p>Yeni bir cihazdan Kontrol Kulesi'ne giriş denemesi yapıldı. Doğrulama kodunuz:</p>
        <p style="font-size:24px;font-weight:bold;letter-spacing:4px;">${code}</p>
        <p>Bu kodu uygulamada "Kodu gir" alanına yazın. Kod 10 dakika geçerlidir.</p>
        <p>Bu işlemi siz yapmadıysanız hesabınızı güvenceye alın ve şifrenizi değiştirin.</p>
        <p style="color:#888;font-size:12px;">NABZ-AI Admin – ${appUrl}</p>
      `,
    });

    if (error) {
      console.error("[verify-device/request] Resend error:", error);
      return NextResponse.json({ ok: false, error: "E-posta gönderilemedi" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, message: "Kod e-posta adresinize gönderildi" });
  } catch (e) {
    console.error("[verify-device/request]", e);
    return NextResponse.json({ ok: false, error: "Sunucu hatası" }, { status: 500 });
  }
}
