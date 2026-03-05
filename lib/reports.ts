import { db, auth } from "./firebase";
import { collection, addDoc, query, where, getDocs, orderBy, serverTimestamp } from "firebase/firestore";

export type ReportReason = "spam" | "uygunsuz" | "telif" | "nefret" | "şiddet" | "diger";

export async function reportContent(data: {
  projectId: string;
  reason: ReportReason;
  detail?: string;
}): Promise<void> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Giriş yapmanız gerekiyor.");

  await addDoc(collection(db, "reports"), {
    projectId: data.projectId,
    reason: data.reason,
    detail: data.detail || "",
    reporterId: uid,
    createdAt: serverTimestamp(),
  });
}

export async function getMyReports(userId: string): Promise<Array<{ id: string; projectId: string; reason: string; createdAt?: unknown }>> {
  const q = query(
    collection(db, "reports"),
    where("reporterId", "==", userId),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as any));
}
