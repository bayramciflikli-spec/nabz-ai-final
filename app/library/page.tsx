"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { db, auth } from "@/lib/firebase";
import {
  doc,
  getDoc,
  getDocs,
  collection,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { onAuthStateChanged, type User } from "firebase/auth";
import { Sidebar } from "@/components/Sidebar";
import { VideoCard } from "@/components/VideoCard";
import { useLocale } from "@/components/LocaleProvider";
import {
  getWatchHistory,
  getWatchHistoryFull,
  type WatchHistoryEntry,
} from "@/lib/engagement";
import { fetchRecommendedForUser } from "@/lib/contentDiscovery";
import { Users, History, Sparkles, Bookmark, Loader2 } from "lucide-react";

type ChannelInfo = {
  uid: string;
  displayName?: string;
  photoURL?: string;
};

export default function LibraryPage() {
  const { t } = useLocale();
  const [user, setUser] = useState<User | null>(null);
  const [saved, setSaved] = useState<any[]>([]);
  const [subscribers, setSubscribers] = useState<ChannelInfo[]>([]);
  const [following, setFollowing] = useState<ChannelInfo[]>([]);
  const [subscribedContent, setSubscribedContent] = useState<any[]>([]);
  const [watchHistory, setWatchHistory] = useState<WatchHistoryEntry[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, setUser);
    return () => unsub();
  }, []);

  useEffect(() => {
    const load = async () => {
      if (!user?.uid) {
        setSaved([]);
        setSubscribers([]);
        setFollowing([]);
        setSubscribedContent([]);
        setWatchHistory([]);
        setRecommendations([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      const uid = user.uid;

      try {
        const userRef = doc(db, "users", uid);
        const userSnap = await getDoc(userRef);
        const userData = userSnap.data();
        const followingIds = (userData?.following as string[]) || [];
        const subscriberIds = (userData?.subscribers as string[]) || [];
        const savedIds = (userData?.savedProjects as string[]) || [];

        // Abone olanlar (sizi takip eden kanallar)
        const subs: ChannelInfo[] = [];
        for (const id of subscriberIds.slice(0, 20)) {
          const uSnap = await getDoc(doc(db, "users", id));
          const d = uSnap.data();
          if (d) subs.push({ uid: id, displayName: d.displayName, photoURL: d.photoURL });
        }
        setSubscribers(subs);

        // Abone olduklarınız (takip ettiğiniz kanallar)
        const fol: ChannelInfo[] = [];
        for (const id of followingIds) {
          const uSnap = await getDoc(doc(db, "users", id));
          const d = uSnap.data();
          if (d) fol.push({ uid: id, displayName: d.displayName, photoURL: d.photoURL });
        }
        setFollowing(fol);

        // Abone olduğunuz kanalların yayınladığı içerikler
        const allVideos: any[] = [];
        const chunkSize = 10;
        for (let i = 0; i < followingIds.length; i += chunkSize) {
          const idsToFetch = followingIds.slice(i, i + chunkSize);
          const vq = query(
            collection(db, "projects"),
            where("authorId", "in", idsToFetch),
            orderBy("createdAt", "desc")
          );
          const vSnap = await getDocs(vq);
          allVideos.push(...vSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
        }
        allVideos.sort((a, b) => {
          const aTime = a.createdAt?.toMillis?.() ?? a.createdAt ?? 0;
          const bTime = b.createdAt?.toMillis?.() ?? b.createdAt ?? 0;
          return bTime - aTime;
        });
        setSubscribedContent(allVideos);

        // Kaydettikleriniz
        const loaded: any[] = [];
        for (const id of savedIds) {
          const pRef = doc(db, "projects", id);
          const pSnap = await getDoc(pRef);
          if (pSnap.exists()) {
            loaded.push({ id: pSnap.id, ...pSnap.data() });
          }
        }
        setSaved(loaded);

        // İzleme geçmişi (tam liste)
        const history = await getWatchHistoryFull(uid);
        setWatchHistory(history);

        // Öneriler (izlediğiniz / ürettiğiniz içeriklere göre)
        const historyIds = await getWatchHistory(uid);
        const recs = await fetchRecommendedForUser(historyIds, 24);
        setRecommendations(recs);
      } catch (e) {
        console.error("Library load error:", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.uid]);

  if (!user) {
    return (
      <div className="flex min-h-screen bg-black text-white">
        <div className="hidden lg:block">
          <Sidebar user={null} />
        </div>
        <main className="flex-1 lg:ml-56 flex flex-col items-center justify-center p-8">
          <p className="text-gray-500 mb-4">Kütüphanenizi görmek için giriş yapın.</p>
          <Link href="/" className="text-cyan-400 hover:underline">
            Ana Sayfa
          </Link>
        </main>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-screen bg-[#0F0F0F] text-white">
        <div className="hidden lg:block">
          <Sidebar user={user} />
        </div>
        <main className="flex-1 lg:ml-56 flex items-center justify-center p-8">
          <Loader2 className="w-10 h-10 animate-spin text-cyan-400" />
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#0F0F0F] text-white">
      <div className="hidden lg:block">
        <Sidebar user={user} />
      </div>
      <main className="flex-1 lg:ml-56 p-4 sm:p-6 md:p-8 pb-24 lg:pb-8">
        <h1 className="text-2xl sm:text-3xl font-black mb-6">
          {t("library.title")}
        </h1>

        {/* Abone olanlar */}
        <section className="mb-10">
          <h2 className="flex items-center gap-2 text-lg font-bold mb-4">
            <Users className="w-5 h-5 text-cyan-400" />
            {t("library.subscribers")}
          </h2>
          {subscribers.length === 0 ? (
            <p className="text-gray-500 text-sm">{t("library.noSubscribers")}</p>
          ) : (
            <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
              {subscribers.map((ch) => (
                <Link
                  key={ch.uid}
                  href={`/channel/${ch.uid}`}
                  className="flex-shrink-0 flex flex-col items-center gap-2 w-20 group"
                >
                  <div className="w-14 h-14 rounded-full bg-white/10 overflow-hidden border-2 border-transparent group-hover:border-cyan-400 transition-colors">
                    {ch.photoURL ? (
                      <img
                        src={ch.photoURL}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xl font-bold text-cyan-400">
                        {(ch.displayName || "?")[0]}
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-gray-400 group-hover:text-white truncate max-w-[80px] text-center">
                    {ch.displayName || "Kanal"}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Abone olduklarınız + içerikleri */}
        <section className="mb-10">
          <h2 className="flex items-center gap-2 text-lg font-bold mb-4">
            <Users className="w-5 h-5 text-cyan-400" />
            {t("library.subscriptions")}
          </h2>
          {following.length === 0 ? (
            <p className="text-gray-500 text-sm mb-4">
              {t("library.noSubscriptions")}{" "}
              <Link href="/" className="text-cyan-400 hover:underline">
                {t("library.discoverChannels")} →
              </Link>
            </p>
          ) : (
            <>
              <p className="text-gray-400 text-sm mb-3">{t("library.subscriptionsContent")}</p>
              <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar mb-6">
                {following.map((ch) => (
                  <Link
                    key={ch.uid}
                    href={`/channel/${ch.uid}`}
                    className="flex-shrink-0 flex flex-col items-center gap-2 w-20 group"
                  >
                    <div className="w-14 h-14 rounded-full bg-white/10 overflow-hidden border-2 border-transparent group-hover:border-cyan-400 transition-colors">
                      {ch.photoURL ? (
                        <img
                          src={ch.photoURL}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xl font-bold text-cyan-400">
                          {(ch.displayName || "?")[0]}
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-gray-400 group-hover:text-white truncate max-w-[80px] text-center">
                      {ch.displayName || "Kanal"}
                    </span>
                  </Link>
                ))}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {subscribedContent.slice(0, 12).map((v) => (
                  <VideoCard
                    key={v.id}
                    video={{
                      id: v.id,
                      title: v.title || "İsimsiz",
                      imageUrl: v.imageUrl,
                      videoUrl: v.videoUrl,
                      authorImage: v.authorImage,
                      authorName: v.authorName || v.tool,
                      views: String(v.likedBy?.length ?? 0),
                      tags: [v.tool].filter(Boolean),
                    }}
                  />
                ))}
              </div>
              {subscribedContent.length > 12 && (
                <Link
                  href="/subscriptions"
                  className="inline-block mt-4 text-cyan-400 hover:underline text-sm"
                >
                  Tümünü gör →
                </Link>
              )}
            </>
          )}
        </section>

        {/* İzleme geçmişi */}
        <section className="mb-10">
          <h2 className="flex items-center gap-2 text-lg font-bold mb-4">
            <History className="w-5 h-5 text-cyan-400" />
            {t("library.watchHistory")}
          </h2>
          {watchHistory.length === 0 ? (
            <p className="text-gray-500 text-sm">{t("library.noWatchHistory")}</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {watchHistory.slice(0, 16).map((h) => (
                <VideoCard
                  key={h.projectId}
                  video={{
                    id: h.projectId,
                    title: h.title || "İçerik",
                    imageUrl: h.imageUrl,
                    authorName: h.authorName || "—",
                    views: "—",
                    tags: [],
                  }}
                />
              ))}
            </div>
          )}
        </section>

        {/* Öneriler (izlediğiniz / ürettiğiniz içeriklere göre) */}
        <section className="mb-10">
          <h2 className="flex items-center gap-2 text-lg font-bold mb-4">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            {t("library.recommendations")}
          </h2>
          {recommendations.length === 0 ? (
            <p className="text-gray-500 text-sm">
              İzleme geçmişinize göre henüz öneri yok. İçerik izledikçe burada öneriler görünecek.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {recommendations.map((p) => (
                <VideoCard
                  key={p.id}
                  video={{
                    id: p.id,
                    title: p.title || "İsimsiz",
                    imageUrl: p.imageUrl,
                    videoUrl: p.videoUrl,
                    authorImage: p.authorImage,
                    authorName: p.authorName || p.tool || "—",
                    views: String(p.likedBy?.length ?? 0),
                    tags: [p.tool, p.kategori].filter(Boolean),
                  }}
                />
              ))}
            </div>
          )}
        </section>

        {/* Kaydettikleriniz */}
        <section>
          <h2 className="flex items-center gap-2 text-lg font-bold mb-4">
            <Bookmark className="w-5 h-5 text-cyan-400" />
            {t("library.saved")}
          </h2>
          {saved.length === 0 ? (
            <p className="text-gray-500 text-sm">Henüz kaydettiğiniz içerik yok.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {saved.map((v) => (
                <VideoCard
                  key={v.id}
                  video={{
                    id: v.id,
                    title: v.title || "İsimsiz",
                    imageUrl: v.imageUrl,
                    videoUrl: v.videoUrl,
                    authorImage: v.authorImage,
                    authorName: v.authorName || v.tool,
                    views: String(v.likedBy?.length ?? 0),
                    tags: [v.tool].filter(Boolean),
                  }}
                />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
