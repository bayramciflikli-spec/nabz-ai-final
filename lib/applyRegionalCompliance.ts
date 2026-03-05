/**
 * Ülkeye göre yasal uyumluluk politikası.
 * legal_settings koleksiyonundan ilgili policy dokümanını getirir.
 */

import { getAdminFirestore } from "./firebase-admin";
import { isEuropeanUnion } from "./countryRules";

export type LegalPolicyDoc = "Global_Standard" | "KVKK_Compliance" | "GDPR_Compliance";

export interface LegalSettings {
  policy: LegalPolicyDoc;
  consentRequired?: boolean;
  dataRetentionDays?: number;
  cookieConsent?: boolean;
  [key: string]: unknown;
}

/**
 * Kullanıcı ülkesine göre yasal politika belirler ve Firestore'dan ayarları getirir.
 */
export async function applyRegionalCompliance(
  userCountry: string | null
): Promise<{ policy: LegalPolicyDoc; settings: LegalSettings | null }> {
  let policy: LegalPolicyDoc = "Global_Standard";
  if (userCountry?.toUpperCase().trim() === "TR") {
    policy = "KVKK_Compliance";
  } else if (isEuropeanUnion(userCountry)) {
    policy = "GDPR_Compliance";
  }

  const adminDb = getAdminFirestore();
  if (!adminDb) {
    return { policy, settings: null };
  }

  try {
    const snap = await adminDb.collection("legal_settings").doc(policy).get();
    const data = snap.exists ? snap.data() : null;
    return {
      policy,
      settings: data ? { ...data, policy } as LegalSettings : null,
    };
  } catch (e) {
    console.error("[applyRegionalCompliance]", e);
    return { policy, settings: null };
  }
}
