/**
 * Kategori başlıkları - Tarayıcıda en güncel AI sonuçlarını bulmak için arama sorguları
 *
 * GÜNCELLEME: Yeni trendler çıktıkça query'leri güncelleyin.
 * Yıl otomatik eklenir - her zaman güncel sonuçlar için.
 *
 * Son güncelleme: 2026-02
 */

export interface CategoryTab {
  labelKey: string;
  /** Arama sorgusu - yıl otomatik eklenir */
  query: string;
}

export const CATEGORY_TABS: CategoryTab[] = [
  { labelKey: "category.haberAI", query: "AI haber yapay zeka güncel" },
  { labelKey: "category.eglenceAI", query: "AI eğlence yapay zeka video güncel" },
  { labelKey: "category.egitimAI", query: "AI eğitim yapay zeka öğrenme güncel" },
  { labelKey: "category.sporAI", query: "AI spor yapay zeka güncel" },
  { labelKey: "category.teknoAI", query: "AI teknoloji yapay zeka güncel" },
  { labelKey: "category.muzikAI", query: "AI müzik yapay zeka güncel" },
  { labelKey: "category.sanatAI", query: "AI sanat yapay zeka güncel" },
];

/** Tarayıcıda en güncel sonuçları bulmak için arama URL'i */
export function getCategorySearchUrl(query: string): string {
  const year = new Date().getFullYear();
  const fullQuery = `${query} ${year}`;
  return `https://www.google.com/search?q=${encodeURIComponent(fullQuery)}`;
}
