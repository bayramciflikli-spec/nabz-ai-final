/**
 * Her bölümün ilgili AI uygulamaları ve paylaşım linki
 */

export interface SectionApp {
  name: string;
  href: string;
  logo?: string;
}

export interface SectionConfig {
  id: string;
  titleKey: string;
  uploadLabelKey?: string;
  apps: SectionApp[];
}

export const SECTION_APPS: SectionConfig[] = [
  {
    id: "shorts",
    titleKey: "section.shorts",
    uploadLabelKey: "home.uploadContent",
    apps: [
      { name: "Kling", href: "https://www.klingai.com", logo: "https://www.google.com/s2/favicons?domain=klingai.com&sz=64" },
      { name: "CapCut", href: "https://www.capcut.com", logo: "https://www.google.com/s2/favicons?domain=capcut.com&sz=64" },
      { name: "Runway", href: "https://runwayml.com", logo: "https://www.google.com/s2/favicons?domain=runwayml.com&sz=64" },
      { name: "InVideo", href: "https://invideo.io", logo: "https://www.google.com/s2/favicons?domain=invideo.io&sz=64" },
    ],
  },
  {
    id: "enler",
    titleKey: "section.enler",
    uploadLabelKey: "home.uploadContent",
    apps: [
      { name: "Kling", href: "https://www.klingai.com", logo: "https://www.google.com/s2/favicons?domain=klingai.com&sz=64" },
      { name: "Runway", href: "https://runwayml.com", logo: "https://www.google.com/s2/favicons?domain=runwayml.com&sz=64" },
      { name: "Suno", href: "https://www.suno.ai", logo: "https://www.google.com/s2/favicons?domain=suno.ai&sz=64" },
      { name: "Midjourney", href: "https://www.midjourney.com", logo: "https://www.google.com/s2/favicons?domain=midjourney.com&sz=64" },
    ],
  },
  {
    id: "video",
    titleKey: "section.video",
    uploadLabelKey: "home.uploadContent",
    apps: [
      { name: "Kling", href: "https://www.klingai.com", logo: "https://www.google.com/s2/favicons?domain=klingai.com&sz=64" },
      { name: "Runway", href: "https://runwayml.com", logo: "https://www.google.com/s2/favicons?domain=runwayml.com&sz=64" },
      { name: "InVideo", href: "https://invideo.io", logo: "https://www.google.com/s2/favicons?domain=invideo.io&sz=64" },
      { name: "Kapwing", href: "https://www.kapwing.com", logo: "https://www.google.com/s2/favicons?domain=kapwing.com&sz=64" },
      { name: "Descript", href: "https://www.descript.com", logo: "https://www.google.com/s2/favicons?domain=descript.com&sz=64" },
      { name: "HeyGen", href: "https://www.heygen.com", logo: "https://www.google.com/s2/favicons?domain=heygen.com&sz=64" },
      { name: "Synthesia", href: "https://www.synthesia.io", logo: "https://www.google.com/s2/favicons?domain=synthesia.io&sz=64" },
    ],
  },
  {
    id: "muzik",
    titleKey: "section.muzik",
    uploadLabelKey: "home.uploadContent",
    apps: [
      { name: "Suno", href: "https://www.suno.ai", logo: "https://www.google.com/s2/favicons?domain=suno.ai&sz=64" },
      { name: "ElevenLabs", href: "https://elevenlabs.io", logo: "https://www.google.com/s2/favicons?domain=elevenlabs.io&sz=64" },
    ],
  },
  {
    id: "animasyon",
    titleKey: "section.animasyon",
    uploadLabelKey: "home.uploadContent",
    apps: [
      { name: "Runway", href: "https://runwayml.com", logo: "https://www.google.com/s2/favicons?domain=runwayml.com&sz=64" },
      { name: "Kling", href: "https://www.klingai.com", logo: "https://www.google.com/s2/favicons?domain=klingai.com&sz=64" },
      { name: "Pika", href: "https://pika.art", logo: "https://www.google.com/s2/favicons?domain=pika.art&sz=64" },
      { name: "Luma", href: "https://lumalabs.ai", logo: "https://www.google.com/s2/favicons?domain=lumalabs.ai&sz=64" },
    ],
  },
  {
    id: "logo-tasarim",
    titleKey: "section.logoTasarim",
    uploadLabelKey: "home.uploadContent",
    apps: [
      { name: "Midjourney", href: "https://www.midjourney.com", logo: "https://www.google.com/s2/favicons?domain=midjourney.com&sz=64" },
      { name: "Canva", href: "https://www.canva.com", logo: "https://www.google.com/s2/favicons?domain=canva.com&sz=64" },
      { name: "Leonardo", href: "https://www.leonardo.ai", logo: "https://www.google.com/s2/favicons?domain=leonardo.ai&sz=64" },
      { name: "Ideogram", href: "https://www.ideogram.ai", logo: "https://www.google.com/s2/favicons?domain=ideogram.ai&sz=64" },
      { name: "Adobe Firefly", href: "https://firefly.adobe.com", logo: "https://www.google.com/s2/favicons?domain=adobe.com&sz=64" },
      { name: "Remini", href: "https://remini.ai", logo: "https://www.google.com/s2/favicons?domain=remini.ai&sz=64" },
    ],
  },
  {
    id: "sohbet",
    titleKey: "section.sohbet",
    uploadLabelKey: "home.uploadContent",
    apps: [
      { name: "ChatGPT", href: "https://chat.openai.com", logo: "https://www.google.com/s2/favicons?domain=chat.openai.com&sz=64" },
      { name: "Claude", href: "https://claude.ai", logo: "https://www.google.com/s2/favicons?domain=claude.ai&sz=64" },
      { name: "Gemini", href: "https://gemini.google.com", logo: "https://www.google.com/s2/favicons?domain=gemini.google.com&sz=64" },
      { name: "Perplexity", href: "https://www.perplexity.ai", logo: "https://www.google.com/s2/favicons?domain=perplexity.ai&sz=64" },
      { name: "DeepSeek", href: "https://www.deepseek.com", logo: "https://www.google.com/s2/favicons?domain=deepseek.com&sz=64" },
      { name: "OpenAI", href: "https://openai.com", logo: "https://www.google.com/s2/favicons?domain=openai.com&sz=64" },
    ],
  },
  {
    id: "diger",
    titleKey: "section.diger",
    uploadLabelKey: "home.uploadContent",
    apps: [
      { name: "Replicate", href: "https://replicate.com", logo: "https://www.google.com/s2/favicons?domain=replicate.com&sz=64" },
    ],
  },
];
