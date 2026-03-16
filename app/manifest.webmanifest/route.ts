import { NextRequest } from "next/server";

/** PWA manifest – her zaman geçerli JSON döner; 500 önlenir. */
export const dynamic = "force-dynamic";

const FALLBACK_MANIFEST = {
  id: "/",
  name: "NABZ-AI",
  short_name: "NABZ",
  description: "AI Video Platformu - Kelimelerinizi videoya dönüştürün",
  start_url: "/",
  display: "standalone" as const,
  background_color: "#0f172a",
  theme_color: "#0ea5e9",
  orientation: "any" as const,
  categories: ["entertainment", "video"],
  icons: [
    { src: "/api/pwa-icon/32", sizes: "32x32", type: "image/png", purpose: "any" },
    { src: "/api/pwa-icon/72", sizes: "72x72", type: "image/png", purpose: "any" },
    { src: "/api/pwa-icon/96", sizes: "96x96", type: "image/png", purpose: "any" },
    { src: "/api/pwa-icon/128", sizes: "128x128", type: "image/png", purpose: "any" },
    { src: "/api/pwa-icon/144", sizes: "144x144", type: "image/png", purpose: "any" },
    { src: "/api/pwa-icon/192", sizes: "192x192", type: "image/png", purpose: "any maskable" },
    { src: "/api/pwa-icon/384", sizes: "384x384", type: "image/png", purpose: "any" },
    { src: "/api/pwa-icon/512", sizes: "512x512", type: "image/png", purpose: "any maskable" },
  ],
};

export async function GET(request: NextRequest) {
  try {
    const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "";
    const proto = request.headers.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
    const base = host ? `${proto}://${host}` : "";

    const iconBase = base ? `${base}/api/pwa-icon` : "/api/pwa-icon";
    const manifest = {
      ...FALLBACK_MANIFEST,
      icons: [
        { src: `${iconBase}/32`, sizes: "32x32", type: "image/png", purpose: "any" },
        { src: `${iconBase}/72`, sizes: "72x72", type: "image/png", purpose: "any" },
        { src: `${iconBase}/96`, sizes: "96x96", type: "image/png", purpose: "any" },
        { src: `${iconBase}/128`, sizes: "128x128", type: "image/png", purpose: "any" },
        { src: `${iconBase}/144`, sizes: "144x144", type: "image/png", purpose: "any" },
        { src: `${iconBase}/192`, sizes: "192x192", type: "image/png", purpose: "any maskable" },
        { src: `${iconBase}/384`, sizes: "384x384", type: "image/png", purpose: "any" },
        { src: `${iconBase}/512`, sizes: "512x512", type: "image/png", purpose: "any maskable" },
      ],
    };

    const body = JSON.stringify(manifest);
    return new Response(body, {
      headers: {
        "Content-Type": "application/manifest+json",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch {
    const body = JSON.stringify(FALLBACK_MANIFEST);
    return new Response(body, {
      status: 200,
      headers: {
        "Content-Type": "application/manifest+json",
        "Cache-Control": "public, max-age=3600",
      },
    });
  }
}
