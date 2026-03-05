/**
 * NABZ-AI — KYC (Kimlik Doğrulama) Başvurusu.
 * Dosyalar güvenli private-kyc klasörüne yüklenir.
 */

import { getAdminFirestore } from "./firebase-admin";
import { getAdminStorageInstance } from "./firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

const KYC_BASE = "private-kyc";

export interface KYCSubmission {
  uid: string;
  status: "pending" | "approved" | "rejected";
  submittedAt: string;
  documentPath: string;
  selfiePath: string;
}

/**
 * KYC başvurusu oluştur: dosyaları yükle, Firestore'a kaydet.
 */
export async function submitKYC(
  uid: string,
  idFile: Buffer,
  selfieFile: Buffer,
  idMimeType: string,
  selfieMimeType: string
): Promise<void> {
  const storage = getAdminStorageInstance();
  const adminDb = getAdminFirestore();
  if (!adminDb) {
    throw new Error("Firestore Admin yapılandırılmamış");
  }

  const idExt = idMimeType?.includes("png") ? "png" : "jpg";
  const selfieExt = selfieMimeType?.includes("png") ? "png" : "jpg";
  const idPath = `${KYC_BASE}/${uid}/id_card.${idExt}`;
  const selfiePath = `${KYC_BASE}/${uid}/selfie.${selfieExt}`;

  const bucket = storage.bucket();
  const idRef = bucket.file(idPath);
  const selfieRef = bucket.file(selfiePath);

  await idRef.save(idFile, { contentType: idMimeType || "image/jpeg" });
  await selfieRef.save(selfieFile, { contentType: selfieMimeType || "image/jpeg" });

  await adminDb.collection("kyc_applications").doc(uid).set({
    uid,
    status: "pending",
    submittedAt: FieldValue.serverTimestamp(),
    documentPath: idPath,
    selfiePath,
    updatedAt: new Date().toISOString(),
  });

  console.log(`KYC başvurusu alındı: ${uid}`);
}
