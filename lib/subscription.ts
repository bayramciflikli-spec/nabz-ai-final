import { db } from "./firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import type { LegalCode } from "./countryRules";
import { isAdmin } from "./isAdmin";

export async function isPlatformSubscribed(uid: string): Promise<boolean> {
  if (!uid) return false;
  if (isAdmin(uid)) return true; // Admin her zaman abone sayılır, kaydol/abone ol istemez
  const userRef = doc(db, "users", uid);
  const snap = await getDoc(userRef);
  return !!snap.data()?.isPlatformSubscribed;
}

export async function isUserBanned(uid: string): Promise<boolean> {
  if (!uid) return false;
  const userRef = doc(db, "users", uid);
  const snap = await getDoc(userRef);
  return !!snap.data()?.isBanned;
}

export interface SubscriptionTerms {
  telifAccepted: boolean;
  contentRulesAccepted: boolean;
  termsOfServiceAccepted: boolean;
  privacyPolicyAccepted: boolean;
  /** Ülkeye göre kabul edilen yasa: KVKK | GDPR | CCPA */
  acceptedLaw?: LegalCode;
  /** @deprecated Yerine acceptedLaw kullanın. Geriye uyumluluk için. */
  kvkkAccepted?: boolean;
}

export async function subscribeToPlatform(
  uid: string,
  terms: SubscriptionTerms
): Promise<void> {
  if (!uid) return;
  const dataProtectionOk = terms.acceptedLaw ?? terms.kvkkAccepted;
  const required =
    terms.telifAccepted &&
    terms.contentRulesAccepted &&
    terms.termsOfServiceAccepted &&
    terms.privacyPolicyAccepted &&
    dataProtectionOk;
  if (!required) {
    throw new Error("Tüm şartları ve yasal metinleri kabul etmeniz gerekiyor.");
  }
  const now = new Date().toISOString();
  const userRef = doc(db, "users", uid);
  await setDoc(
    userRef,
    {
      isPlatformSubscribed: true,
      termsTelifAccepted: true,
      termsContentRulesAccepted: true,
      termsOfServiceAccepted: true,
      termsPrivacyPolicyAccepted: true,
      termsKvkkAccepted: true,
      acceptedLaw: terms.acceptedLaw ?? "GDPR",
      termsAcceptedAt: now,
      legalAcceptedAt: now,
    },
    { merge: true }
  );
}
