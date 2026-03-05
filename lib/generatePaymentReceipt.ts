/**
 * NABZ-AI — Otomatik ödeme makbuzu oluşturucu.
 * Ödeme yapıldığında kullanıcı ve muhasebe için kayıt.
 */

import { getAdminFirestore } from "./firebase-admin";

export interface ReceiptData {
  id: string;
  to: string;
  amount: number;
  currency: string;
  description: string;
  date: string;
  status?: "pending" | "paid" | "failed";
}

/**
 * Ödeme makbuzu oluştur ve receipts koleksiyonuna kaydet.
 * Her ödeme için benzersiz makbuz numarası: NABZ-PAY-{timestamp}
 */
export async function generatePaymentReceipt(
  uid: string,
  amount: number,
  options?: { currency?: string; description?: string }
): Promise<string> {
  if (amount <= 0) {
    throw new Error("Ödeme tutarı 0'dan büyük olmalı");
  }

  const adminDb = getAdminFirestore();
  if (!adminDb) {
    throw new Error("Firestore Admin yapılandırılmamış");
  }

  const receiptID = "NABZ-PAY-" + Date.now();
  const receiptData: ReceiptData = {
    id: receiptID,
    to: uid,
    amount,
    currency: options?.currency ?? "USD",
    description: options?.description ?? "AI İçerik Üretim Hizmet Bedeli",
    date: new Date().toISOString(),
    status: "paid",
  };

  await adminDb.collection("receipts").doc(receiptID).set(receiptData);

  console.log(`Makbuz oluşturuldu: ${receiptID} - $${amount} → ${uid}`);
  return receiptID;
}
