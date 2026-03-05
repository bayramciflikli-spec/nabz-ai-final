import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { LEGAL_EMAIL } from "@/lib/legalContact";

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

/**
 * GET: DMCA form sisteminin yapılandırılıp yapılandırılmadığını döner.
 */
export async function GET() {
  const configured = !!(process.env.RESEND_API_KEY && process.env.ADMIN_EMAIL);
  return NextResponse.json({
    configured,
    email: LEGAL_EMAIL,
  });
}

/**
 * DMCA / Telif ihlali bildirimi – form gönderimini e-posta ile iletir.
 */
export async function POST(request: NextRequest) {
  try {
    let body: { workDescription?: string; contentUrl?: string; contactEmail?: string; declaration?: boolean } = {};
    try {
      const raw = await request.text();
      if (raw?.trim()) body = JSON.parse(raw) as typeof body;
    } catch {
      return NextResponse.json({ ok: false, error: "Geçersiz istek" }, { status: 400 });
    }
    const { workDescription, contentUrl, contactEmail, declaration } = body;

    if (!workDescription?.trim() || !contentUrl?.trim() || !contactEmail?.trim()) {
      return NextResponse.json(
        { ok: false, error: "Eser tanımı, içerik URL'si ve iletişim e-postası gerekli." },
        { status: 400 }
      );
    }

    if (!declaration) {
      return NextResponse.json(
        { ok: false, error: "Telif sahibi veya yetkili olduğunuzu onaylamanız gerekiyor." },
        { status: 400 }
      );
    }

    const adminEmail = process.env.ADMIN_EMAIL || process.env.NEXT_PUBLIC_LEGAL_EMAIL;
    if (!adminEmail || !process.env.RESEND_API_KEY) {
      return NextResponse.json(
        {
          ok: false,
          error: "Bildirim sistemi yapılandırılmamış. Lütfen aşağıdaki 'E-posta ile Gönder' butonunu kullanın.",
          fallbackEmail: LEGAL_EMAIL,
        },
        { status: 503 }
      );
    }

    const html = `
      <h2>DMCA / Telif İhlali Bildirimi</h2>
      <p><strong>İhlal edildiği iddia edilen eser:</strong></p>
      <p>${workDescription.replace(/</g, "&lt;")}</p>
      <p><strong>İhlal içeriğinin URL'si:</strong></p>
      <p><a href="${contentUrl}">${contentUrl}</a></p>
      <p><strong>Bildirici iletişim:</strong> ${contactEmail.replace(/</g, "&lt;")}</p>
      <p><strong>Bildirim zamanı:</strong> ${new Date().toISOString()}</p>
      <hr>
      <p style="color:#888;font-size:12px;">Bu bildirim NABZ-AI DMCA formu üzerinden gönderilmiştir.</p>
    `;

    const resend = getResend();
    if (!resend) {
      return NextResponse.json(
        {
          ok: false,
          error: "Bildirim sistemi yapılandırılmamış. Lütfen aşağıdaki 'E-posta ile Gönder' butonunu kullanın.",
          fallbackEmail: LEGAL_EMAIL,
        },
        { status: 503 }
      );
    }
    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM || "NABZ AI <onboarding@resend.dev>",
      to: adminEmail,
      replyTo: contactEmail,
      subject: "[NABZ-AI] DMCA / Telif İhlali Bildirimi",
      html,
    });

    if (error) {
      console.error("[dmca-report]", error);
      return NextResponse.json(
        { ok: false, error: "Bildirim gönderilemedi. Lütfen daha sonra tekrar deneyin." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Bildiriminiz alındı. En kısa sürede değerlendirilecektir.",
    });
  } catch (e: unknown) {
    console.error("[dmca-report]", e);
    return NextResponse.json(
      { ok: false, error: "Sunucu hatası." },
      { status: 500 }
    );
  }
}
