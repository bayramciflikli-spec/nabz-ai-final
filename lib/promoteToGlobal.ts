/**
 * İçeriği Global dağıtıma yükseltme
 * 1. Güvenlik ve Etik Kontrolü (AI + rule-based)
 * 2. Çoklu Dil Çevirisi
 * 3. Firestore güncellemesi
 * 4. İçerik sahibinin approvedContentCount artırılır + otomatik terfi kontrolü
 */

import { getAdminFirestore } from "./firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { check } from "./aiSafetyGuard";
import { translate, type TranslationMap } from "./aiTranslator";
import { checkForPromotion } from "./checkForPromotion";

export interface PromoteResult {
  ok: boolean;
  error?: string;
}

/** İçeriği global dağıtıma aç */
export async function promoteToGlobal(contentId: string): Promise<PromoteResult> {
  const adminDb = getAdminFirestore();
  if (!adminDb) {
    return { ok: false, error: "Firestore Admin yapılandırılmamış" };
  }

  const projectRef = adminDb.collection("projects").doc(contentId);
  const snap = await projectRef.get();
  if (!snap.exists) {
    return { ok: false, error: "İçerik bulunamadı" };
  }

  const data = snap.data() ?? {};
  const content = {
    id: contentId,
    title: data.title,
    description: data.prompt ?? data.description,
    kategori: data.kategori,
    category: data.category,
    isAdult: data.isAdult,
  };

  // 2. Güvenlik ve Etik Kontrolü ([2026-02-04] talimatı: +18, kumar, dini değer)
  const isSafe = await check(content);
  if (!isSafe) {
    return {
      ok: false,
      error: "İçerik global güvenlik ve etik kurallarını ihlal ediyor!",
    };
  }

  // 3. Çoklu Dil Hazırlığı
  const translations: TranslationMap = await translate(content, [
    "en",
    "de",
    "ja",
    "es",
  ]);

  // 4. Global Dağıtım Yayını
  await projectRef.update({
    distribution: "global",
    distributionUpdatedAt: new Date().toISOString(),
    translations: translations,
    pushedAt: new Date().toISOString(),
    status: "GLOBAL_LIVE",
  });

  console.log(`🚀 ${content.title} artık tüm dünyada yayında!`);

  // 5. İçerik sahibinin onaylı sayısını artır ve otomatik terfi kontrolü
  const authorId = (data?.authorId || data?.owner_uid) as string | undefined;
  if (authorId) {
    try {
      const userRef = adminDb.collection("users").doc(authorId);
      await userRef.update({
        approvedContentCount: FieldValue.increment(1),
      });
      await checkForPromotion(authorId);
    } catch (e) {
      console.error("Promotion/approvedContentCount:", e);
    }
  }

  return { ok: true };
}
