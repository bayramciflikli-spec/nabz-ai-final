/**
 * Tarayıcı parmak izi — hukuki kanıt için client-side.
 * Sadece tarayıcıda çalışır.
 */
export function generateBrowserFingerprint(): string {
  if (typeof window === "undefined") return "server";
  const parts: string[] = [
    navigator.userAgent,
    navigator.language,
    String(screen.width),
    String(screen.height),
    String(new Date().getTimezoneOffset()),
    navigator.hardwareConcurrency?.toString() ?? "",
    navigator.platform ?? "",
  ];
  let hash = 0;
  const str = parts.join("|");
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return "fp-" + Math.abs(hash).toString(36) + "-" + Date.now().toString(36);
}
