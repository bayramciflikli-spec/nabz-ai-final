/**
 * AI Çoklu Dil Çevirisi
 * Global dağıtım için title/description çevirileri
 */

export interface ContentForTranslation {
  title?: string;
  description?: string;
  prompt?: string;
}

export type TranslationMap = Record<string, { title: string; description?: string }>;

const DEFAULT_LANGUAGES = ["en", "de", "ja", "es", "fr"] as const;

/** İçeriği hedef dillere çevir */
export async function translate(
  content: ContentForTranslation,
  targetLangs: readonly string[] = DEFAULT_LANGUAGES
): Promise<TranslationMap> {
  const title = (content.title ?? "").trim() || "Untitled";
  const desc = (content.description ?? content.prompt ?? "").trim().slice(0, 500);

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return buildFallbackTranslations(title, desc, targetLangs);
  }

  try {
    const openai = (await import("openai")).default;
    const client = new openai({ apiKey });

    const result: TranslationMap = {};
    const systemPrompt = `You are a professional translator. Translate the given text accurately. 
Return ONLY valid JSON: { "title": "...", "description": "..." }. 
Do not add any markdown or extra text.`;

    for (const lang of targetLangs) {
      const langName = getLangName(lang);
      const userPrompt = `Translate to ${langName}:\nTitle: ${title}\nDescription: ${desc || "(none)"}`;

      const res = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.3,
      });

      const text = res.choices?.[0]?.message?.content?.trim();
      if (text) {
        try {
          const parsed = JSON.parse(text.replace(/```\w*\n?|\n?```/g, "").trim());
          result[lang] = {
            title: String(parsed.title ?? title),
            description: parsed.description ? String(parsed.description) : undefined,
          };
        } catch {
          result[lang] = { title };
        }
      } else {
        result[lang] = { title };
      }
    }

    return result;
  } catch {
    return buildFallbackTranslations(title, desc, targetLangs);
  }
}

function getLangName(code: string): string {
  const names: Record<string, string> = {
    en: "English",
    de: "German",
    ja: "Japanese",
    es: "Spanish",
    fr: "French",
    it: "Italian",
    pt: "Portuguese",
    ru: "Russian",
    ar: "Arabic",
    tr: "Turkish",
    zh: "Chinese",
    ko: "Korean",
  };
  return names[code] ?? code;
}

function buildFallbackTranslations(
  title: string,
  desc: string,
  langs: readonly string[]
): TranslationMap {
  const result: TranslationMap = {};
  for (const lang of langs) {
    result[lang] = { title, description: desc || undefined };
  }
  return result;
}
