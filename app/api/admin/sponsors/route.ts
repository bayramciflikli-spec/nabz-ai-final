import { NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase-admin";
import { verifyAdminAuth } from "@/lib/apiAuth";

export interface SponsorDoc {
  id: string;
  companyName: string;
  package: string;
  globalSalesMonthly: string;
  commissionPercent: number;
  commissionAmount: string;
  paymentStatus: "completed" | "pending" | "rejected";
  createdAt?: string;
}

export async function GET(request: Request) {
  try {
    const admin = await verifyAdminAuth(request);
    if (!admin) {
      return NextResponse.json({ ok: false, error: "Yetkisiz" }, { status: 401 });
    }

    const adminDb = getAdminFirestore();
    if (!adminDb) {
      return NextResponse.json(
        { ok: false, error: "Firestore yapılandırılmamış" },
        { status: 503 }
      );
    }

    const snap = await adminDb.collection("sponsors").orderBy("createdAt", "desc").get();
    const sponsors: SponsorDoc[] = snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        companyName: data.companyName ?? "",
        package: data.package ?? "",
        globalSalesMonthly: data.globalSalesMonthly ?? "",
        commissionPercent: data.commissionPercent ?? 10,
        commissionAmount: data.commissionAmount ?? "",
        paymentStatus: (data.paymentStatus as "completed" | "pending" | "rejected") ?? "pending",
        createdAt: data.createdAt,
      };
    });

    const totalSponsorship = sponsors.reduce((s, sp) => {
      const amt = parseFloat(sp.commissionAmount.replace(/[^0-9.]/g, "")) || 0;
      return s + amt;
    }, 0);
    const pendingCount = sponsors.filter((s) => s.paymentStatus === "pending").length;

    return NextResponse.json({
      ok: true,
      sponsors,
      summary: {
        totalSponsorship: `$${totalSponsorship.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
        activeCompanies: sponsors.length,
        pendingPayments: pendingCount,
      },
    });
  } catch (e: unknown) {
    console.error("sponsors GET:", e);
    const message = e instanceof Error ? e.message : "Sunucu hatası";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const admin = await verifyAdminAuth(request);
    if (!admin) {
      return NextResponse.json({ ok: false, error: "Yetkisiz" }, { status: 401 });
    }

    const adminDb = getAdminFirestore();
    if (!adminDb) {
      return NextResponse.json(
        { ok: false, error: "Firestore yapılandırılmamış" },
        { status: 503 }
      );
    }

    let body: Record<string, unknown> = {};
    try {
      const raw = await request.text();
      if (raw?.trim()) body = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ ok: false, error: "Geçersiz istek" }, { status: 400 });
    }
    const companyName = (body.companyName as string)?.trim();
    const pkg = (body.package as string)?.trim() || "$20,000 (Yıllık)";
    const globalSalesMonthly = (body.globalSalesMonthly as string) ?? "$0";
    const commissionPercent = (body.commissionPercent as number) ?? 10;
    let commissionAmount = body.commissionAmount as string | undefined;
    if (!commissionAmount) {
      const salesNum = parseFloat(globalSalesMonthly.replace(/[^0-9.]/g, "")) || 0;
      const pkgNum = parseFloat(pkg.replace(/[^0-9.]/g, "")) || 0;
      const base = salesNum > 0 ? salesNum : pkgNum;
      commissionAmount = `$${(base * (commissionPercent / 100)).toLocaleString("en-US", { minimumFractionDigits: 0 })}`;
    }

    if (!companyName) {
      return NextResponse.json(
        { ok: false, error: "Şirket adı gerekli" },
        { status: 400 }
      );
    }

    const docRef = await adminDb.collection("sponsors").add({
      companyName,
      package: pkg,
      globalSalesMonthly,
      commissionPercent,
      commissionAmount,
      paymentStatus: "pending",
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({
      ok: true,
      id: docRef.id,
      message: "Sponsor eklendi",
    });
  } catch (e: unknown) {
    console.error("sponsors POST:", e);
    const message = e instanceof Error ? e.message : "Sunucu hatası";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
