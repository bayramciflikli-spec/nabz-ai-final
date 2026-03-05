/**
 * NABZ-AI içerik kuralları ve abonelik şartları
 */

export const CONTENT_RULES = {
  prohibited: [
    "18+ (reşit olmayanlar için uygun olmayan) içerik",
    "Küfür ve hakaret",
    "Çöpçatanlık veya uygunsuz ilişki aracılığı",
    "Dini ve milli değerlere hakaret veya aşağılama",
    "Kumar ve kumara teşvik",
    "Uyuşturucu ve uyuşturucuya teşvik",
    "Ahlaki ve etik olmayan her türlü içerik",
  ],
  consequence: "Bu kurallara uymayan kullanıcılar engellenecektir.",
} as const;

export const TERMS_TELIF =
  "Telifli herhangi bir müzik, video veya diğer içerik paylaşımı tamamen kendi sorumluluğumdadır. " +
  "NABZ-AI bu içeriklerden dolayı sorumlu değildir.";

export const TERMS_CONTENT_RULES =
  "18+ içerik, küfür, hakaret, çöpçatanlık, dini/milli değerlere hakaret, kumar, uyuşturucu teşviki ve ahlaki/etik olmayan tüm içerikler yasaktır. " +
  "Bu kurallara uymayan kullanıcılar engellenecektir.";
