import { NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase-admin";
import { verifyAdminAuth } from "@/lib/apiAuth";
import { ECOSYSTEM_OWNER_FIELD } from "@/lib/ecosystem";

/**
 * Admin: Ekosistemim — Senin UID'in altındaki kullanıcılar ve içerikler.
 * GET: { users, projects, stats }
 */
export async function GET(request: Request) {
  try {
    const admin = await verifyAdminAuth(request);
    if (!admin) {
      return NextResponse.json({ ok: false, error: "Yetkisiz" }, { status: 401 });
    }

    const adminDb = getAdminFirestore();
    if (!adminDb) {
      return NextResponse.json(
        { ok: false, error: "Firestore yapılandırılmamış" },
        { status: 503 }
      );
    }

    const ownerUid = admin.uid;

    const [usersSnap, projectsSnap] = await Promise.all([
      adminDb.collection("users").where(ECOSYSTEM_OWNER_FIELD, "==", ownerUid).limit(1000).get(),
      adminDb.collection("projects").where(ECOSYSTEM_OWNER_FIELD, "==", ownerUid).limit(1000).get(),
    ]);

    const users = usersSnap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        displayName: data.displayName ?? data.email ?? "—",
        email: data.email,
        role: data.role ?? "explorer",
        createdAt: data.createdAt?.toMillis?.() ?? null,
      };
    });

    const projects = projectsSnap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        title: data.title ?? "İsimsiz",
        authorId: data.authorId ?? data.owner_uid,
        status: data.status,
        distribution: data.distribution,
        createdAt: data.createdAt?.toMillis?.() ?? null,
      };
    });

    return NextResponse.json({
      ok: true,
      users,
      projects,
      stats: {
        totalUsers: users.length,
        totalProjects: projects.length,
        ecosystemOwnerUid: ownerUid,
      },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Sunucu hatası";
    console.error("[admin/ecosystem]", e);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
