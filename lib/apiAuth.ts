/**
 * API route kimlik doğrulama - Firebase token ile
 * Hassas API'ler (generate-banner vb.) için kullanın
 */
import { getAuth } from "firebase-admin/auth";
import { getApps } from "firebase-admin/app";
import { getAdminStorageInstance } from "./firebase-admin";
import { isAdmin } from "./isAdmin";

export async function verifyApiAuth(request: Request): Promise<{ uid: string } | null> {
  const authHeader = request.headers.get("Authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return null;

  try {
    if (getApps().length === 0) {
      try {
        void getAdminStorageInstance();
      } catch {
        return null;
      }
    }
    const auth = getAuth();
    const decoded = await auth.verifyIdToken(token);
    return { uid: decoded.uid };
  } catch {
    return null;
  }
}

/** Admin API'leri için: token doğrula + isAdmin kontrolü */
export async function verifyAdminAuth(request: Request): Promise<{ uid: string } | null> {
  const user = await verifyApiAuth(request);
  if (!user || !isAdmin(user.uid, request)) return null;
  return user;
}
