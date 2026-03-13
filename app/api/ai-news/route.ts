import { NextResponse } from "next/server";

const RSS_URL =
  "https://news.google.com/rss/search?q=yapay+zeka+artificial+intelligence+AI+haber&hl=tr&ceid=TR:tr";
const CACHE_MAX_AGE = 120; // 2 dakika
const FALLBACK_ITEMS = [
  { title: "Yapay zeka ve AI haberleri", url: "https://news.google.com/search?q=yapay+zeka+AI", date: new Date().toISOString().slice(0, 10) },
];

function parseRssItems(xml: string): { title: string; url: string; date: string }[] {
  const items: { title: string; url: string; date: string }[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];
    const titleMatch = block.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/i) ?? block.match(/<title>(.*?)<\/title>/i);
    const linkMatch = block.match(/<link>(.*?)<\/link>/i);
    const pubMatch = block.match(/<pubDate>(.*?)<\/pubDate>/i);
    const title = titleMatch ? decodeEntities(titleMatch[1].trim()) : "";
    const link = linkMatch ? linkMatch[1].trim() : "";
    let date = new Date().toISOString().slice(0, 10);
    if (pubMatch) {
      try {
        date = new Date(pubMatch[1].trim()).toISOString().slice(0, 10);
      } catch {
        // keep default
      }
    }
    if (title && link) items.push({ title, url: link, date });
  }
  return items.slice(0, 20);
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}

export async function GET() {
  try {
    const res = await fetch(RSS_URL, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; NABZ-AI/1.0)" },
      next: { revalidate: CACHE_MAX_AGE },
    });
    if (!res.ok) throw new Error("RSS fetch failed");
    const xml = await res.text();
    const items = parseRssItems(xml);
    const list = items.length > 0 ? items : FALLBACK_ITEMS;
    return NextResponse.json(list, {
      headers: {
        "Cache-Control": `public, s-maxage=${CACHE_MAX_AGE}, stale-while-revalidate=60`,
      },
    });
  } catch (e) {
    console.error("ai-news:", e);
    return NextResponse.json(FALLBACK_ITEMS, {
      headers: { "Cache-Control": "public, s-maxage=60" },
    });
  }
}
