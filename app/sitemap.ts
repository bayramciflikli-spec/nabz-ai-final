import { MetadataRoute } from "next";
import { getAdminFirestore } from "@/lib/firebase-admin";

const BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
  "https://nabz.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${BASE_URL}/shorts`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/trending`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/explore`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/search`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/create`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/models`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.6 },
    { url: `${BASE_URL}/help`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/feedback`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/landing`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/mall`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/haberler`, lastModified: new Date(), changeFrequency: "daily", priority: 0.7 },
    { url: `${BASE_URL}/yasal/gizlilik`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/yasal/kullanim-sartlari`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/yasal/kvkk`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/yasal/ccpa`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/yasal/lgpd`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/transparency`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
  ];

  const projectRoutes: MetadataRoute.Sitemap = [];
  try {
    const db = getAdminFirestore();
    if (db) {
      const snap = await db
        .collection("projects")
        .orderBy("createdAt", "desc")
        .limit(500)
        .get();
      snap.docs.forEach((d) => {
        const data = d.data();
        const createdAt = data?.createdAt;
        const lastMod = createdAt && typeof createdAt.toDate === "function" ? createdAt.toDate() : new Date();
        projectRoutes.push({
          url: `${BASE_URL}/project/${d.id}`,
          lastModified: lastMod,
          changeFrequency: "weekly" as const,
          priority: 0.7,
        });
        projectRoutes.push({
          url: `${BASE_URL}/shorts/${d.id}`,
          lastModified: lastMod,
          changeFrequency: "weekly" as const,
          priority: 0.6,
        });
      });
    }
  } catch (e) {
    console.warn("Sitemap: Firestore projeleri yüklenemedi", e);
  }

  return [...staticRoutes, ...projectRoutes];
}
