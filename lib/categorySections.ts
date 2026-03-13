/**
 * Ana başlıklar: her biri kayan içerik sekmesi + ilgili AI uygulama kısayolları.
 * contentSource: hangi veriyle carousel doldurulacak (trending = genel gündem).
 */

export interface CategorySectionApp {
  name: string;
  href: string;
  logo?: string;
}

export interface CategorySectionConfig {
  labelKey: string;
  query: string;
  /** shorts | enler | video | muzik | animasyon | logo-tasarim | trending */
  contentSource: string;
  apps: CategorySectionApp[];
}

const favicon = (domain: string) => `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;

export const CATEGORY_SECTIONS: CategorySectionConfig[] = [
  {
    labelKey: "section.shorts",
    query: "AI shorts dikey video tiktok reels",
    contentSource: "shorts",
    apps: [
      { name: "Kling", href: "https://www.klingai.com", logo: favicon("klingai.com") },
      { name: "CapCut", href: "https://www.capcut.com", logo: favicon("capcut.com") },
      { name: "Runway", href: "https://runwayml.com", logo: favicon("runwayml.com") },
      { name: "InVideo", href: "https://invideo.io", logo: favicon("invideo.io") },
    ],
  },
  {
    labelKey: "category.haberAI",
    query: "AI haber yapay zeka gündem",
    contentSource: "enler",
    apps: [
      { name: "Perplexity", href: "https://www.perplexity.ai", logo: favicon("perplexity.ai") },
      { name: "ChatGPT", href: "https://chat.openai.com", logo: favicon("chat.openai.com") },
      { name: "Google AI", href: "https://blog.google/technology/ai/", logo: favicon("blog.google") },
      { name: "Claude", href: "https://claude.ai", logo: favicon("claude.ai") },
    ],
  },
  {
    labelKey: "category.egitimAI",
    query: "AI eğitim öğrenme ders",
    contentSource: "trending",
    apps: [
      { name: "ChatGPT", href: "https://chat.openai.com", logo: favicon("chat.openai.com") },
      { name: "Claude", href: "https://claude.ai", logo: favicon("claude.ai") },
      { name: "DeepSeek", href: "https://www.deepseek.com", logo: favicon("deepseek.com") },
      { name: "Khanmigo", href: "https://www.khanacademy.org", logo: favicon("khanacademy.org") },
    ],
  },
  {
    labelKey: "category.isKariyerAI",
    query: "AI iş kariyer cv özgeçmiş",
    contentSource: "trending",
    apps: [
      { name: "ChatGPT", href: "https://chat.openai.com", logo: favicon("chat.openai.com") },
      { name: "Claude", href: "https://claude.ai", logo: favicon("claude.ai") },
      { name: "Grammarly", href: "https://www.grammarly.com", logo: favicon("grammarly.com") },
      { name: "Notion AI", href: "https://www.notion.so", logo: favicon("notion.so") },
    ],
  },
  {
    labelKey: "category.uretkenlikAI",
    query: "AI üretkenlik not toplantı özet",
    contentSource: "trending",
    apps: [
      { name: "ChatGPT", href: "https://chat.openai.com", logo: favicon("chat.openai.com") },
      { name: "Claude", href: "https://claude.ai", logo: favicon("claude.ai") },
      { name: "Notion", href: "https://www.notion.so", logo: favicon("notion.so") },
      { name: "Otter.ai", href: "https://otter.ai", logo: favicon("otter.ai") },
    ],
  },
  {
    labelKey: "category.videoAI",
    query: "AI video üretim montaj youtube",
    contentSource: "video",
    apps: [
      { name: "Kling", href: "https://www.klingai.com", logo: favicon("klingai.com") },
      { name: "Runway", href: "https://runwayml.com", logo: favicon("runwayml.com") },
      { name: "CapCut", href: "https://www.capcut.com", logo: favicon("capcut.com") },
      { name: "InVideo", href: "https://invideo.io", logo: favicon("invideo.io") },
      { name: "Descript", href: "https://www.descript.com", logo: favicon("descript.com") },
    ],
  },
  {
    labelKey: "category.muzikAI",
    query: "AI müzik şarkı vokal",
    contentSource: "muzik",
    apps: [
      { name: "Suno", href: "https://www.suno.ai", logo: favicon("suno.ai") },
      { name: "ElevenLabs", href: "https://elevenlabs.io", logo: favicon("elevenlabs.io") },
      { name: "Udio", href: "https://www.udio.com", logo: favicon("udio.com") },
    ],
  },
  {
    labelKey: "category.sanatAI",
    query: "AI görsel sanat logo tasarım",
    contentSource: "logo-tasarim",
    apps: [
      { name: "Midjourney", href: "https://www.midjourney.com", logo: favicon("midjourney.com") },
      { name: "Leonardo", href: "https://www.leonardo.ai", logo: favicon("leonardo.ai") },
      { name: "Ideogram", href: "https://www.ideogram.ai", logo: favicon("ideogram.ai") },
      { name: "Canva", href: "https://www.canva.com", logo: favicon("canva.com") },
      { name: "Adobe Firefly", href: "https://firefly.adobe.com", logo: favicon("adobe.com") },
    ],
  },
  {
    labelKey: "category.oyunAI",
    query: "AI oyun game yayın",
    contentSource: "trending",
    apps: [
      { name: "Roblox", href: "https://www.roblox.com", logo: favicon("roblox.com") },
      { name: "Luma", href: "https://lumalabs.ai", logo: favicon("lumalabs.ai") },
      { name: "Inworld", href: "https://www.inworld.ai", logo: favicon("inworld.ai") },
    ],
  },
  {
    labelKey: "category.sosyalMedyaAI",
    query: "AI sosyal medya içerik instagram tiktok",
    contentSource: "shorts",
    apps: [
      { name: "Canva", href: "https://www.canva.com", logo: favicon("canva.com") },
      { name: "CapCut", href: "https://www.capcut.com", logo: favicon("capcut.com") },
      { name: "Runway", href: "https://runwayml.com", logo: favicon("runwayml.com") },
      { name: "Kling", href: "https://www.klingai.com", logo: favicon("klingai.com") },
    ],
  },
  {
    labelKey: "category.saglikSporAI",
    query: "AI sağlık fitness spor",
    contentSource: "trending",
    apps: [
      { name: "ChatGPT", href: "https://chat.openai.com", logo: favicon("chat.openai.com") },
      { name: "Whoop", href: "https://www.whoop.com", logo: favicon("whoop.com") },
      { name: "Peloton", href: "https://www.onepeloton.com", logo: favicon("onepeloton.com") },
    ],
  },
  {
    labelKey: "category.araclarAI",
    query: "AI araçlar çeviri özet pdf",
    contentSource: "trending",
    apps: [
      { name: "ChatGPT", href: "https://chat.openai.com", logo: favicon("chat.openai.com") },
      { name: "Claude", href: "https://claude.ai", logo: favicon("claude.ai") },
      { name: "DeepL", href: "https://www.deepl.com", logo: favicon("deepl.com") },
      { name: "Perplexity", href: "https://www.perplexity.ai", logo: favicon("perplexity.ai") },
    ],
  },
];
