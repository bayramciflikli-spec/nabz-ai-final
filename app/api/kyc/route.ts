import { NextResponse } from "next/server";
import { verifyApiAuth } from "@/lib/apiAuth";
import { submitKYC } from "@/lib/submitKYC";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png"];

/**
 * POST multipart/form-data: idFile, selfieFile
 * KYC başvurusu — sadece giriş yapmış kullanıcı kendi adına başvurabilir.
 */
export async function POST(request: Request) {
  try {
    const user = await verifyApiAuth(request);
    if (!user) {
      return NextResponse.json({ ok: false, error: "Giriş gerekli" }, { status: 401 });
    }

    const formData = await request.formData();
    const idFile = formData.get("idFile") as File | null;
    const selfieFile = formData.get("selfieFile") as File | null;

    if (!idFile || !selfieFile) {
      return NextResponse.json(
        { ok: false, error: "Kimlik ve selfie dosyası gerekli" },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(idFile.type) || !ALLOWED_TYPES.includes(selfieFile.type)) {
      return NextResponse.json(
        { ok: false, error: "Sadece JPG veya PNG formatı kabul edilir" },
        { status: 400 }
      );
    }

    if (idFile.size > MAX_FILE_SIZE || selfieFile.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { ok: false, error: "Dosya boyutu max 5MB olmalı" },
        { status: 400 }
      );
    }

    const idBuffer = Buffer.from(await idFile.arrayBuffer());
    const selfieBuffer = Buffer.from(await selfieFile.arrayBuffer());

    await submitKYC(
      user.uid,
      idBuffer,
      selfieBuffer,
      idFile.type,
      selfieFile.type
    );

    return NextResponse.json({
      ok: true,
      message: "KYC başvurunuz alındı. İnceleme sürecinde bildirileceksiniz.",
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Sunucu hatası";
    console.error("kyc:", e);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
