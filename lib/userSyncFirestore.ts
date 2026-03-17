/**
 * Cihazlar arası senkronizasyon (bilgisayar + mobil aynı hesap).
 * Giriş yapmış kullanıcı için: izleme ilerlemesi, arama geçmişi, dil, profil kurulumu Firestore'da.
 */
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";
import type { Locale } from "@/lib/i18n/types";
import { VALID_LOCALES } from "./i18n/locale";

const SEARCH_HISTORY_MAX = 12;

// --- Watch progress: users/{uid}/watchProgress/{projectId}
export async function getWatchProgress(
  uid: string,
  projectId: string
): Promise<number | null> {
  try {
    const ref = doc(db, "users", uid, "watchProgress", projectId);
    const snap = await getDoc(ref);
    const data = snap.data();
    const time = data?.currentTime;
    if (typeof time !== "number" || time < 5) return null;
    return time;
  } catch {
    return null;
  }
}

export async function setWatchProgress(
  uid: string,
  projectId: string,
  currentTime: number,
  duration?: number
): Promise<void> {
  try {
    const ref = doc(db, "users", uid, "watchProgress", projectId);
    await setDoc(ref, {
      currentTime,
      duration: duration ?? null,
      savedAt: Date.now(),
      updatedAt: serverTimestamp(),
    });
  } catch {
    // sessiz
  }
}

export async function getWatchProgressPercent(
  uid: string,
  projectId: string
): Promise<number | null> {
  try {
    const ref = doc(db, "users", uid, "watchProgress", projectId);
    const snap = await getDoc(ref);
    const data = snap.data();
    const time = data?.currentTime;
    const duration = data?.duration;
    if (typeof time !== "number" || typeof duration !== "number" || duration <= 0)
      return null;
    const pct = Math.min(99, (time / duration) * 100);
    return pct > 2 ? pct : null;
  } catch {
    return null;
  }
}

// --- Search history: users/{uid}.searchHistory
export async function getSearchHistoryForUser(uid: string): Promise<string[]> {
  try {
    const ref = doc(db, "users", uid);
    const snap = await getDoc(ref);
    const list = snap.get("searchHistory");
    if (!Array.isArray(list)) return [];
    return list
      .filter((q) => typeof q === "string" && q.trim())
      .slice(0, SEARCH_HISTORY_MAX);
  } catch {
    return [];
  }
}

export async function setSearchHistoryForUser(
  uid: string,
  list: string[]
): Promise<void> {
  try {
    const ref = doc(db, "users", uid);
    const trimmed = list
      .filter((q) => typeof q === "string" && q.trim())
      .slice(0, SEARCH_HISTORY_MAX);
    await setDoc(ref, { searchHistory: trimmed }, { merge: true });
  } catch {
    // sessiz
  }
}

// --- Locale: users/{uid}.locale, users/{uid}.localeAuto
export async function getUserLocale(uid: string): Promise<{
  locale: Locale;
  auto: boolean;
} | null> {
  try {
    const ref = doc(db, "users", uid);
    const snap = await getDoc(ref);
    const locale = snap.get("locale");
    const auto = snap.get("localeAuto");
    if (locale && VALID_LOCALES.includes(locale as Locale)) {
      return {
        locale: locale as Locale,
        auto: auto === true,
      };
    }
    return null;
  } catch {
    return null;
  }
}

export async function setUserLocale(
  uid: string,
  locale: Locale,
  auto: boolean
): Promise<void> {
  try {
    const ref = doc(db, "users", uid);
    await setDoc(ref, { locale, localeAuto: auto }, { merge: true });
  } catch {
    // sessiz
  }
}

// --- Profile setup done: users/{uid}.profileSetupDone
export async function getProfileSetupDone(uid: string): Promise<boolean> {
  try {
    const ref = doc(db, "users", uid);
    const snap = await getDoc(ref);
    return snap.get("profileSetupDone") === true;
  } catch {
    return false;
  }
}

export async function setProfileSetupDone(uid: string): Promise<void> {
  try {
    const ref = doc(db, "users", uid);
    await setDoc(ref, { profileSetupDone: true }, { merge: true });
  } catch {
    // sessiz
  }
}
