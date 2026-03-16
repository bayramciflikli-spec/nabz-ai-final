/**
 * Admin yetki kontrolü.
 * NEXT_PUBLIC_ADMIN_UIDS'deki UID'ler admin. Tırnak ve boşluk hatalarını (Vercel/Firebase) kod tarafında temizler.
 */
function cleanUid(value: string): string {
  return value.replace(/['"]+/g, "").trim();
}

export function isAdmin(uid: string | undefined, _request?: Request): boolean {
  if (!uid) return false;
  const raw = process.env.NEXT_PUBLIC_ADMIN_UIDS ?? "";
  if (!raw.trim()) return false;
  const cleanAllowed = raw.split(",").map((id) => cleanUid(id)).filter(Boolean);
  const cleanUserUid = cleanUid(uid);
  return cleanAllowed.includes(cleanUserUid);
}
