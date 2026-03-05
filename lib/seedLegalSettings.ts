/**
 * legal_settings Firestore koleksiyonu için varsayılan dokümanlar.
 * applyRegionalCompliance bu dokümanları okur.
 */

import type { LegalPolicyDoc, LegalSettings } from "./applyRegionalCompliance";

export const LEGAL_SETTINGS_DEFAULTS: Record<LegalPolicyDoc, LegalSettings> = {
  Global_Standard: {
    policy: "Global_Standard",
    consentRequired: true,
    dataRetentionDays: 730,
    cookieConsent: true,
    label: "Global Standard",
    description: "Diğer ülkeler için varsayılan veri koruma politikası.",
  },
  KVKK_Compliance: {
    policy: "KVKK_Compliance",
    consentRequired: true,
    dataRetentionDays: 365,
    cookieConsent: true,
    label: "KVKK Uyumluluğu",
    description: "6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) uyumlu politikalar.",
  },
  GDPR_Compliance: {
    policy: "GDPR_Compliance",
    consentRequired: true,
    dataRetentionDays: 365,
    cookieConsent: true,
    label: "GDPR Uyumluluğu",
    description: "AB Genel Veri Koruma Tüzüğü (GDPR) uyumlu politikalar.",
  },
};

/**
 * Firestore legal_settings koleksiyonuna varsayılan dokümanları yazar.
 */
export async function seedLegalSettings(): Promise<{ ok: boolean; created: string[]; error?: string }> {
  const { getAdminFirestore } = await import("./firebase-admin");
  const adminDb = getAdminFirestore();
  if (!adminDb) {
    return { ok: false, created: [], error: "Firestore Admin başlatılamadı" };
  }

  const created: string[] = [];
  try {
    for (const [docId, data] of Object.entries(LEGAL_SETTINGS_DEFAULTS)) {
      await adminDb.collection("legal_settings").doc(docId).set(data, { merge: true });
      created.push(docId);
    }
    return { ok: true, created };
  } catch (e) {
    console.error("[seedLegalSettings]", e);
    return {
      ok: false,
      created,
      error: e instanceof Error ? e.message : "Bilinmeyen hata",
    };
  }
}
