/**
 * NABZ-AI — Resmi ödeme bilgileri kaydetme.
 * IBAN, Wise, Payoneer vb. ödeme yöntemleri.
 */

import { getAdminFirestore } from "./firebase-admin";

export type PayoutMethodType = "BANK_TRANSFER" | "WISE" | "PAYONEER";

export interface PaymentDetails {
  fullName: string;
  /** IBAN veya Payoneer e-postası */
  id: string;
  swift?: string;
  bankName?: string;
}

export interface PayoutMethod {
  type: PayoutMethodType;
  beneficiaryName: string;
  accountIdentifier: string;
  bankSwift?: string;
  bankName?: string;
  status: "PENDING" | "VERIFIED" | "REJECTED";
  updatedAt: string;
}

/**
 * Kullanıcının resmi ödeme bilgilerini kaydet.
 * Status başlangıçta PENDING; admin onayından sonra VERIFIED olur.
 */
export async function saveOfficialPaymentInfo(
  uid: string,
  method: PayoutMethodType,
  details: PaymentDetails
): Promise<void> {
  const adminDb = getAdminFirestore();
  if (!adminDb) {
    throw new Error("Firestore Admin yapılandırılmamış");
  }

  const fullName = (details.fullName || "").trim();
  const accountId = (details.id || "").trim();
  if (!fullName || !accountId) {
    throw new Error("Ad Soyad ve hesap bilgisi (IBAN/e-posta/adres) gerekli");
  }

  const validMethods: PayoutMethodType[] = ["BANK_TRANSFER", "WISE", "PAYONEER"];
  if (!validMethods.includes(method)) {
    throw new Error("Geçersiz ödeme yöntemi");
  }

  const userRef = adminDb.collection("users").doc(uid);
  const now = new Date().toISOString();

  const payoutMethod: PayoutMethod = {
    type: method,
    beneficiaryName: fullName,
    accountIdentifier: accountId,
    bankSwift: details.swift?.trim() || undefined,
    bankName: details.bankName?.trim() || undefined,
    status: "PENDING",
    updatedAt: now,
  };

  await userRef.update({
    payoutMethod,
    payoutMethodUpdatedAt: now,
  });

  console.log(`Ödeme bilgisi kaydedildi: ${uid} - ${method}`);
}
