/**
 * NABZ-AI — Gelir paylaşım fonksiyonu.
 * Satış/komisyon gelirini architect ve platform (kasa) arasında dağıtır.
 * Varsayılan: %10 architect, %90 platform.
 */

import { getAdminFirestore } from "./firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

const ROLE_COMMISSION: Record<string, number> = {
  architect: 10,
  master_architect: 15,
  guardian: 12,
  admin: 0,
};

export interface DistributeIncomeOptions {
  /** Architect payı (0-1). Varsayılan: rol bazlı (architect %10, master_architect %15, guardian %12) */
  architectRate?: number;
  /** İşlem açıklaması (log için) */
  description?: string;
}

/**
 * Satış tutarını architect ve platform arasında dağıt.
 * Architect'in balance ve totalEarnings artar, vault/main_account.totalProfit artar.
 */
export async function distributeIncome(
  saleAmount: number,
  architectUid: string,
  options: DistributeIncomeOptions = {}
): Promise<void> {
  if (saleAmount <= 0) {
    throw new Error("Satış tutarı 0'dan büyük olmalı");
  }

  const adminDb = getAdminFirestore();
  if (!adminDb) {
    throw new Error("Firestore Admin yapılandırılmamış");
  }

  let architectRate = options.architectRate;
  if (architectRate === undefined) {
    const userSnap = await adminDb.collection("users").doc(architectUid).get();
    const role = (userSnap.data()?.role as string) || "explorer";
    const commission = ROLE_COMMISSION[role] ?? 0;
    architectRate = commission / 100;
  }
  architectRate = Math.min(1, Math.max(0, architectRate));

  const architectPay = saleAmount * architectRate;
  const adminPay = saleAmount * (1 - architectRate);

  // 1. Architect'in cüzdanını güncelle
  const userRef = adminDb.collection("users").doc(architectUid);
  await userRef.update({
    balance: FieldValue.increment(architectPay),
    totalEarnings: FieldValue.increment(architectPay),
    lastIncomeAt: new Date().toISOString(),
  });

  // 2. Platform kasası (vault) güncelle
  const vaultRef = adminDb.collection("vault").doc("main_account");
  const vaultSnap = await vaultRef.get();
  if (vaultSnap.exists) {
    await vaultRef.update({
      totalProfit: FieldValue.increment(adminPay),
      lastUpdatedAt: new Date().toISOString(),
    });
  } else {
    await vaultRef.set({
      totalProfit: adminPay,
      lastUpdatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    });
  }

  console.log(
    `Gelir dağıtımı: $${saleAmount.toFixed(2)} → Architect: $${architectPay.toFixed(2)}, Platform: $${adminPay.toFixed(2)}${options.description ? ` (${options.description})` : ""}`
  );
}
