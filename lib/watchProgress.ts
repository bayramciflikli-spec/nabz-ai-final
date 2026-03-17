/**
 * Video izleme ilerlemesi: giriş yapmışsa Firestore (cihazlar arası), değilse localStorage.
 */
const KEY_PREFIX = "nabz_progress_";
import { setWatchProgress as setWatchProgressFirestore } from "./userSyncFirestore";

export function saveProgress(
  projectId: string,
  currentTime: number,
  duration?: number,
  uid?: string
): void {
  if (typeof window === "undefined") return;
  try {
    const key = `${KEY_PREFIX}${projectId}`;
    const data = JSON.stringify({ currentTime, duration, savedAt: Date.now() });
    localStorage.setItem(key, data);
  } catch {
    // localStorage full veya disable
  }
  if (uid) {
    setWatchProgressFirestore(uid, projectId, currentTime, duration).catch(() => {});
  }
}

export function getProgress(projectId: string): number | null {
  if (typeof window === "undefined") return null;
  try {
    const key = `${KEY_PREFIX}${projectId}`;
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const data = JSON.parse(raw) as { currentTime?: number; savedAt?: number };
    const time = data?.currentTime;
    if (typeof time !== "number" || time < 5) return null; // 5 saniyeden kısa başlamaya değmez
    return time;
  } catch {
    return null;
  }
}

/** Giriş yapmış kullanıcı: Firestore'dan ilerleme (bilgisayar + mobil aynı). */
export { getWatchProgress as getProgressForUser } from "./userSyncFirestore";

export function getProgressPercent(projectId: string): number | null {
  if (typeof window === "undefined") return null;
  try {
    const key = `${KEY_PREFIX}${projectId}`;
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const data = JSON.parse(raw) as { currentTime?: number; duration?: number };
    const time = data?.currentTime;
    const duration = data?.duration;
    if (typeof time !== "number" || typeof duration !== "number" || duration <= 0) return null;
    const pct = Math.min(99, (time / duration) * 100);
    return pct > 2 ? pct : null; // %2'den az ilerleme gösterme
  } catch {
    return null;
  }
}

/** Giriş yapmış kullanıcı: Firestore'dan yüzde (cihazlar arası). */
export { getWatchProgressPercent as getProgressPercentForUser } from "./userSyncFirestore";
