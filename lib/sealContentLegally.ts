/**
 * İçeriğe Dijital AI Mührü Basma ve Reklam Etiketi
 * Yasal açıklama ve meta etiketleri içeriğe ekler.
 */

import { getAdminFirestore } from "./firebase-admin";

/**
 * İçeriği yasal AI mührü ve etiketlerle işaretler.
 */
export async function sealContentLegally(
  contentID: string,
  isSponsored = false
): Promise<void> {
  const adminDb = getAdminFirestore();
  if (!adminDb) {
    throw new Error("Firestore Admin yapılandırılmamış");
  }

  const updates = {
    ai_generated_disclosure: "SIGNED_BY_NABZ_ALGORITHM",
    metadata_label: "PRODUCED_BY_AI_ARCHITECT",
    display_label: isSponsored ? "AD_PARTNERSHIP" : "ORGANIC_CONTENT",
    sealed_at: new Date().toISOString(),
  };

  const contentsRef = adminDb.collection("contents").doc(contentID);
  const projectsRef = adminDb.collection("projects").doc(contentID);

  const [contentsSnap, projectsSnap] = await Promise.all([
    contentsRef.get(),
    projectsRef.get(),
  ]);

  if (contentsSnap.exists) {
    await contentsRef.update(updates);
  }
  if (projectsSnap.exists) {
    await projectsRef.update(updates);
  }

  console.log(`[sealContentLegally] ${contentID} mühürlendi. ${isSponsored ? "AD_PARTNERSHIP" : "ORGANIC_CONTENT"}`);
}
