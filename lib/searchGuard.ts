/**
 * Arama güvenlik koruması - NABZ-AI Topluluk Kuralları
 * Dünya geneli yasaklı ve ahlaki olmayan terimler
 */

/** Dinamik cache - BannedTermsLoader tarafından doldurulur */
let _bannedTermsCache: string[] | null = null;

export function setBannedTermsCache(terms: string[]): void {
  _bannedTermsCache = terms;
}

function getEffectiveBlacklist(): string[] {
  return _bannedTermsCache ?? SEARCH_BLACKLIST;
}

/** Admin panelinde gösterim için export */
export const SEARCH_BLACKLIST: string[] = [
  // Kumar & Bahis (TR, EN, DE, ES, FR, AR, RU...)
  "kumar", "gambling", "gamble", "casino", "slot", "slots", "poker", "rulet", "rulette",
  "blackjack", "bahis", "bet", "betting", "bets", "spor bahis", "canlı bahis", "bonus bahis",
  "vbet", "betboo", "youwin", "süperbahis", "betebet", "mobilbahis", "betvole", "betebet",
  "jackpot", "casino", "slot machine", "pachinko", "bingo", "lotto", "lottery",
  "poker online", "canlı casino", "online casino",
  // +18 & Yetişkin (çok dilli)
  "porn", "porno", "pornografi", "xxx", "nsfw", "sex", "seks", "sexo", "sexe",
  "adult", "yetiskin", "18+", "+18", "nsfw", "xxx", "onlyfans", "only fans",
  "erotik", "erotic", "erotica", "strip", "striptiz", "escort", "eskort",
  "hooker", "prostitute", "fahişe", "hayat kadını", "gece hayatı",
  "hentai", "jav", "brazzers", "pornhub", "xvideos", "xhamster",
  "viagra", "cialis", "sildenafil",
  // Çöpçatanlık & Dating
  "match", "dating", "çöpçatan", "flört", "flirt", "tinder", "badoo",
  "bumble", "hinge", "okcupid", "çöpçatanlık", "evlilik sitesi",
  // Uyuşturucu & Zararlı Maddeler
  "uyuşturucu", "drug", "drugs", "cocaine", "kokain", "heroin", "eroin",
  "meth", "methamphetamine", "ecstasy", "lsd", "marijuana", "esrar",
  "weed", "cannabis", "sativa", "indica", "crack", "fentanyl",
  "bonzai", "sentetik", "uyuşturucu satış", "drug dealer",
  // Şiddet & Nefret
  "küfür", "kufur", "hakaret", "sövmek", "sövme", "nefret", "hate",
  "terör", "terror", "bomb", "bomba", "silah", "weapon", "gun",
  "öldür", "kill", "murder", "cinayet", "intihar", "suicide",
  "self harm", "kendine zarar", "blasphemy", "sacrilege",
  // Dolandırıcılık & İzinsiz
  "casino bonus", "bedava bonus", "kayıt bonus", "fraud", "dolandırıcı",
  "scam", "phishing", "fake id", "sahte kimlik",
  // Hassas / Ayrımcı
  "nazi", "hitler", "white supremacy", "ırkçı", "racism", "racist",
  "homofobi", "homophobia", "transfobi", "discrimination",
  // Ek yaygın terimler (çok dilli)
  "juegos de azar", "apuestas", "jeux d'argent", "glücksspiel",
  "азартные игры", "казино", "赌博", "賭博", "judi", "perjudian",
  "betting", "wager", "wagering", "stake", "stakes",
  "play casino", "free spins", "no deposit", "signup bonus",
  "live sex", "sex chat", "webcam", "cam girl", "camgirl",
  "nude", "naked", "çıplak", "çıplaklık", "nudity",
];

/** Güvenli alternatif arama önerileri */
export const SAFE_SEARCH_ALTERNATIVES = [
  "Yapay Zeka Etik Kuralları ve Güvenli Kullanım",
  "AI etik ve güvenli kullanım",
  "ChatGPT ile üretkenlik",
  "AI video üretimi",
  "Yapay zeka eğitimi",
  "AI araçları karşılaştırması",
  "DALL-E ve görsel AI",
  "Müzik ve AI",
  "AI ile logo tasarım",
  "Yapay zeka haberleri",
  "AI geliştirme araçları",
  "Prompts ve AI",
  "AI ile içerik üretimi",
];

const MIN_LENGTH = 2;

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Arama metninde topluluk kuralları ihlali var mı kontrol eder.
 */
export function isSearchViolation(text: string): boolean {
  const val = text.toLowerCase().trim();
  if (val.length <= MIN_LENGTH) return false;

  const list = getEffectiveBlacklist();
  return list.some((word) => {
    const w = word.toLowerCase();
    // 3 karakterden kısa kelimelerde substring yanlış tetikleme önlenir (örn. "ass" -> "class")
    if (w.length <= 3) {
      const re = new RegExp(`\\b${escapeRegex(w)}\\b`, "i");
      return re.test(val);
    }
    return val.includes(w);
  });
}

/**
 * Metinden yasaklı kelimeleri çıkarır (input filtreleme için).
 */
export function sanitizeSearchInput(text: string): string {
  let val = text;
  const list = getEffectiveBlacklist();
  for (const word of list) {
    const w = word.toLowerCase();
    if (w.length <= 3) {
      const re = new RegExp(`\\b${escapeRegex(w)}\\b`, "gi");
      val = val.replace(re, "");
    } else {
      const re = new RegExp(escapeRegex(w), "gi");
      val = val.replace(re, "");
    }
  }
  return val.replace(/\s+/g, " ").trim();
}
