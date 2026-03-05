/**
 * Hukuki Onay Mekanizması — Final Versiyon
 * Kullanıcı "Kabul Ediyorum ve Kayıt Ol" butonuna bastığında yasal kabul imzası oluşturur.
 */

import { randomBytes } from "crypto";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminFirestore } from "./firebase-admin";

export const LEGAL_VERSION = "2026.FEB.FINAL";

function generateRandomID(): string {
  return randomBytes(12).toString("hex");
}

export interface ConsentEvidence {
  ip?: string;
  userAgent?: string;
  /** Örn: "Desktop/Chrome", "Mobile/Safari" */
  device?: string;
  /** Client-side browser fingerprint (hukuki kanıt) */
  fingerprint?: string;
}

function parseDevice(userAgent: string | null): string {
  if (!userAgent) return "Unknown";
  const ua = userAgent.toLowerCase();
  const isMobile = /mobile|android|iphone|ipad|ipod|webos|blackberry|iemobile|opera mini/i.test(ua);
  let browser = "Unknown";
  if (ua.includes("chrome") && !ua.includes("edg")) browser = "Chrome";
  else if (ua.includes("safari") && !ua.includes("chrome")) browser = "Safari";
  else if (ua.includes("firefox")) browser = "Firefox";
  else if (ua.includes("edg")) browser = "Edge";
  return `${isMobile ? "Mobile" : "Desktop"}/${browser}`;
}

/**
 * finalLegalSeal — Hukuki onay mührü.
 * legal_history alt koleksiyonuna kayıt + users.legal_clearance: true
 */
export async function confirmLegalAcceptance(
  userID: string,
  evidence?: ConsentEvidence
): Promise<string> {
  const adminDb = getAdminFirestore();
  if (!adminDb) {
    throw new Error("Firestore Admin yapılandırılmamış");
  }

  const signatureId = "SIG-" + generateRandomID();
  const device = evidence?.device ?? parseDevice(evidence?.userAgent ?? null);

  const complianceData = {
    signature_id: signatureId,
    tos_version: LEGAL_VERSION,
    signed_at: FieldValue.serverTimestamp(),
    privacy_policy_accepted: true,
    dmca_policy_accepted: true, // Telif ihbar sürecini bildiğini onaylar
    liability_waiver: true, // Sorumluluk sınırlandırmasını kabul eder
    data_retention_consent: true, // Bölgesel mevzuat uyumu
    accepted_terms: true,
    accepted_ethics_declaration: true, // +18, Kumar ve Dini değerler yasağı
    fingerprint: evidence?.fingerprint ?? null,
    user_metadata: {
      ip: evidence?.ip ?? null,
      device,
    },
  };

  const docRef = adminDb
    .collection("users")
    .doc(userID)
    .collection("legal_history")
    .doc(signatureId);

  await docRef.set(complianceData);

  await adminDb.collection("users").doc(userID).update({
    legal_clearance: true,
  });

  console.log(`[finalLegalSeal] ${userID} imza: ${signatureId} v${LEGAL_VERSION}`);
  return signatureId;
}

export type LegalStatus = "UNAUTHORIZED_ACCESS" | "LEGAL_CLEAR_TO_PROCEED";

/**
 * Kullanıcının yasal kabul geçmişi var mı kontrol eder.
 * legal_clearance (users doc) veya legal_history subcollection üzerinden.
 */
export async function checkUserLegalStatus(userID: string): Promise<LegalStatus> {
  const adminDb = getAdminFirestore();
  if (!adminDb) {
    return "UNAUTHORIZED_ACCESS";
  }

  const userSnap = await adminDb.collection("users").doc(userID).get();
  if (userSnap.data()?.legal_clearance === true) {
    return "LEGAL_CLEAR_TO_PROCEED";
  }

  const logs = await adminDb
    .collection("users")
    .doc(userID)
    .collection("legal_history")
    .limit(1)
    .get();

  return logs.empty ? "UNAUTHORIZED_ACCESS" : "LEGAL_CLEAR_TO_PROCEED";
}
