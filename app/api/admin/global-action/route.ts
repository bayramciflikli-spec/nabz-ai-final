import { NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase-admin";
import { promoteToGlobal } from "@/lib/promoteToGlobal";
import { verifyAdminAuth } from "@/lib/apiAuth";
import { handlePolicyViolation } from "@/lib/policyViolation";
import { applyStrike } from "@/lib/applyStrike";

/**
 * POST body: { projectId?, projectIds?, action: "approve"|"reject", sanctionUser?, banUser?, applyStrike?, strikeReason? }
 * - sanctionUser: reject sırasında yetkiler askıya (trustScore 0, role explorer)
 * - banUser: ağır ihlal, hesap engellenir
 * - applyStrike: telif ihlali — trustScore -30, strikes +1, BANNED_CONTENT (3 strike = ban)
 * Sadece admin erişebilir.
 */
export async function POST(request: Request) {
  try {
    const admin = await verifyAdminAuth(request);
    if (!admin) {
      return NextResponse.json({ ok: false, error: "Yetkisiz" }, { status: 401 });
    }

    let body: Record<string, unknown> = {};
    try {
      const raw = await request.text();
      if (raw?.trim()) body = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ ok: false, error: "Geçersiz istek" }, { status: 400 });
    }
    const projectId = body?.projectId as string | undefined;
    const projectIds = body?.projectIds as string[] | undefined;
    const action = body?.action as "approve" | "reject" | undefined;
    const sanctionUser = !!body?.sanctionUser;
    const banUser = !!body?.banUser;
    const applyStrikeOpt = !!body?.applyStrike;
    const strikeReason = (body?.strikeReason as string) || "Telif ihlali";

    const ids = projectIds?.length ? projectIds : projectId ? [projectId] : [];
    if (ids.length === 0 || !action || !["approve", "reject"].includes(action)) {
      return NextResponse.json(
        { ok: false, error: "projectId/projectIds ve action (approve|reject) gerekli" },
        { status: 400 }
      );
    }

    const results: { id: string; ok: boolean; error?: string }[] = [];

    for (const pid of ids) {
      if (action === "reject") {
        const adminDb = getAdminFirestore();
        if (!adminDb) {
          results.push({ id: pid, ok: false, error: "Firestore Admin yapılandırılmamış" });
          continue;
        }
        const projectRef = adminDb.collection("projects").doc(pid);
        const snap = await projectRef.get();
        if (!snap.exists) {
          results.push({ id: pid, ok: false, error: "Proje bulunamadı" });
          continue;
        }
        const data = snap.data();
        const authorId = (data?.authorId || data?.owner_uid) as string | undefined;

        if (applyStrikeOpt) {
          const strikeResult = await applyStrike(pid, strikeReason);
          if (!strikeResult.ok) {
            results.push({ id: pid, ok: false, error: strikeResult.error });
            continue;
          }
        } else {
          await projectRef.update({
            distribution: "locked",
            distributionUpdatedAt: new Date().toISOString(),
          });
          if (sanctionUser && authorId) {
            try {
              await handlePolicyViolation(authorId, { ban: banUser });
            } catch (e: unknown) {
              console.error("policyViolation:", e);
            }
          }
        }
        results.push({ id: pid, ok: true });
      } else {
        const result = await promoteToGlobal(pid);
        if (!result.ok) {
          results.push({ id: pid, ok: false, error: result.error ?? "Onay başarısız" });
        } else {
          results.push({ id: pid, ok: true });
        }
      }
    }

    const successCount = results.filter((r) => r.ok).length;
    const failCount = results.filter((r) => !r.ok).length;

    return NextResponse.json({
      ok: failCount === 0,
      action,
      results,
      successCount,
      failCount,
    });
  } catch (e: unknown) {
    console.error("global-action:", e);
    const message = e instanceof Error ? e.message : "Sunucu hatası";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
