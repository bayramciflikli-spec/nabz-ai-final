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
      const prefix = base || "";
      return [
        { src: `${prefix}/icon-192.png`, sizes: "192x192", type: "image/png", purpose: "any maskable" },
        { src: `${prefix}/icon-512.png`, sizes: "512x512", type: "image/png", purpose: "any maskable" },
        { src: `${prefix}/apple-touch-icon.png`, sizes: "180x180", type: "image/png", purpose: "any" },
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
