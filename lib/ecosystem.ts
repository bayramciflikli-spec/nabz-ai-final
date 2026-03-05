/**
 * Ekosistem: Tek bir admin UID altında tüm kullanıcıların ve içeriğin toplanması.
 * NEXT_PUBLIC_ADMIN_UIDS'deki ilk UID = ekosistem sahibi.
 */

export function getEcosystemOwnerUid(): string | null {
  const uids = process.env.NEXT_PUBLIC_ADMIN_UIDS?.trim();
  if (!uids) return null;
  const first = uids.split(",").map((x) => x.trim()).filter(Boolean)[0];
  return first ?? null;
}

/** Firestore'da kullanıcı/inçerik dokümanında ekosistem sahibi alanı */
export const ECOSYSTEM_OWNER_FIELD = "ecosystemOwnerUid";
