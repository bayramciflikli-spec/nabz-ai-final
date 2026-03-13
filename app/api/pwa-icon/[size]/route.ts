import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

const SIZES = [32, 72, 96, 128, 144, 180, 192, 384, 512] as const;
type Size = (typeof SIZES)[number];

function isSize(s: string): s is string & `${Size}` {
  return SIZES.includes(Number(s) as Size);
}

/**
 * PWA ikonu: oval logo + altında "NABZ-AI" yazısı.
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

    const logoPath = path.join(process.cwd(), "public", "logo.png");
    let logoBase64: string;
    try {
      const logoBuffer = await readFile(logoPath);
      logoBase64 = logoBuffer.toString("base64");
    } catch {
      return NextResponse.json({ error: "Logo bulunamadı" }, { status: 404 });
    }

    const w = size;
    const h = size;
    const cx = w / 2;
    const cy = Math.floor(h * 0.38);
    const rx = Math.floor(w * 0.38);
    const ry = Math.floor(h * 0.28);
    const logoY = Math.floor(cy - ry - 4);
    const logoH = ry * 2 + 8;
    const logoW = Math.floor(logoH * (5.5 / 4));
    const textY = Math.floor(cy + ry + (h * 0.22));

    const svg = `
<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <clipPath id="oval">
      <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}"/>
    </clipPath>
  </defs>
  <rect width="${w}" height="${h}" fill="#0f172a"/>
  <g clip-path="url(#oval)">
    <image xlink:href="data:image/png;base64,${logoBase64}" href="data:image/png;base64,${logoBase64}" x="${cx - logoW / 2}" y="${logoY}" width="${logoW}" height="${logoH}" preserveAspectRatio="xMidYMid meet"/>
  </g>
  <text x="${cx}" y="${textY}" text-anchor="middle" fill="white" font-family="Arial Black, Arial, sans-serif" font-size="${Math.max(14, Math.floor(size * 0.09))}" font-weight="900" letter-spacing="0.05em">NABZ-AI</text>
</svg>`;

    let sharp: typeof import("sharp").default;
    try {
      sharp = (await import("sharp")).default;
    } catch {
      return NextResponse.redirect(new URL("/logo.png", request.url), 302);
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
      return NextResponse.redirect(new URL("/logo.png", request.url), 302);
    } catch {
      return NextResponse.json({ error: "İkon oluşturulamadı" }, { status: 500 });
    }
  }
}
