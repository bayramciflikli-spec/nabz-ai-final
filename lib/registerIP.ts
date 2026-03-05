/**
 * NABZ-AI Fikri Mülkiyet (IP) Motoru — Bölüm 1
 * İçerik yüklenirken IP Pasaportu oluşturma.
 * fingerprint: Dosyanın DNA'sı — aynı içerik tekrar yüklenirse "Bu içerik zaten bir başkasına ait!" ile engellenir.
 * sponsor_use: true — 20 dev sponsor (OpenAI, Adobe vb.) içerikleri reklamlarında kullanabilir.
 */

import { createHash } from "crypto";
import { getAdminFirestore } from "./firebase-admin";
import { sealContentLegally } from "./sealContentLegally";

export interface RegisterIPFileData {
  imageUrl?: string;
  videoUrl?: string;
  primaryUrl?: string;
  /** İsteğe bağlı: Client tarafından hesaplanan dosya hash'i (duplicate tespiti için) */
  fileHash?: string;
}

/**
 * IP Pasaportu oluşturur. contents koleksiyonuna kayıt ekler.
 * Aynı fingerprint ile başka kullanıcı tarafından yüklenmiş içerik varsa hata döner.
 */
export async function registerIP(
  userID: string,
  fileData: RegisterIPFileData,
  toolName: string
): Promise<string> {
  const adminDb = getAdminFirestore();
  if (!adminDb) {
    throw new Error("Firestore Admin yapılandırılmamış");
  }

  const primaryUrl = fileData.primaryUrl || fileData.videoUrl || fileData.imageUrl || "";
  const contentID = "NABZ-" + Date.now();

  // fingerprint: Dosyanın DNA'sı — fileHash varsa kullan, yoksa URL hash'i
  const fingerprint = fileData.fileHash
    ? fileData.fileHash
    : createHash("sha256").update(primaryUrl || "blank").digest("hex");

  // Duplicate kontrolü: aynı fingerprint ile başka kullanıcıya ait içerik var mı?
  const existingSnap = await adminDb
    .collection("contents")
    .where("fingerprint", "==", fingerprint)
    .limit(1)
    .get();

  if (!existingSnap.empty) {
    const existing = existingSnap.docs[0];
    const owner = existing.data()?.owner;
    if (owner && owner !== userID) {
      throw new Error("Bu içerik zaten bir başkasına ait! Telif ihlali tespit edildi.");
    }
  }

  await adminDb.collection("contents").doc(contentID).set({
    owner: userID,
    tool: toolName,
    license: "NABZ-Commercial-v1",
    status: "pending_review",
    fingerprint,
    rights: { sponsor_use: true, resell: false },
    primaryUrl: primaryUrl || null,
    createdAt: new Date().toISOString(),
  });

  await sealContentLegally(contentID, false);

  return contentID;
}
