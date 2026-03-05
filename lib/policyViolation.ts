/**
 * NABZ-AI Kural Kalkanı — Politika ihlali durumunda kullanıcı cezalandırma.
 * Güven puanı sıfırlanır, rütbe Explorer'a çekilir.
 * Ağır ihlallerde (kumar, pornografi vb.) isBanned true yapılır.
 */

import { getAdminFirestore } from "./firebase-admin";

export interface PolicyViolationOptions {
  /** Ağır ihlal (kumar, pornografi vb.) — hesabı tamamen engelle */
  ban?: boolean;
}

/**
 * Politika ihlali durumunda kullanıcı yetkilerini askıya al.
 * - trustScore: 0
 * - role: "explorer"
 * - isBanned: options.ban true ise true
 */
export async function handlePolicyViolation(
  uid: string,
  options: PolicyViolationOptions = {}
): Promise<void> {
  const adminDb = getAdminFirestore();
  if (!adminDb) {
    throw new Error("Firestore Admin yapılandırılmamış");
  }

  const userRef = adminDb.collection("users").doc(uid);
  await userRef.update({
    trustScore: 0,
    role: "explorer",
    isBanned: options.ban ?? false,
    policyViolationAt: new Date().toISOString(),
  });

  console.log(
    `Kural Kalkanı: Kullanıcı ${uid} yetkileri askıya alındı.${options.ban ? " (Ban)" : ""}`
  );
}
