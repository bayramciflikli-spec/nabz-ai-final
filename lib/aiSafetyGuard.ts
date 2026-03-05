/**
 * AI Güvenlik Denetimi
 * [2026-02-04] talimatı: +18, kumar ve dini değer denetimi
 * - OpenAI Moderation API (varsa) + rule-based fallback
 */

import { isProhibitedCategory } from "./contentDistribution";

export interface ContentForSafetyCheck {
  id?: string;
  title?: string;
  description?: string;
  kategori?: string;
  category?: string;
  isAdult?: boolean;
}

const GAMBLING_WORDS = [
  "kumar",
  "gambling",
  "casino",
  "slot",
  "bahis",
  "bet",
  "poker",
  "rulet",
  "blackjack",
];

const ADULT_18_WORDS = [
  "18+",
  "adult",
  "yetiskin",
  "seks",
  "sex",
  "porno",
  "xxx",
  "nsfw",
  "erotik",
];

/** Dini değer ihlali olabilecek hassas kelimeler (küfür, hakaret, dini tahrik) */
const SENSITIVE_WORDS = [
  "blasphemy",
  "sacrilege",
  "dini tahrik",
  "din karşıtı",
  "hakaret",
  "küfür",
];

function toSearchableText(content: ContentForSafetyCheck): string {
  const parts = [
    content.title ?? "",
    content.description ?? "",
    content.kategori ?? "",
    content.category ?? "",
  ].filter(Boolean);
  return parts.join(" ").toLowerCase();
}

function ruleBasedCheck(content: ContentForSafetyCheck): boolean {
  if (content.isAdult) return false;

  const text = toSearchableText(content);
  const cat = (content.kategori ?? content.category ?? "").toLowerCase();

  if (isProhibitedCategory({ category: cat } as any)) return false;
  for (const w of GAMBLING_WORDS) if (text.includes(w) || cat.includes(w)) return false;
  for (const w of ADULT_18_WORDS) if (text.includes(w) || cat.includes(w)) return false;
  for (const w of SENSITIVE_WORDS) if (text.includes(w)) return false;

  return true;
}

/** AI ile güvenlik kontrolü — OpenAI Moderation varsa kullan, yoksa rule-based */
export async function check(content: ContentForSafetyCheck): Promise<boolean> {
  const ruleSafe = ruleBasedCheck(content);
  if (!ruleSafe) return false;

  if (isProhibitedCategory(content as any)) return false;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return ruleSafe;

  try {
    const openai = (await import("openai")).default;
    const client = new openai({ apiKey });
    const text = toSearchableText(content).slice(0, 2000);
    if (!text.trim()) return true;

    const mod = await client.moderations.create({ input: text });
    const result = mod.results?.[0];
    if (!result) return true;

    const cats = result.categories as unknown as Record<string, boolean>;
    const flagged =
      result.flagged ||
      cats?.sexual ||
      cats?.hate ||
      cats?.violence ||
      cats?.["self-harm"] ||
      cats?.["sexual/minors"];

    return !flagged;
  } catch {
    return ruleSafe;
  }
}
