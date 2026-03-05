/**
 * NABZ-AI Ultra Güvenlik Modülü
 * Hırsızlık, hack ve kişisel veri sızıntısına karşı koruma
 */

/** XSS: Tehlikeli HTML/script etiketlerini temizle */
const DANGEROUS_PATTERNS = [
  /<script\b[^>]*>[\s\S]*?<\/script>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,
  /expression\s*\(/gi,
  /vbscript:/gi,
  /data:/gi,
  /<iframe/gi,
  /<object/gi,
  /<embed/gi,
  /<form/gi,
  /<meta/gi,
  /<link/gi,
  /<style[^>]*>[\s\S]*?<\/style>/gi,
];

export function sanitizeHtml(input: string): string {
  if (typeof input !== "string") return "";
  let out = input;
  for (const p of DANGEROUS_PATTERNS) {
    out = out.replace(p, "");
  }
  return out.trim();
}

/** Metin girişlerini güvenli hale getir (max uzunluk, trim) */
export function sanitizeText(input: unknown, maxLen = 500): string {
  if (input == null) return "";
  const s = String(input).trim().slice(0, maxLen);
  return sanitizeHtml(s);
}

/** URL doğrulama - sadece http/https */
export function isValidUrl(url: unknown): boolean {
  if (typeof url !== "string") return false;
  try {
    const u = new URL(url);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

/** Firebase Storage path - path traversal engelleme */
export function sanitizeStoragePath(path: string): string {
  return path
    .replace(/\.\./g, "")
    .replace(/\/+/g, "/")
    .replace(/^\/+/, "")
    .slice(0, 500);
}

/** Email format kontrolü */
export function isValidEmail(email: unknown): boolean {
  if (typeof email !== "string") return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}

/** Rate limit - basit bellek tabanlı (serverless için Redis önerilir) */
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 30;

export function rateLimit(key: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry) {
    rateLimitMap.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  entry.count++;
  return entry.count <= RATE_MAX;
}

/** Prompt uzunluk limiti (OpenAI israfı önleme) */
export const PROMPT_MAX_LENGTH = 2000;

/** Başlık uzunluk limiti */
export const TITLE_MAX_LENGTH = 200;
