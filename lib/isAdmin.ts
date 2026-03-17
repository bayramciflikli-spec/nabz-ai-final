/**
 * Admin yetki kontrolü.
 * Tek yetkili: bayramciflikli@gmail.com (UID aşağıda). Ek adminler NEXT_PUBLIC_ADMIN_UIDS ile tanımlanabilir.
 */
export const SINGLE_ADMIN_UID = "iZt8LY8jfpeGwCqxNU0HjhHCoIq2";

function cleanUid(value: string): string {
  return value.replace(/['"]+/g, "").trim();
}

export function isAdmin(uid: string | undefined, _request?: Request): boolean {
  if (!uid) return false;
  const cleanUserUid = cleanUid(uid);
  if (cleanUserUid === SINGLE_ADMIN_UID) return true;
  const raw = process.env.NEXT_PUBLIC_ADMIN_UIDS ?? "";
  if (!raw.trim()) return false;
  const cleanAllowed = raw.split(",").map((id) => cleanUid(id)).filter(Boolean);
  return cleanAllowed.includes(cleanUserUid);
}
