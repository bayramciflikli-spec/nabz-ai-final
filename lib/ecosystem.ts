/**
 * Ekosistem: Tek bir admin UID altında tüm kullanıcıların ve içeriğin toplanması.
 * Varsayılan tek yetkili: bayramciflikli (SINGLE_ADMIN_UID). İsteğe göre NEXT_PUBLIC_ADMIN_UIDS.
 */

import { SINGLE_ADMIN_UID } from "./isAdmin";

function cleanUid(value: string): string {
  return value.replace(/['"]+/g, "").trim();
}

export function getEcosystemOwnerUid(): string | null {
  const raw = process.env.NEXT_PUBLIC_ADMIN_UIDS ?? "";
  if (raw.trim()) {
    const first = raw.split(",").map((id) => cleanUid(id)).filter(Boolean)[0];
    if (first) return first;
  }
  return SINGLE_ADMIN_UID;
}

/** Firestore'da kullanıcı/inçerik dokümanında ekosistem sahibi alanı */
export const ECOSYSTEM_OWNER_FIELD = "ecosystemOwnerUid";
