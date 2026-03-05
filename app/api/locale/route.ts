import { NextResponse } from "next/server";

/**
 * Kullanıcının ülkesini döndürür.
 * - Vercel: x-vercel-ip-country header'dan alır
 * - Cloudflare: cf-ipcountry header'dan alır
 * - Fallback: ip-api.com (ücretsiz, 45 req/dk)
 */
export async function GET(request: Request) {
  const headers = request.headers;

  // Vercel deployment - ülke header'ı otomatik gelir
  const vercelCountry = headers.get("x-vercel-ip-country");
  if (vercelCountry) {
    return NextResponse.json({ country: vercelCountry.toUpperCase() });
  }

  // Cloudflare
  const cfCountry = headers.get("cf-ipcountry");
  if (cfCountry && cfCountry !== "XX") {
    return NextResponse.json({ country: cfCountry.toUpperCase() });
  }

  // Fallback: ip-api.com (ücretsiz, localhost hariç)
  try {
    const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    const realIp = headers.get("x-real-ip");
    const clientIp = forwarded || realIp || "";

    if (clientIp && clientIp !== "127.0.0.1" && !clientIp.startsWith("192.168.")) {
      const res = await fetch(
        `http://ip-api.com/json/${clientIp}?fields=country`,
        { signal: AbortSignal.timeout(3000) }
      );
      const data = await res.json();
      const country = data?.country as string | undefined;
      if (country) {
        return NextResponse.json({ country: country.toUpperCase() });
      }
    }
  } catch {
    // API hatası – sessizce null dön
  }

  return NextResponse.json({ country: null });
}
