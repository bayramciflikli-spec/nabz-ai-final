/**
 * NABZ-AI — Kurucu Rolü Talep Etme
 * admins/{uid} dokümanına SUPER_ADMIN yetkileri yazar.
 * Sadece NEXT_PUBLIC_ADMIN_UIDS'deki UID'ler talep edebilir (güvenlik).
 */

import { getAdminFirestore } from "./firebase-admin";
import { isAdmin } from "./isAdmin";

export interface ClaimResult {
  ok: boolean;
  error?: string;
}

/**
 * Kurucu rolünü admins koleksiyonuna yazar.
 * @param uid Talep eden kullanıcının UID'si (token ile doğrulanmış olmalı)
 */
export async function claimFounderRole(uid: string): Promise<ClaimResult> {
  const db = getAdminFirestore();
  if (!db) {
    return { ok: false, error: "Firestore yapılandırılmamış" };
  }

  if (!isAdmin(uid)) {
    return { ok: false, error: "Bu işlem için önceden tanımlı admin UID gerekir" };
  }

  try {
    const userRef = db.collection("admins").doc(uid);
    await userRef.set(
      {
        role: "SUPER_ADMIN",
        permissions: ["ALL_ACCESS", "LEGAL_UPLOAD", "FINANCIAL_VIEW"],
        is_founder: true,
        security_clearance: 10,
        claimed_at: new Date().toISOString(),
      },
      { merge: true }
    );
    return { ok: true };
  } catch (e) {
    console.error("claimFounderRole:", e);
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Talep hatası",
    };
  }
}
