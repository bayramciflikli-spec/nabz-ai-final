import { NextRequest } from "next/server";

/**
 * PWA manifest with absolute icon URLs so that "Add to Home Screen" / Install
 * shows the app icon correctly on mobile and desktop.
 */
export async function GET(request: NextRequest) {
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "";
  const proto = request.headers.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  const base = host ? `${proto}://${host}` : (process.env.NEXT_PUBLIC_APP_URL ?? "");

  const manifest = {
    id: "/",
    name: "NABZ-AI",
    short_name: "NABZ",
    description: "AI Video Platformu - Kelimelerinizi videoya dönüştürün",
    start_url: "/",
    display: "standalone",
    background_color: "#0f172a",
    theme_color: "#0ea5e9",
    orientation: "any",
    categories: ["entertainment", "video"],
    icons: (() => {
      const iconBase = base ? `${base}/api/pwa-icon` : "/api/pwa-icon";
      return [
        { src: `${iconBase}/32`, sizes: "32x32", type: "image/png", purpose: "any" },
        { src: `${iconBase}/72`, sizes: "72x72", type: "image/png", purpose: "any" },
        { src: `${iconBase}/96`, sizes: "96x96", type: "image/png", purpose: "any" },
        { src: `${iconBase}/128`, sizes: "128x128", type: "image/png", purpose: "any" },
        { src: `${iconBase}/144`, sizes: "144x144", type: "image/png", purpose: "any" },
        { src: `${iconBase}/192`, sizes: "192x192", type: "image/png", purpose: "any maskable" },
        { src: `${iconBase}/384`, sizes: "384x384", type: "image/png", purpose: "any" },
        { src: `${iconBase}/512`, sizes: "512x512", type: "image/png", purpose: "any maskable" },
      ];
    })(),
  };

  return new Response(JSON.stringify(manifest), {
    headers: {
      "Content-Type": "application/manifest+json",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
