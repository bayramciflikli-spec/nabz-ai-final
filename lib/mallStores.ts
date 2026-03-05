/**
 * Sanal AVM - Global Virtual Mall mağaza verileri
 * Dil bazlı açıklama ve fiyat (TR, US, DE)
 */

export type MallLocale = "TR" | "US" | "DE";

export interface MallStore {
  id: string;
  name: string;
  desc: Record<MallLocale, string>;
  price: Record<MallLocale, string>;
  compliance: string;
  category: string;
  href: string;
  logo?: string;
}

export const MALL_STORES: MallStore[] = [
  {
    id: "visionary-ai",
    name: "Visionary-AI",
    desc: {
      TR: "Geleceğin video üretim araçları burada.",
      US: "Future of video production tools is here.",
      DE: "Die Zukunft der Videoproduktion ist da.",
    },
    price: { TR: "₺499/ay", US: "$19/mo", DE: "19€/mt" },
    compliance: "KVKK & GDPR Compliant",
    category: "Video",
    href: "https://klingai.com",
    logo: "https://www.google.com/s2/favicons?domain=klingai.com&sz=128",
  },
  {
    id: "soundmaster",
    name: "SoundMaster",
    desc: {
      TR: "Yapay zeka ile kusursuz ses tasarımı.",
      US: "Flawless sound design with AI.",
      DE: "Makelloses Sounddesign mit KI.",
    },
    price: { TR: "₺299/ay", US: "$10/mo", DE: "10€/mt" },
    compliance: "Safe for All Audiences",
    category: "Audio",
    href: "https://suno.ai",
    logo: "https://www.google.com/s2/favicons?domain=suno.ai&sz=128",
  },
  {
    id: "chatgpt",
    name: "ChatGPT",
    desc: {
      TR: "En gelişmiş yapay zeka sohbet asistanı.",
      US: "Most advanced AI chat assistant.",
      DE: "Fortschrittlichster KI-Chat-Assistent.",
    },
    price: { TR: "₺649/ay", US: "$20/mo", DE: "20€/mt" },
    compliance: "GDPR Compliant",
    category: "Chat",
    href: "https://chat.openai.com",
    logo: "https://www.google.com/s2/favicons?domain=chat.openai.com&sz=128",
  },
  {
    id: "midjourney",
    name: "Midjourney",
    desc: {
      TR: "Sanatsal görsel üretimi için lider platform.",
      US: "Leading platform for artistic image generation.",
      DE: "Führende Plattform für künstlerische Bildgenerierung.",
    },
    price: { TR: "₺349/ay", US: "$10/mo", DE: "10€/mt" },
    compliance: "All Regions",
    category: "Image",
    href: "https://midjourney.com",
    logo: "https://www.google.com/s2/favicons?domain=midjourney.com&sz=128",
  },
  {
    id: "runway",
    name: "Runway",
    desc: {
      TR: "Profesyonel video düzenleme ve AI efektleri.",
      US: "Professional video editing and AI effects.",
      DE: "Professioneller Videoschnitt und KI-Effekte.",
    },
    price: { TR: "₺449/ay", US: "$15/mo", DE: "15€/mt" },
    compliance: "KVKK & GDPR Compliant",
    category: "Video",
    href: "https://runwayml.com",
    logo: "https://www.google.com/s2/favicons?domain=runwayml.com&sz=128",
  },
  {
    id: "elevenlabs",
    name: "ElevenLabs",
    desc: {
      TR: "Gerçekçi ses sentezi ve ses klonlama.",
      US: "Realistic voice synthesis and cloning.",
      DE: "Realistische Stimmensynthese und Klonen.",
    },
    price: { TR: "₺199/ay", US: "$5/mo", DE: "5€/mt" },
    compliance: "Safe for All Audiences",
    category: "Audio",
    href: "https://elevenlabs.io",
    logo: "https://www.google.com/s2/favicons?domain=elevenlabs.io&sz=128",
  },
  {
    id: "leonardo",
    name: "Leonardo",
    desc: {
      TR: "Oyun ve vektör odaklı görsel AI.",
      US: "Game and vector-focused visual AI.",
      DE: "Spiel- und vektorfokussierte visuelle KI.",
    },
    price: { TR: "₺249/ay", US: "$12/mo", DE: "12€/mt" },
    compliance: "GDPR Compliant",
    category: "Image",
    href: "https://leonardo.ai",
    logo: "https://www.google.com/s2/favicons?domain=leonardo.ai&sz=128",
  },
  {
    id: "perplexity",
    name: "Perplexity",
    desc: {
      TR: "AI destekli arama ve araştırma asistanı.",
      US: "AI-powered search and research assistant.",
      DE: "KI-gestützter Such- und Forschungsassistent.",
    },
    price: { TR: "₺199/ay", US: "$20/mo", DE: "20€/mt" },
    compliance: "All Regions",
    category: "Search",
    href: "https://perplexity.ai",
    logo: "https://www.google.com/s2/favicons?domain=perplexity.ai&sz=128",
  },
];

const MARKET_LABELS: Record<MallLocale, string> = {
  TR: "TURKIYE",
  US: "USA",
  DE: "GERMANY",
};

export function getMarketLabel(locale: MallLocale): string {
  return MARKET_LABELS[locale] ?? locale;
}

/** Proje aracı (tool) Mall'da mağaza var mı? */
const MALL_TOOL_KEYS = new Set([
  "kling", "suno", "chatgpt", "midjourney", "runway", "elevenlabs",
  "leonardo", "perplexity", "visionary", "soundmaster", "openai",
]);

export function hasMallStore(tool?: string | null): boolean {
  if (!tool) return false;
  const t = tool.toLowerCase();
  return [...MALL_TOOL_KEYS].some((k) => t.includes(k) || k.includes(t));
}
