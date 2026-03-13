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
  { labelKey: "category.haberAI", query: "AI haber yapay zeka gündem son gelişmeler" },
  { labelKey: "category.egitimAI", query: "AI eğitim öğretmen öğrenci öğrenme ders çalışma" },
  { labelKey: "category.isKariyerAI", query: "AI iş kariyer cv özgeçmiş iş başvurusu ofis işi" },
  { labelKey: "category.uretkenlikAI", query: "AI üretkenlik not alma e-posta toplantı özet otomasyon" },
  { labelKey: "category.videoAI", query: "AI video üretim montaj youtube reels shorts altyazı" },
  { labelKey: "category.muzikAI", query: "AI müzik şarkı vokal mastering ses tasarımı" },
  { labelKey: "category.sanatAI", query: "AI görsel sanat resim logo kapak tasarım illüstrasyon" },
  { labelKey: "category.oyunAI", query: "AI game oyun yayın twitch overlay taktik koç" },
  { labelKey: "category.sosyalMedyaAI", query: "AI sosyal medya içerik instagram tiktok twitter youtube" },
  { labelKey: "category.saglikSporAI", query: "AI sağlık fitness spor antrenman beslenme uyku koç" },
  { labelKey: "category.araclarAI", query: "AI araçlar çeviri özet pdf okuma metin düzeltme tablo analiz" },
];

/** Tarayıcıda en güncel sonuçları bulmak için arama URL'i */
export function getCategorySearchUrl(query: string): string {
  const year = new Date().getFullYear();
  const fullQuery = `${query} ${year}`;
  return `https://www.google.com/search?q=${encodeURIComponent(fullQuery)}`;
}
