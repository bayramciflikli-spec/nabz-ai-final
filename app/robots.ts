import { MetadataRoute } from "next";

const BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
  "https://nabz.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/admin", "/dashboard", "/settings", "/downloads", "/reports", "/playlists", "/history", "/library", "/liked", "/watch-later", "/subscriptions", "/notifications", "/abone-ol"],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
