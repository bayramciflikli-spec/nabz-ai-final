/**
 * İçerik dağıtım ve global yükseltme mantığı
 * 1M+ görüntülenme: Yasaklı kategoriler → local'de kilitli | Yasal uyum → global
 */

/** Global yükseltme için minimum görüntülenme eşiği (1 like ≈ 100 view, .env ile override edilebilir) */
export const GLOBAL_PROMOTION_VIEWS_THRESHOLD = 1_000_000;

/** Yasaklı kategoriler - global'e çıkamaz */
const PROHIBITED_FOR_GLOBAL = new Set([
  "gambling",
  "kumar",
  "gaming-gambling",
  "18+",
  "adult",
  "yetiskin",
]);

/** Ülkeye göre yasaklı içerik türleri (ülke kodu → yasaklı kategoriler) */
const COUNTRY_CONTENT_RESTRICTIONS: Record<string, Set<string>> = {
  TR: new Set(["gambling", "kumar", "adult", "18+"]),
  SA: new Set(["adult", "18+", "gambling"]),
  AE: new Set(["adult", "18+", "gambling"]),
  CN: new Set(["gambling", "adult"]),
  US: new Set(["gambling"]), // Kumar bazı eyaletlerde yasak
  DE: new Set(["gambling", "adult"]),
  FR: new Set(["gambling", "adult"]),
  GB: new Set(["gambling"]),
};

export interface ContentForEvaluation {
  id: string;
  category?: string;
  kategori?: string;
  isAdult?: boolean;
  views?: number;
  likedBy?: string[];
  distribution?: "local" | "global" | "locked";
}

/** İçeriğin görüntülenme sayısını hesapla (likedBy veya views) */
export function getContentViews(content: ContentForEvaluation): number {
  return (
    content.views ??
    (content.likedBy?.length ?? 0) * 100 // 1 like ≈ 100 view eşdeğeri
  );
}

/** Yasaklı kategoriye giriyor mu? */
export function isProhibitedCategory(content: ContentForEvaluation): boolean {
  if (content.isAdult) return true;
  const cat = (content.category ?? content.kategori ?? "").toLowerCase();
  return PROHIBITED_FOR_GLOBAL.has(cat) || cat.includes("gambling") || cat.includes("kumar");
}

/** Hedef ülkenin yasalarına uygun mu? */
export function checkLegalCompliance(
  content: ContentForEvaluation,
  targetCountry: string | null
): boolean {
  if (!targetCountry) return true;
  const code = targetCountry.toUpperCase();
  const restricted = COUNTRY_CONTENT_RESTRICTIONS[code];
  if (!restricted) return true;

  const cat = (content.category ?? content.kategori ?? "").toLowerCase();
  if (content.isAdult && restricted.has("adult")) return false;
  if (content.isAdult && restricted.has("18+")) return false;
  if ((cat.includes("gambling") || cat.includes("kumar")) && restricted.has("gambling"))
    return false;

  return true;
}

export type PromotionResult = "lock" | "promote" | "pending";

/** İçeriğin global yükseltme durumunu değerlendir */
export function evaluateContentPromotion(
  content: ContentForEvaluation
): PromotionResult {
  const views = getContentViews(content);
  if (views < GLOBAL_PROMOTION_VIEWS_THRESHOLD) return "pending";

  if (isProhibitedCategory(content)) return "lock";
  return "promote";
}

/** İçerik listesini kullanıcı ülkesine göre filtrele */
export function filterByLegalCompliance<T extends ContentForEvaluation>(
  items: T[],
  userCountry: string | null
): T[] {
  return items.filter((item) => {
    if (item.distribution === "locked") return true; // Locked her yerde gösterilir (local)
    if (item.distribution === "global")
      return checkLegalCompliance(item, userCountry);
    return true; // local varsayılan, göster
  });
}
