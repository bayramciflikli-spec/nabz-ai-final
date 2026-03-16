/**
 * Ekosistem: Tek bir admin UID altında tüm kullanıcıların ve içeriğin toplanması.
 * NEXT_PUBLIC_ADMIN_UIDS'deki ilk UID = ekosistem sahibi. Tırnak/boşluk temizlenir.
 */

function cleanUid(value: string): string {
  return value.replace(/['"]+/g, "").trim();
}

export function getEcosystemOwnerUid(): string | null {
  const raw = process.env.NEXT_PUBLIC_ADMIN_UIDS ?? "";
  if (!raw.trim()) return null;
  const first = raw.split(",").map((id) => cleanUid(id)).filter(Boolean)[0];
  return first ?? null;
}

/** Firestore'da kullanıcı/inçerik dokümanında ekosistem sahibi alanı */
export const ECOSYSTEM_OWNER_FIELD = "ecosystemOwnerUid";
