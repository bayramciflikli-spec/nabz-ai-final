/**
 * Admin yetki kontrolü.
 * Sadece .env.local içindeki NEXT_PUBLIC_ADMIN_UIDS'deki UID'ler admin (senin Gmail hesabının UID'si).
 */
export function isAdmin(uid: string | undefined, request?: Request): boolean {
  if (!uid) return false;
  const uids = process.env.NEXT_PUBLIC_ADMIN_UIDS?.trim();
  if (!uids) return false;
  return uids.split(",").map((x) => x.trim()).filter(Boolean).includes(uid);
}
