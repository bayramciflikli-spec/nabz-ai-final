import { NextResponse } from "next/server";
import { Resend } from "resend";
import { getAdminFirestore } from "@/lib/firebase-admin";
import { getContentViews, GLOBAL_PROMOTION_VIEWS_THRESHOLD } from "@/lib/contentDistribution";
import { verifyApiAuth } from "@/lib/apiAuth";
import { isAdmin } from "@/lib/isAdmin";

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

async function sendNotifyEmail() {

  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail || !process.env.RESEND_API_KEY) {
    return { ok: false, error: "ADMIN_EMAIL veya RESEND_API_KEY tanımlı değil", status: 503 as const };
  }

  let pendingCount = 0;
  let pendingPayments = 0;

  const adminDb = getAdminFirestore();
  if (adminDb) {
    const projectsSnap = await adminDb.collection("projects").get();
    projectsSnap.docs.forEach((d) => {
        const data = d.data();
        const dist = data?.distribution as string | undefined;
        const likedBy = (data?.likedBy as string[]) ?? [];
        const views = getContentViews({
          id: d.id,
          likedBy,
          views: data?.views,
          kategori: data?.kategori,
          isAdult: data?.isAdult,
        });
        if (
          views >= GLOBAL_PROMOTION_VIEWS_THRESHOLD &&
          (dist === "local" || !dist || dist === undefined)
        ) {
          pendingCount++;
        }
      });

    const sponsorsSnap = await adminDb.collection("sponsors").where("paymentStatus", "==", "pending").get();
    pendingPayments = sponsorsSnap.size;
  }

  if (pendingCount === 0 && pendingPayments === 0) {
    return { ok: true, sent: false, message: "Bekleyen işlem yok" };
  }

  const resend = getResend();
  if (!resend) {
    return { ok: false, error: "ADMIN_EMAIL veya RESEND_API_KEY tanımlı değil", status: 503 as const };
  }

  const html = `
      <h2>NABZ-AI Admin Bildirimi</h2>
      <p>Onay bekleyen işlemler:</p>
      <ul>
        <li><strong>İçerik onayı:</strong> ${pendingCount} adet</li>
        <li><strong>Ödeme onayı:</strong> ${pendingPayments} adet</li>
      </ul>
      <p><a href="${process.env.NEXT_PUBLIC_APP_URL || "https://nabz-rmyhxkg8k-bayramciflikli-1198s-projects.vercel.app"}/admin/global-control">Global Kontrol</a> | 
      <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://nabz-rmyhxkg8k-bayramciflikli-1198s-projects.vercel.app"}/admin/financial">Financial Hub</a></p>
      <p style="color:#888;font-size:12px;">Otomatik bildirim - NABZ-AI Admin</p>
    `;

  const { error } = await resend.emails.send({
    from: process.env.RESEND_FROM || "NABZ AI <onboarding@resend.dev>",
    to: adminEmail,
    subject: `[NABZ-AI] ${pendingCount + pendingPayments} işlem onay bekliyor`,
    html,
  });

  if (error) {
    console.error("Resend error:", error);
    return { ok: false, error: error.message, status: 500 as const };
  }

  return { ok: true, sent: true };
}

/**
 * GET: Vercel Cron (CRON_SECRET ile)
 * POST: Manuel (Firebase token + admin UID ile)
 */
export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const result = await sendNotifyEmail();
    const status = "status" in result ? result.status : 200;
    return NextResponse.json(
      { ok: result.ok, sent: result.sent, error: result.error, message: result.message },
      { status: result.ok ? 200 : (status as number) }
    );
  } catch (e: unknown) {
    console.error("notify-email:", e);
    const message = e instanceof Error ? e.message : "Sunucu hatası";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const verified = await verifyApiAuth(request);
    if (!verified || !isAdmin(verified.uid)) {
      return NextResponse.json({ ok: false, error: "Yetkisiz" }, { status: 401 });
    }

    const result = await sendNotifyEmail();
    const status = "status" in result ? result.status : 200;
    return NextResponse.json(
      { ok: result.ok, sent: result.sent, error: result.error, message: result.message },
      { status: result.ok ? 200 : (status as number) }
    );
  } catch (e: unknown) {
    console.error("notify-email:", e);
    const message = e instanceof Error ? e.message : "Sunucu hatası";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
