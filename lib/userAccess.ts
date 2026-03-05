/**
 * NABZ-AI rol bazlı erişim kontrolü.
 * explorer: Sadece izleme, içerik yayınlayamaz
 * architect: İçerik yükleyebilir, onaya düşer (%10 pay)
 * master_architect: Elit üretici (%15 pay)
 * guardian: Moderatör yetkileri (%12 pay)
 * admin: Tam yetki
 */

import { db } from "./firebase";
import { doc, getDoc } from "firebase/firestore";
import { isAdmin } from "./isAdmin";

export type UserRole =
  | "explorer"
  | "architect"
  | "master_architect"
  | "guardian"
  | "admin";

export interface UserAccess {
  canUpload: boolean;
  shareInFeed?: boolean;
  commission?: number;
  canModerate?: boolean;
  superUser?: boolean;
  accessAll?: boolean;
}

export function checkUserAccess(userRole: string | undefined): UserAccess {
  const role = (userRole || "explorer") as UserRole;
  switch (role) {
    case "admin":
      return { canUpload: true, superUser: true, accessAll: true };
    case "guardian":
      return {
        canModerate: true,
        canUpload: true,
        shareInFeed: true,
        commission: 12,
      };
    case "master_architect":
      return {
        canUpload: true,
        shareInFeed: true,
        commission: 15,
      };
    case "architect":
      return {
        canUpload: true,
        shareInFeed: true,
        commission: 10,
      };
    case "explorer":
    default:
      return { canUpload: false, shareInFeed: false, commission: 0 };
  }
}

/** Kullanıcının Firestore'daki rolünü al ve erişim yetkisini döndür */
export async function getUserAccess(uid: string): Promise<UserAccess> {
  if (!uid) return checkUserAccess("explorer");
  if (isAdmin(uid)) return checkUserAccess("admin");

  const userRef = doc(db, "users", uid);
  const snap = await getDoc(userRef);
  const role = snap.data()?.role as string | undefined;
  return checkUserAccess(role);
}
