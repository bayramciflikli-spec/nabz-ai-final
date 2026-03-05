/**
 * Yasaklı terimler Firestore'da config/banned_terms dokümanında tutulur.
 * Admin UI ile ekleme/silme yapılır.
 */

import { getAdminFirestore } from "./firebase-admin";
import { SEARCH_BLACKLIST } from "./searchGuard";

const CONFIG_DOC = "config/banned_terms";

export async function getBannedTerms(): Promise<{ terms: string[]; fromFirestore: boolean }> {
  const db = getAdminFirestore();
  if (!db) return { terms: SEARCH_BLACKLIST, fromFirestore: false };

  try {
    const snap = await db.doc(CONFIG_DOC).get();
    const data = snap.data();
    const terms = data?.terms as string[] | undefined;
    if (Array.isArray(terms) && terms.length > 0) return { terms, fromFirestore: true };
    return { terms: SEARCH_BLACKLIST, fromFirestore: false };
  } catch (e) {
    console.error("[bannedTermsStorage]", e);
    return { terms: SEARCH_BLACKLIST, fromFirestore: false };
  }
}

/** getBannedTerms ile uyumlu - sadece terim listesi döner */
async function getBannedTermsArray(): Promise<string[]> {
  const r = await getBannedTerms();
  return r.terms;
}

export async function addBannedTerm(term: string): Promise<{ ok: boolean; error?: string }> {
  const t = term.trim().toLowerCase();
  if (!t || t.length < 2) return { ok: false, error: "En az 2 karakter gerekli" };

  const db = getAdminFirestore();
  if (!db) return { ok: false, error: "Firestore başlatılamadı" };

  try {
    const { terms } = await getBannedTerms();
    if (terms.includes(t)) return { ok: false, error: "Terim zaten listede" };

    const updated = [...terms, t].sort((a, b) => a.localeCompare(b));
    await db.doc(CONFIG_DOC).set({ terms: updated, updatedAt: new Date() }, { merge: true });
    return { ok: true };
  } catch (e) {
    console.error("[addBannedTerm]", e);
    return { ok: false, error: e instanceof Error ? e.message : "Hata" };
  }
}

export async function removeBannedTerm(term: string): Promise<{ ok: boolean; error?: string }> {
  const t = term.trim().toLowerCase();
  if (!t) return { ok: false, error: "Terim gerekli" };

  const db = getAdminFirestore();
  if (!db) return { ok: false, error: "Firestore başlatılamadı" };

  try {
    const terms = await getBannedTermsArray();
    const updated = terms.filter((w) => w !== t);
    if (updated.length === terms.length) return { ok: false, error: "Terim listede bulunamadı" };

    if (updated.length === 0) {
      return { ok: false, error: "Son terim silinemez (en az bir terim kalmalı)" };
    }

    await db.doc(CONFIG_DOC).set({ terms: updated, updatedAt: new Date() }, { merge: true });
    return { ok: true };
  } catch (e) {
    console.error("[removeBannedTerm]", e);
    return { ok: false, error: e instanceof Error ? e.message : "Hata" };
  }
}

export async function seedBannedTermsIfEmpty(): Promise<void> {
  const db = getAdminFirestore();
  if (!db) return;

  try {
    const snap = await db.doc(CONFIG_DOC).get();
    const data = snap.data();
    const terms = data?.terms as string[] | undefined;
    if (Array.isArray(terms) && terms.length > 0) return;

    await db.doc(CONFIG_DOC).set({
      terms: SEARCH_BLACKLIST,
      updatedAt: new Date(),
      seededFrom: "SEARCH_BLACKLIST",
    });
  } catch (e) {
    console.error("[seedBannedTermsIfEmpty]", e);
  }
}
