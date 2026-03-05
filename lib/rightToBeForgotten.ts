/**
 * GDPR Madde 17 — Silinme Hakkı (Right to Be Forgotten)
 * Kullanıcının kimlik bilgilerini anonimleştirir, içerikleri gizler.
 * Mali kayıtlar hukuki süre boyunca saklanır.
 *
 * Not: Firebase Auth hesabı silinmez. Tam hesap silme için
 * admin.auth().deleteUser(uid) ayrıca çağrılmalıdır.
 */

import { getAdminFirestore } from "./firebase-admin";
import { getAdminStorageInstance } from "./firebase-admin";

/**
 * Kullanıcının tüm içeriklerini gizle (silinmez, mali kayıt için saklanır).
 */
async function hideAllUserContent(userID: string): Promise<void> {
  const adminDb = getAdminFirestore();
  if (!adminDb) {
    throw new Error("Firestore Admin yapılandırılmamış");
  }

  const projectsSnap = await adminDb
    .collection("projects")
    .where("authorId", "==", userID)
    .get();

  for (const d of projectsSnap.docs) {
    await d.ref.update({
      isVisible: false,
      rtbfDeleted: true,
      rtbfAt: new Date().toISOString(),
      authorName: "USER_DELETED",
      authorImage: null,
    });
  }

  // owner_uid ile eşleşen projeler
  const ownerSnap = await adminDb
    .collection("projects")
    .where("owner_uid", "==", userID)
    .get();

  for (const d of ownerSnap.docs) {
    if (!d.data().rtbfDeleted) {
      await d.ref.update({
        isVisible: false,
        rtbfDeleted: true,
        rtbfAt: new Date().toISOString(),
        authorName: "USER_DELETED",
        authorImage: null,
      });
    }
  }

  const contentsSnap = await adminDb
    .collection("contents")
    .where("owner", "==", userID)
    .get();

  for (const d of contentsSnap.docs) {
    await d.ref.update({
      isVisible: false,
      rtbfDeleted: true,
      rtbfAt: new Date().toISOString(),
    });
  }

  console.log(`[rightToBeForgotten] ${userID} içerikleri gizlendi.`);
}

/**
 * GDPR Madde 17 — Silinme hakkı.
 * 1. Kimlik bilgilerini anonimleştir.
 * 2. KYC verilerini temizle.
 * 3. İçerikleri gizle (mali kayıtlar hukuki süre boyunca saklanır).
 */
export async function rightToBeForgotten(userID: string): Promise<void> {
  const adminDb = getAdminFirestore();
  if (!adminDb) {
    throw new Error("Firestore Admin yapılandırılmamış");
  }

  const userRef = adminDb.collection("users").doc(userID);
  await userRef.update({
    email: "ANONYMIZED",
    displayName: "USER_DELETED",
    displayNameLower: "user_deleted",
    photoURL: null,
    kyc_data: "PURGED",
    rtbfAt: new Date().toISOString(),
  });

  const kycRef = adminDb.collection("kyc_applications").doc(userID);
  const kycSnap = await kycRef.get();
  if (kycSnap.exists) {
    await kycRef.update({
      status: "purged",
      documentPath: "PURGED",
      selfiePath: "PURGED",
      purgedAt: new Date().toISOString(),
    });
  }

  try {
    const storage = getAdminStorageInstance();
    const bucket = storage?.bucket();
    if (bucket) {
      const [files] = await bucket.getFiles({ prefix: `private-kyc/${userID}/` });
      for (const file of files) {
        await file.delete().catch(() => {});
      }
    }
  } catch (e) {
    console.warn("[rightToBeForgotten] KYC storage temizlenemedi:", e);
  }

  await hideAllUserContent(userID);

  console.log(`[rightToBeForgotten] ${userID} anonimleştirildi.`);
}
