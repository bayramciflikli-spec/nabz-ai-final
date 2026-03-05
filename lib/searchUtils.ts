/**
 * Arama sorgusu normalizasyonu ve yazım hatası toleransı
 * Kullanıcı ne yazarsa yazsın, uygulama içinde doğru sonuçları bulur
 */

/** Türkçe karakterleri normalize et (arama için) */
const TR_NORMALIZE: Record<string, string> = {
  ı: "i", İ: "i", ğ: "g", ü: "u", ö: "o", ş: "s", ç: "c",
};

/** Yaygın yazım hataları -> doğru form */
const TYPO_MAP: Record<string, string> = {
  vidio: "video", vido: "video", vedio: "video",
  muzik: "müzik", music: "müzik",
  animasyon: "animasyon", animasyonn: "animasyon",
  kirmizi: "kırmızı",
  ritim: "ritim", ritm: "ritim",
  kanal: "kanal", chanel: "kanal",
  ai: "ai", yapay: "yapay", zeka: "zeka",
};

/** Sorguyu normalize et ve arama varyasyonları üret */
export function normalizeQuery(raw: string): string {
  const trimmed = raw.trim().toLowerCase();
  let out = "";
  for (const c of trimmed) {
    out += TR_NORMALIZE[c] ?? c;
  }
  return out.replace(/\s+/g, " ").trim();
}

/** Yazım hatalarını düzeltip alternatif sorgular üret */
export function getSearchVariations(query: string): string[] {
  const norm = normalizeQuery(query);
  const variations = new Set<string>();
  variations.add(norm);
  variations.add(query.trim().toLowerCase());

  // Kelime kelime typo düzeltmesi
  const words = norm.split(/\s+/);
  const corrected: string[] = [];
  for (const w of words) {
    corrected.push(TYPO_MAP[w] ?? w);
  }
  variations.add(corrected.join(" "));

  // Kısaltmalar ve genişletmeler
  if (norm.includes("video")) variations.add("video");
  if (norm.includes("muzik") || norm.includes("müzik")) variations.add("müzik");
  if (norm.includes("müzik")) variations.add("muzik");
  if (norm.includes("kırmızı") || norm.includes("kirmizi")) variations.add("kırmızı");
  if (norm.includes("ritim") || norm.includes("ritm")) variations.add("ritim");

  return Array.from(variations).filter(Boolean);
}

/** İki string benzerlik skoru (0-1, basit) */
export function similarity(a: string, b: string): number {
  const na = normalizeQuery(a);
  const nb = normalizeQuery(b);
  if (na === nb) return 1;
  if (na.includes(nb) || nb.includes(na)) return 0.9;
  let matches = 0;
  const minLen = Math.min(na.length, nb.length);
  for (let i = 0; i < minLen; i++) {
    if (na[i] === nb[i]) matches++;
  }
  return matches / Math.max(na.length, nb.length);
}

/** Metin içinde sorgu geçiyor mu (normalize + fuzzy) */
export function matchesQuery(text: string, query: string): boolean {
  const nText = normalizeQuery(text);
  const variations = getSearchVariations(query);
  for (const v of variations) {
    if (nText.includes(v)) return true;
  }
  return false;
}

/** Anahtar kelime → ilgili öneriler (video yazınca video içeriği çağrışımları) */
const KEYWORD_SUGGESTIONS: Record<string, string[]> = {
  vid: ["video", "kısa video", "shorts", "enler"],
  video: ["video", "kısa video", "shorts", "enler", "animasyon", "kırmızı ritim"],
  vidio: ["video", "kısa video", "shorts"],
  vido: ["video", "shorts"],
  shorts: ["shorts", "kısa video", "video"],
  muz: ["müzik", "AI müzik"],
  müzik: ["müzik", "muzik", "suno", "AI müzik"],
  muzik: ["müzik", "muzik", "suno"],
  music: ["müzik", "AI müzik"],
  animasyon: ["animasyon", "video", "AI animasyon"],
  enler: ["enler", "video", "shorts"],
  logo: ["logo", "tasarım", "logo tasarım"],
  tasarım: ["logo tasarım", "tasarım"],
  kırmızı: ["kırmızı ritim", "video", "shorts"],
  kirmizi: ["kırmızı ritim", "video"],
  ritim: ["kırmızı ritim", "video", "shorts"],
  ai: ["AI video", "yapay zeka", "animasyon", "müzik"],
  yapay: ["yapay zeka", "AI video"],
  zeka: ["yapay zeka", "AI"],
};

/** Yazılan metne göre anında öneriler (çağrışım + yakın eşleşmeler) */
export function getInstantSuggestions(input: string): string[] {
  const raw = input.trim().toLowerCase();
  if (!raw) return [];

  const norm = normalizeQuery(raw);
  const suggestions = new Set<string>();

  // Tam eşleşme
  if (KEYWORD_SUGGESTIONS[norm]) {
    KEYWORD_SUGGESTIONS[norm].forEach((s) => suggestions.add(s));
  }

  // Kısmi eşleşme - yazılan kelime hangi anahtara benziyor
  for (const [key, values] of Object.entries(KEYWORD_SUGGESTIONS)) {
    if (key.includes(norm) || norm.includes(key)) {
      values.forEach((s) => suggestions.add(s));
    }
  }

  // Yazılan metni de ekle (aynısı)
  suggestions.add(raw);

  return Array.from(suggestions).slice(0, 8);
}
