/**
 * NABZ-AI — İçerik onaylandığında çalışan otomatik terfi motoru.
 * Explorer + 5 onaylı içerik = Architect terfisi.
 */

import { getAdminFirestore } from "./firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

const PROMOTION_THRESHOLD = 5;

/**
 * Kullanıcı Explorer ise ve 5 onaylı içeriğe ulaştıysa Architect'e terfi et.
 * Onay sonrası çağrılır; approvedContentCount zaten artırılmış olmalı.
 */
export async function checkForPromotion(uid: string): Promise<boolean> {
  const adminDb = getAdminFirestore();
  if (!adminDb) return false;

  const userRef = adminDb.collection("users").doc(uid);
  const userSnap = await userRef.get();
  const userData = userSnap.data();

  if (!userData) return false;

  const role = (userData.role || "explorer") as string;
  const approvedContentCount = userData.approvedContentCount ?? 0;

  if (role !== "explorer" || approvedContentCount < PROMOTION_THRESHOLD) {
    return false;
  }

  await userRef.update({
    role: "architect",
    trustScore: 80,
    promotionDate: new Date().toISOString(),
  });

  console.log(`🎉 Kullanıcı ${uid} Architect rütbesine terfi etti!`);

  // Bildirim oluştur
  try {
    await adminDb.collection("notifications").add({
      userId: uid,
      type: "system",
      title: "Tebrikler! Artık Architect'sin! 🎉",
      body: "5 içeriğin onaylandı. Artık dünyayla paylaşabilir ve kazanabilirsin!",
      link: "/upload",
      read: false,
      createdAt: FieldValue.serverTimestamp(),
    });
  } catch (e) {
    console.error("Promotion notification error:", e);
  }

  return true;
}
