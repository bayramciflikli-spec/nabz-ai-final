import { NextRequest, NextResponse } from "next/server";
import { verifyAdminAuth } from "@/lib/apiAuth";
import {
  getBannedTerms,
  addBannedTerm,
  removeBannedTerm,
  seedBannedTermsIfEmpty,
} from "@/lib/bannedTermsStorage";

/**
 * GET: Yasaklı terim listesi (admin)
 */
export async function GET(request: NextRequest) {
  try {
    const admin = await verifyAdminAuth(request);
    if (!admin) {
      return NextResponse.json({ ok: false, error: "Yetkisiz" }, { status: 401 });
    }
    const { terms, fromFirestore } = await getBannedTerms();
    return NextResponse.json({ ok: true, terms, fromFirestore });
  } catch (e: unknown) {
    console.error("[admin/banned-terms]", e);
    return NextResponse.json({ ok: false, error: "Hata" }, { status: 500 });
  }
}

/**
 * POST: Terim ekle. Body: { term: string }
 * DELETE: Terim sil. Body: { term: string }
 * PATCH: Seed (boşsa varsayılan listeyi doldur)
 */
export async function POST(request: NextRequest) {
  try {
    const admin = await verifyAdminAuth(request);
    if (!admin) {
      return NextResponse.json({ ok: false, error: "Yetkisiz" }, { status: 401 });
    }
    let body: { term?: string } = {};
    try {
      const raw = await request.text();
      if (raw?.trim()) body = JSON.parse(raw) as { term?: string };
    } catch {
      return NextResponse.json({ ok: false, error: "Geçersiz istek" }, { status: 400 });
    }
    const term = body?.term;
    if (!term?.trim()) {
      return NextResponse.json({ ok: false, error: "term gerekli" }, { status: 400 });
    }
    const result = await addBannedTerm(term);
    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
    }
    const { terms } = await getBannedTerms();
    return NextResponse.json({ ok: true, terms });
  } catch (e: unknown) {
    console.error("[admin/banned-terms POST]", e);
    return NextResponse.json({ ok: false, error: "Hata" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const admin = await verifyAdminAuth(request);
    if (!admin) {
      return NextResponse.json({ ok: false, error: "Yetkisiz" }, { status: 401 });
    }
    let body: { term?: string } = {};
    try {
      const raw = await request.text();
      if (raw?.trim()) body = JSON.parse(raw) as { term?: string };
    } catch {
      return NextResponse.json({ ok: false, error: "Geçersiz istek" }, { status: 400 });
    }
    const term = body?.term;
    if (!term?.trim()) {
      return NextResponse.json({ ok: false, error: "term gerekli" }, { status: 400 });
    }
    const result = await removeBannedTerm(term);
    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
    }
    const { terms } = await getBannedTerms();
    return NextResponse.json({ ok: true, terms });
  } catch (e) {
    console.error("[admin/banned-terms DELETE]", e);
    return NextResponse.json({ ok: false, error: "Hata" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const admin = await verifyAdminAuth(request);
    if (!admin) {
      return NextResponse.json({ ok: false, error: "Yetkisiz" }, { status: 401 });
    }
    await seedBannedTermsIfEmpty();
    const { terms } = await getBannedTerms();
    return NextResponse.json({ ok: true, terms, message: "Seed tamamlandı" });
  } catch (e: unknown) {
    console.error("[admin/banned-terms PATCH]", e);
    return NextResponse.json({ ok: false, error: "Hata" }, { status: 500 });
  }
}
