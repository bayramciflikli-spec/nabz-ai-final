/**
 * Beğeni, izlenme, daha sonra izle, kütüphane
 */
import { db, auth } from "./firebase";
import {
  doc,
  getDoc,
  updateDoc,
  setDoc,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";

/** Projeye beğeni ekle/çıkar */
export async function toggleLike(projectId: string): Promise<boolean> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Giriş yapmanız gerekiyor.");

  const projectRef = doc(db, "projects", projectId);
  const snap = await getDoc(projectRef);
  if (!snap.exists()) throw new Error("İçerik bulunamadı.");

  const data = snap.data();
  const likedBy = (data?.likedBy as string[]) || [];
  const dislikedBy = (data?.dislikedBy as string[]) || [];
  const hasLiked = likedBy.includes(uid);
  const hasDisliked = dislikedBy.includes(uid);

  const updates: Record<string, unknown> = {};
  if (hasLiked) {
    updates.likedBy = arrayRemove(uid);
  } else {
    updates.likedBy = arrayUnion(uid);
    if (hasDisliked) updates.dislikedBy = arrayRemove(uid);
  }
  await updateDoc(projectRef, updates);
  return !hasLiked;
}

/** Projeye beğenmeme ekle/çıkar */
export async function toggleDislike(projectId: string): Promise<boolean> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Giriş yapmanız gerekiyor.");

  const projectRef = doc(db, "projects", projectId);
  const snap = await getDoc(projectRef);
  if (!snap.exists()) throw new Error("İçerik bulunamadı.");

  const data = snap.data();
  const dislikedBy = (data?.dislikedBy as string[]) || [];
  const likedBy = (data?.likedBy as string[]) || [];
  const hasDisliked = dislikedBy.includes(uid);
  const hasLiked = likedBy.includes(uid);

  const updates: Record<string, unknown> = {};
  if (hasDisliked) {
    updates.dislikedBy = arrayRemove(uid);
  } else {
    updates.dislikedBy = arrayUnion(uid);
    if (hasLiked) updates.likedBy = arrayRemove(uid);
  }
  await updateDoc(projectRef, updates);
  return !hasDisliked;
}

/** Kullanıcı beğenmiş mi? */
export async function hasLiked(projectId: string): Promise<boolean> {
  const uid = auth.currentUser?.uid;
  if (!uid) return false;
  const projectRef = doc(db, "projects", projectId);
  const snap = await getDoc(projectRef);
  const likedBy = (snap.data()?.likedBy as string[]) || [];
  return likedBy.includes(uid);
}

/** Kullanıcı beğenmemiş mi? */
export async function hasDisliked(projectId: string): Promise<boolean> {
  const uid = auth.currentUser?.uid;
  if (!uid) return false;
  const projectRef = doc(db, "projects", projectId);
  const snap = await getDoc(projectRef);
  const dislikedBy = (snap.data()?.dislikedBy as string[]) || [];
  return dislikedBy.includes(uid);
}

/** İzleme geçmişini getir (öneri için) */
export async function getWatchHistory(uid: string): Promise<string[]> {
  const userRef = doc(db, "users", uid);
  const snap = await getDoc(userRef);
  const history = (snap.data()?.watchHistory as Array<{ projectId: string }>) || [];
  return history.map((h) => h.projectId).filter(Boolean);
}

/** İzleme geçmişine ekle */
export async function addToHistory(projectId: string, projectData?: { title?: string; imageUrl?: string; authorName?: string }): Promise<void> {
  const uid = auth.currentUser?.uid;
  if (!uid) return;

  const userRef = doc(db, "users", uid);
  const snap = await getDoc(userRef);
  const history = (snap.data()?.watchHistory as Array<{ projectId: string; at: string; title?: string; imageUrl?: string; authorName?: string }>) || [];
  const filtered = history.filter((h) => h.projectId !== projectId);
  const newEntry = {
    projectId,
    at: new Date().toISOString(),
    title: projectData?.title,
    imageUrl: projectData?.imageUrl,
    authorName: projectData?.authorName,
  };
  const updated = [newEntry, ...filtered].slice(0, 100);

  await setDoc(userRef, { watchHistory: updated }, { merge: true });
}

/** Daha sonra izleye ekle/çıkar */
export async function toggleWatchLater(projectId: string): Promise<boolean> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Giriş yapmanız gerekiyor.");

  const userRef = doc(db, "users", uid);
  const snap = await getDoc(userRef);
  const watchLater = (snap.data()?.watchLater as string[]) || [];
  const hasIt = watchLater.includes(projectId);

  if (hasIt) {
    const updated = watchLater.filter((id) => id !== projectId);
    await setDoc(userRef, { watchLater: updated }, { merge: true });
    return false;
  } else {
    await setDoc(userRef, { watchLater: [...watchLater, projectId] }, { merge: true });
    return true;
  }
}

/** Daha sonra izle listesinde mi? */
export async function hasWatchLater(projectId: string): Promise<boolean> {
  const uid = auth.currentUser?.uid;
  if (!uid) return false;
  const userRef = doc(db, "users", uid);
  const snap = await getDoc(userRef);
  const watchLater = (snap.data()?.watchLater as string[]) || [];
  return watchLater.includes(projectId);
}

/** Kütüphanede kayıtlı mı? */
export async function hasSaved(projectId: string): Promise<boolean> {
  const uid = auth.currentUser?.uid;
  if (!uid) return false;
  const userRef = doc(db, "users", uid);
  const snap = await getDoc(userRef);
  const saved = (snap.data()?.savedProjects as string[]) || [];
  return saved.includes(projectId);
}

/** Kütüphaneye ekle (kaydet) */
export async function toggleSaved(projectId: string): Promise<boolean> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Giriş yapmanız gerekiyor.");

  const userRef = doc(db, "users", uid);
  const snap = await getDoc(userRef);
  const saved = (snap.data()?.savedProjects as string[]) || [];
  const hasIt = saved.includes(projectId);

  if (hasIt) {
    const updated = saved.filter((id) => id !== projectId);
    await setDoc(userRef, { savedProjects: updated }, { merge: true });
    return false;
  } else {
    await setDoc(userRef, { savedProjects: [...saved, projectId] }, { merge: true });
    return true;
  }
}
