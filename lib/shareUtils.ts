/**
 * Sosyal medya paylaşım ve kaydetme URL'leri
 */
export function getShareUrl(
  platform: "twitter" | "facebook" | "whatsapp" | "linkedin" | "telegram" | "pinterest",
  url: string,
  title: string
): string {
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const textWithUrl = `${title} ${url}`;

  switch (platform) {
    case "twitter":
      return `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`;
    case "facebook":
      return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedTitle}`;
    case "whatsapp":
      return `https://wa.me/?text=${encodeURIComponent(textWithUrl)}`;
    case "linkedin":
      return `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
    case "telegram":
      return `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`;
    case "pinterest":
      return `https://www.pinterest.com/pin/create/button/?url=${encodedUrl}&description=${encodedTitle}`;
    default:
      return url;
  }
}

export function getSaveUrl(
  platform: "pinterest" | "pocket" | "flipboard",
  url: string,
  title: string
): string {
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  switch (platform) {
    case "pinterest":
      return `https://www.pinterest.com/pin/create/button/?url=${encodedUrl}&description=${encodedTitle}`;
    case "pocket":
      return `https://getpocket.com/edit?url=${encodedUrl}&title=${encodedTitle}`;
    case "flipboard":
      return `https://share.flipboard.com/bookmarklet/popout?v=2&title=${encodedTitle}&url=${encodedUrl}`;
    default:
      return url;
  }
}

export const SHARE_PLATFORMS = [
  { id: "twitter" as const, name: "X (Twitter)" },
  { id: "facebook" as const, name: "Facebook" },
  { id: "whatsapp" as const, name: "WhatsApp" },
  { id: "linkedin" as const, name: "LinkedIn" },
  { id: "telegram" as const, name: "Telegram" },
  { id: "pinterest" as const, name: "Pinterest" },
] as const;

export const SAVE_PLATFORMS = [
  { id: "pinterest" as const, name: "Pinterest'e Kaydet" },
  { id: "pocket" as const, name: "Pocket'a Kaydet" },
  { id: "flipboard" as const, name: "Flipboard'a Kaydet" },
] as const;
