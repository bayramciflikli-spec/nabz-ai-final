import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

const SIZES = [32, 72, 96, 128, 144, 180, 192, 384, 512] as const;
type Size = (typeof SIZES)[number];

function isSize(s: string): s is string & `${Size}` {
  return SIZES.includes(Number(s) as Size);
}

/**
 * PWA ikonu: görseldeki logo (N + nabız + play) + altında "Nabz-AI" yazısı.
 * Mobil ve masaüstü ana ekrana eklendiğinde bu ikon kullanılır.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ size: string }> }
) {
  try {
    const { size: sizeParam } = await params;
    const size = parseInt(sizeParam, 10);
    if (!isSize(String(size)) || size <= 0) {
      return NextResponse.json({ error: "Geçersiz boyut" }, { status: 400 });
    }

    const logoPath = path.join(process.cwd(), "public", "nabz-ai-logo.png");
    let logoBase64: string;
    try {
      const logoBuffer = await readFile(logoPath);
      logoBase64 = logoBuffer.toString("base64");
    } catch {
      return NextResponse.json({ error: "Logo bulunamadı" }, { status: 404 });
    }

    const w = size;
    const h = size;
    // Maskable safe zone: içerik merkezin %80'inde (Android/iOS maskesinde kesilmez)
    const safe = 0.8;
    const pad = (1 - safe) / 2;
    const innerW = w * safe;
    const innerH = h * safe;
    const cx = innerW / 2;
    // Logo üstte ~%70, altında "Nabz-AI" yazısı
    const logoAreaH = innerH * 0.72;
    const textY = innerH * 0.88;
    const fontSize = Math.max(12, Math.floor(size * 0.08));

    const svg = `
<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <rect width="${w}" height="${h}" fill="#0a0a0a"/>
  <g transform="translate(${w * pad}, ${h * pad})">
    <image xlink:href="data:image/png;base64,${logoBase64}" href="data:image/png;base64,${logoBase64}" x="0" y="0" width="${innerW}" height="${logoAreaH}" preserveAspectRatio="xMidYMid meet"/>
    <text x="${cx}" y="${textY}" text-anchor="middle" fill="white" font-family="Arial Black, Arial, sans-serif" font-size="${fontSize}" font-weight="900" letter-spacing="0.04em">Nabz-AI</text>
  </g>
</svg>`;

    let sharp: typeof import("sharp").default;
    try {
      sharp = (await import("sharp")).default;
    } catch {
      return NextResponse.redirect(new URL("/nabz-ai-logo.png", request.url), 302);
    }

    const png = await sharp(Buffer.from(svg))
      .png()
      .toBuffer();

    return new NextResponse(new Uint8Array(png), {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=86400, immutable",
      },
    });
  } catch (e) {
    console.error("PWA icon error:", e);
    try {
      return NextResponse.redirect(new URL("/nabz-ai-logo.png", request.url), 302);
    } catch {
      return NextResponse.json({ error: "İkon oluşturulamadı" }, { status: 500 });
    }
  }
}
