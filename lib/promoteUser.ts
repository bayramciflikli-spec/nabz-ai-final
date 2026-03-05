/**
 * NABZ-AI — Admin kullanıcı terfi fonksiyonu.
 * Sadece admin erişebilir (API route üzerinden).
 * Terfi alan kullanıcının güven puanı tam yapılır.
 */

import { getAdminFirestore } from "./firebase-admin";
import type { UserRole } from "./userAccess";

const VALID_ROLES: UserRole[] = ["explorer", "architect", "master_architect", "guardian", "admin"];

/**
 * Kullanıcıyı yeni rütbeye yükselt ve güven puanını 100 yap.
 */
export async function promoteUser(uid: string, newRole: UserRole): Promise<void> {
  if (!VALID_ROLES.includes(newRole)) {
    throw new Error(`Geçersiz rol: ${newRole}`);
  }

  const adminDb = getAdminFirestore();
  if (!adminDb) {
    throw new Error("Firestore Admin yapılandırılmamış");
  }

  const userRef = adminDb.collection("users").doc(uid);
  const snap = await userRef.get();
  if (!snap.exists) {
    throw new Error("Kullanıcı bulunamadı");
  }

  await userRef.update({
    role: newRole,
    trustScore: 100,
    promotedAt: new Date().toISOString(),
    // Ban kaldırılmışsa terfi ile birlikte
    ...(snap.data()?.isBanned ? { isBanned: false } : {}),
  });

  console.log(`Kullanıcı ${uid} ${newRole} rütbesine yükseltildi.`);
}
