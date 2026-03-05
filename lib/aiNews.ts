/**
 * Güncel AI haberleri - sondakika ve haberler sayfası için ortak veri
 */

export interface AiNewsItem {
  titleKey: string;
  url: string;
  date: string;
}

export const AI_NEWS_ITEMS: AiNewsItem[] = [
  { titleKey: "news.1", url: "https://www.google.com/search?q=OpenAI+GPT-5.2+yapay+zeka", date: "2026-02-08" },
  { titleKey: "news.2", url: "https://www.google.com/search?q=Microsoft+Azure+Maia+AI+çip", date: "2026-02-07" },
  { titleKey: "news.3", url: "https://www.google.com/search?q=SpaceX+xAI+satın+alma", date: "2026-02-06" },
  { titleKey: "news.4", url: "https://www.google.com/search?q=Nvidia+CoreWeave+yatırım", date: "2026-02-05" },
  { titleKey: "news.5", url: "https://www.google.com/search?q=otonom+AI+ajanlar+2025", date: "2026-02-04" },
  { titleKey: "news.6", url: "https://www.google.com/search?q=AI+video+üretimi+pazarlama", date: "2026-02-03" },
  { titleKey: "news.7", url: "https://www.google.com/search?q=AI+sağlık+teşhis", date: "2026-02-02" },
  { titleKey: "news.8", url: "https://www.google.com/search?q=Volvo+AI+otomobil", date: "2026-02-01" },
  { titleKey: "news.9", url: "https://www.google.com/search?q=Tesla+insansı+robot", date: "2026-01-31" },
  { titleKey: "news.10", url: "https://www.google.com/search?q=Genie+3+LingBot", date: "2026-01-30" },
  { titleKey: "news.11", url: "https://www.google.com/search?q=AI+finans+karar+sistemleri", date: "2026-01-29" },
  { titleKey: "news.12", url: "https://www.google.com/search?q=Avrupa+AI+etik+kuralları", date: "2026-01-28" },
  { titleKey: "news.13", url: "https://www.google.com/search?q=Suno+Kling+AI+müzik+video", date: "2026-01-27" },
  { titleKey: "news.14", url: "https://www.google.com/search?q=Türkiye+AI+startup+yatırım", date: "2026-01-26" },
];

export function getSortedAiNews(): AiNewsItem[] {
  return [...AI_NEWS_ITEMS].sort((a, b) => b.date.localeCompare(a.date));
}
