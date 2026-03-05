import { db, auth } from "./firebase";
import {
  collection,
  addDoc,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";

export interface Playlist {
  id: string;
  name: string;
  projectIds: string[];
  createdAt?: unknown;
  userId?: string;
}

export async function createPlaylist(name: string): Promise<string> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Giriş yapmanız gerekiyor.");

  const ref = await addDoc(collection(db, "playlists"), {
    name,
    projectIds: [],
    userId: uid,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getPlaylists(userId: string): Promise<Playlist[]> {
  const q = query(
    collection(db, "playlists"),
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Playlist));
}

export async function addToPlaylist(playlistId: string, projectId: string): Promise<void> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Giriş yapmanız gerekiyor.");

  const ref = doc(db, "playlists", playlistId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("Oynatma listesi bulunamadı.");
  if (snap.data()?.userId !== uid) throw new Error("Bu listeyi düzenleme yetkiniz yok.");

  const projectIds = (snap.data()?.projectIds as string[]) || [];
  if (projectIds.includes(projectId)) return;
  await updateDoc(ref, { projectIds: [...projectIds, projectId] });
}

export async function removeFromPlaylist(playlistId: string, projectId: string): Promise<void> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Giriş yapmanız gerekiyor.");

  const ref = doc(db, "playlists", playlistId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("Oynatma listesi bulunamadı.");
  if (snap.data()?.userId !== uid) throw new Error("Bu listeyi düzenleme yetkiniz yok.");

  const projectIds = ((snap.data()?.projectIds as string[]) || []).filter((id) => id !== projectId);
  await updateDoc(ref, { projectIds });
}

export async function deletePlaylist(playlistId: string): Promise<void> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Giriş yapmanız gerekiyor.");

  const ref = doc(db, "playlists", playlistId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("Oynatma listesi bulunamadı.");
  if (snap.data()?.userId !== uid) throw new Error("Bu listeyi silme yetkiniz yok.");

  await deleteDoc(ref);
}
