/**
 * NABZ-AI Reklam Politikası
 * Etik ve ahlaki kurallarımıza uymayan reklam anlaşmaları yapılmaz.
 * AdSense kullanıcı panelinde aşağıdaki kategoriler engellenmelidir.
 */

export const AD_POLICY = {
  title: "Reklam Politikası",
  description:
    "NABZ-AI platformunda yalnızca etik ve ahlaki standartlarımıza uygun reklamlar gösterilir. " +
    "Aşağıdaki kategorilerdeki reklamlar kabul edilmez ve platformda asla gösterilmez.",

  /** AdSense panelinde engellenmesi gereken kategoriler */
  blockedCategories: [
    "Yetişkin içerik (18+)",
    "Cinsel içerik veya çöpçatanlık",
    "Kumar ve bahis",
    "Alkol ve tütün ürünleri",
    "Uyuşturucu ve uyuşturucuya teşvik",
    "Şiddet içerikli oyunlar veya medya",
    "Dini ve milli değerlere hakaret",
    "Nefret söylemi veya ayrımcılık",
    "Sahte veya aldatıcı ürünler",
    "Kripto para / yüksek riskli yatırım vaatleri",
    "Zararlı veya tehlikeli ürünler",
    "Küfür veya hakaret içeren mesajlar",
  ] as const,

  /** Kabul edilebilir reklam örnekleri */
  allowedExamples: [
    "Teknoloji ve yazılım",
    "Eğitim ve kurslar",
    "Yasal e-ticaret",
    "AI araçları ve platformlar",
    "Yaratıcı içerik araçları",
    "Dijital hizmetler",
  ] as const,

  consequence:
    "Bu politikaya aykırı reklam tespit edilirse anında kaldırılır ve ilgili anlaşma iptal edilir.",
} as const;
