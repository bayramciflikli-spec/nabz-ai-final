import { NextRequest, NextResponse } from "next/server";
import { verifyApiAuth } from "@/lib/apiAuth";
import { isValidUrl, rateLimit } from "@/lib/security";
import {
  checkImageCopyright,
  checkAudioVideoCopyright,
  type CopyrightResult,
} from "@/lib/copyrightCheck";

/**
 * Telif kontrolü API - Auth + rate limit korumalı
 * TinEye (görsel) ve ACRCloud (ses/video) entegrasyonu
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyApiAuth(request);
    if (!auth) {
      return NextResponse.json({ error: "Giriş yapmanız gerekiyor." }, { status: 401 });
    }

    if (!rateLimit(`copyright:${auth.uid}`)) {
      return NextResponse.json({ error: "Çok fazla istek." }, { status: 429 });
    }

    let body: { imageUrl?: string; videoUrl?: string; type?: "image" | "video" | "audio" } = {};
    try {
      const raw = await request.text();
      if (raw?.trim()) body = JSON.parse(raw) as typeof body;
    } catch {
      return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 });
    }
    const { imageUrl, videoUrl, type } = body;

    if (imageUrl && !isValidUrl(imageUrl)) {
      return NextResponse.json({ ok: false, message: "Geçersiz görsel URL" }, { status: 400 });
    }
    if (videoUrl && !isValidUrl(videoUrl)) {
      return NextResponse.json({ ok: false, message: "Geçersiz video URL" }, { status: 400 });
    }

    let result: CopyrightResult = { passed: true, ai_report: "Clean", provider: "none" };

    if (imageUrl) {
      result = await checkImageCopyright(imageUrl);
    }
    if (videoUrl && result.passed) {
      const videoResult = await checkAudioVideoCopyright(videoUrl);
      if (!videoResult.passed) result = videoResult;
      else if (videoResult.ai_report === "Flagged") result = videoResult;
      else if (videoResult.ai_report === "Review" && result.ai_report === "Clean") result = videoResult;
    }

    return NextResponse.json({
      ok: result.passed,
      message: result.passed ? "İçerik telif kontrolü yapıldı." : "Telif ihlali tespit edildi.",
      passed: result.passed,
      ai_report: result.ai_report,
    });
  } catch (error: unknown) {
    console.error("[check-copyright]", error);
    return NextResponse.json(
      { ok: false, message: "Telif kontrolü sırasında hata oluştu." },
      { status: 500 }
    );
  }
}
