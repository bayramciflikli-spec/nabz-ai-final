/**
 * NABZ-AI Fikri Mülkiyet (IP) Motoru — Bölüm 2
 * Admin Paneli Telif İptal ve Ceza Sistemi.
 * status: "BANNED_CONTENT" — İçerik silinmez, yasaklı olarak işaretlenir (mahkeme kanıtı).
 */

import { FieldValue } from "firebase-admin/firestore";
import { getAdminFirestore } from "./firebase-admin";
import { handlePolicyViolation } from "./policyViolation";

/**
 * Telif ihlali durumunda ceza uygular:
 * - İçerik: status BANNED_CONTENT, isVisible false (silinmez, kanıt olarak saklanır)
 * - Kullanıcı: trustScore -30, strikes +1
 * - 3 strike: hesap ban
 */
export async function applyStrike(
  contentID: string,
  adminReason: string
): Promise<{ ok: boolean; error?: string }> {
  const adminDb = getAdminFirestore();
  if (!adminDb) {
    return { ok: false, error: "Firestore Admin yapılandırılmamış" };
  }

  // projects ve contents aynı ID kullanır
  const projectRef = adminDb.collection("projects").doc(contentID);
  const contentsRef = adminDb.collection("contents").doc(contentID);

  const projectSnap = await projectRef.get();
  const contentsSnap = await contentsRef.get();

  const doc = projectSnap.exists ? projectSnap : contentsSnap;
  if (!doc?.exists) {
    return { ok: false, error: "İçerik bulunamadı" };
  }

  const creatorID = doc.data()?.owner || doc.data()?.authorId || doc.data()?.owner_uid;
  if (!creatorID) {
    return { ok: false, error: "İçerik sahibi bulunamadı" };
  }

  const updates = {
    status: "BANNED_CONTENT",
    reason: adminReason,
    isVisible: false,
    bannedAt: new Date().toISOString(),
  };

  if (projectSnap.exists) {
    await projectRef.update(updates);
  }
  if (contentsSnap.exists) {
    await contentsRef.update(updates);
  }

  const userRef = adminDb.collection("users").doc(creatorID);
  const userSnap = await userRef.get();
  const userData = userSnap.data();
  const currentStrikes = userData?.strikes ?? 0;

  await userRef.update({
    trustScore: FieldValue.increment(-30),
    strikes: FieldValue.increment(1),
  });

  const newStrikes = currentStrikes + 1;
  if (newStrikes >= 3) {
    await handlePolicyViolation(creatorID, { ban: true });
    console.log(`[applyStrike] Kullanıcı ${creatorID} 3. ihlalde banlandı.`);
  }

  const isCopyright = /telif|copyright|dmca|©/i.test(adminReason);
  const period = new Date().toISOString().slice(0, 7);
  await adminDb.collection("legal_logs").add({
    type: isCopyright ? "COPYRIGHT_TAKEDOWN" : "ETHICALLY_REJECTED",
    contentID,
    reason: adminReason,
    creatorID,
    period,
    createdAt: new Date().toISOString(),
  });

  console.log(`[applyStrike] ${contentID} yasaklandı. Creator: ${creatorID}, reason: ${adminReason}`);
  return { ok: true };
}
