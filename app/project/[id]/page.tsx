"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { db, auth } from "@/lib/firebase";
import { doc, getDoc, collection, query, where, getCountFromServer } from "firebase/firestore";
import { useParams } from "next/navigation";
import { ThumbsUp, ThumbsDown, MessageCircle, Clock, Bookmark, Flag, ListPlus } from "lucide-react";
import VideoComments from "@/components/VideoComments";
import { ContentShareActions } from "@/components/ContentShareActions";
import { LoadingPulse } from "@/components/LoadingPulse";
import { fetchSimilarContent } from "@/lib/contentDiscovery";
import type { DiscoverProject } from "@/lib/contentDiscovery";
import { isChannelMonetized } from "@/lib/monetization";
import { AdSlot } from "@/components/AdSlot";
import { toggleLike, toggleDislike, hasLiked, hasDisliked, addToHistory, toggleWatchLater, toggleSaved, hasWatchLater, hasSaved } from "@/lib/engagement";
import { createNotification } from "@/lib/notifications";
import { ReportModal } from "@/components/ReportModal";
import { AddToPlaylistModal } from "@/components/AddToPlaylistModal";
import { VideoPlayer } from "@/components/VideoPlayer";
import { useLocale } from "@/components/LocaleProvider";
import { useToast } from "@/components/ToastContext";
import { hasMallStore } from "@/lib/mallStores";
import { getProgressPercent } from "@/lib/watchProgress";

export default function ProjectDetail() {
  const { id } = useParams();
  const { t } = useLocale();
  const toast = useToast();
  const [project, setProject] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [commentCount, setCommentCount] = useState(0);
  const [similar, setSimilar] = useState<DiscoverProject[]>([]);
  const [isMonetized, setIsMonetized] = useState(false);
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);
  const [watchLater, setWatchLater] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showAddToPlaylist, setShowAddToPlaylist] = useState(false);

  useEffect(() => {
    const fetchProject = async () => {
      const docRef = doc(db, "projects", id as string);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data?.status === "BANNED_CONTENT" || data?.isVisible === false || data?.rtbfDeleted === true) {
          setProject({ _banned: true, _rtbf: !!data?.rtbfDeleted });
          return;
        }
        setProject(data);
        addToHistory(id as string, { title: data.title, imageUrl: data.imageUrl, authorName: data.authorName });
        hasLiked(id as string).then(setLiked);
        hasDisliked(id as string).then(setDisliked);
        hasWatchLater(id as string).then(setWatchLater);
        hasSaved(id as string).then(setSaved);
      }
    };
    if (id) fetchProject();
  }, [id]);

  useEffect(() => {
    const load = async () => {
      if (!id || !project) return;
      const list = await fetchSimilarContent(
        id as string,
        project.kategori,
        project.tool,
        6
      );
      setSimilar(list);
    };
    load();
  }, [id, project]);

  useEffect(() => {
    const check = async () => {
      if (!project?.authorId) return;
      const ok = await isChannelMonetized(project.authorId);
      setIsMonetized(ok);
    };
    check();
  }, [project?.authorId]);

  useEffect(() => {
    const fetchCommentCount = async () => {
      if (!id) return;
      const q = query(collection(db, "comments"), where("projectId", "==", id));
      const snap = await getCountFromServer(q);
      setCommentCount(snap.data().count);
    };
    fetchCommentCount();
  }, [id]);

  const copyToClipboard = () => {
    if (project?.prompt) {
      navigator.clipboard.writeText(project.prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!project) return <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center"><LoadingPulse /></div>;

  if ((project as any)._banned) {
    const isRtbf = (project as any)._rtbf;
    return (
      <div className="min-h-screen bg-[#0F0F0F] flex flex-col items-center justify-center text-white/80 gap-4">
        <div className="text-6xl">{isRtbf ? "🔒" : "©"}</div>
        <h1 className="text-xl font-bold">
          {isRtbf ? "Bu içerik kullanıcı talebi üzerine kaldırıldı" : "Bu içerik telif ihlali nedeniyle kaldırılmıştır"}
        </h1>
        <Link href="/" className="text-cyan-400 hover:underline">Ana sayfaya dön</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030303] text-white">
      <header className="h-14 px-4 flex items-center border-b border-[#222] sticky top-0 bg-[#030303] z-[100]">
        <Link href="/" className="font-black tracking-widest hover:text-blue-400 transition-colors">
          NABZ<span className="text-blue-500">-AI</span>
        </Link>
      </header>

      <div className="flex flex-col lg:flex-row max-w-[1700px] mx-auto p-6 gap-6">
        <div className="flex-1 min-w-0">
          <div className="aspect-video w-full bg-[#111] rounded-xl border border-[#222] overflow-hidden flex items-center justify-center">
            {project.videoUrl ? (
              <VideoPlayer
                projectId={id as string}
                src={project.videoUrl}
                poster={project.imageUrl || project.thumbnail}
              />
            ) : (
              <img
                src={
                  project.imageUrl ||
                  project.thumbnail ||
                  "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200"
                }
                alt={project.title}
                className="w-full h-full object-cover"
              />
            )}
          </div>

          <div className="mt-4">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-bold">{project.title}</h1>
              <span className="bg-blue-600 text-white px-3 py-1 rounded-full font-bold uppercase text-xs">
                {project.tool || project.category || t("project.other")}
              </span>
              {(project.ai_generated_disclosure || project.metadata_label) && (
                <span className="bg-cyan-600/80 text-white px-3 py-1 rounded-full text-xs" title="AI ile üretildi">
                  AI Üretildi
                </span>
              )}
              {project.display_label === "AD_PARTNERSHIP" && (
                <span className="bg-amber-600/80 text-white px-3 py-1 rounded-full text-xs" title="Reklam ortaklığı">
                  Reklam
                </span>
              )}
            </div>
            <div className="flex flex-wrap justify-between items-center gap-4 mt-2 text-sm text-gray-400">
              <span>
                {((project.likedBy?.length ?? 0) * 100 + (project.views ?? 0)).toLocaleString("tr-TR")} görüntüleme
                {project.createdAt?.toDate && (
                  <> • {(project.createdAt as { toDate: () => Date }).toDate().toLocaleDateString("tr-TR")}</>
                )}
              </span>
              {hasMallStore(project.tool) && (
                <Link
                  href="/mall"
                  className="px-4 py-2 rounded-full bg-blue-500 text-white font-semibold hover:bg-blue-600 transition-colors"
                >
                  ARACI MAĞAZADA GÖR
                </Link>
              )}
            </div>
          </div>

        {/* Beğeni, yorum sayıları ve paylaş/kaydet */}
        <div className="flex flex-wrap items-center gap-6 my-6 text-white/80">
          <button
            type="button"
            onClick={async () => {
              try {
                await toggleLike(id as string);
                const uid = auth.currentUser?.uid;
                setLiked(!liked);
                setDisliked(false);
                setProject((p: any) => {
                  const prev = p.likedBy || [];
                  const next = liked ? prev.filter((u: string) => u !== uid) : [...prev, uid];
                  const dPrev = p.dislikedBy || [];
                  const dNext = liked ? dPrev : dPrev.filter((u: string) => u !== uid);
                  return { ...p, likedBy: next, dislikedBy: dNext };
                });
                if (!liked && project?.authorId && uid && project.authorId !== uid) {
                  createNotification({
                    userId: project.authorId,
                    type: "like",
                    title: t("project.videoLiked"),
                    body: `${auth.currentUser?.displayName || t("project.userLiked")} "${project.title}" ${t("project.likedYourVideo")}.`,
                    link: `/project/${id}`,
                  });
                }
              } catch (e: unknown) {
                toast.error(e instanceof Error ? e.message : t("error.generic"));
              }
            }}
            className={`flex items-center gap-2 hover:text-white transition ${liked ? "text-red-400" : ""}`}
          >
            <ThumbsUp size={18} fill={liked ? "currentColor" : "none"} />
            {project.likedBy?.length ?? project.likes ?? 0} {t("project.like")}
          </button>
          <button
            type="button"
            onClick={async () => {
              try {
                await toggleDislike(id as string);
                const uid = auth.currentUser?.uid;
                setDisliked(!disliked);
                setLiked(false);
                setProject((p: any) => {
                  const dPrev = p.dislikedBy || [];
                  const dNext = disliked ? dPrev.filter((u: string) => u !== uid) : [...dPrev, uid];
                  const prev = p.likedBy || [];
                  const next = liked ? prev.filter((u: string) => u !== uid) : prev;
                  return { ...p, dislikedBy: dNext, likedBy: next };
                });
              } catch (e: unknown) {
                toast.error(e instanceof Error ? e.message : t("error.generic"));
              }
            }}
            className={`flex items-center gap-2 hover:text-white transition ${disliked ? "text-gray-400" : ""}`}
          >
            <ThumbsDown size={18} fill={disliked ? "currentColor" : "none"} />
            {t("project.dislike")}
          </button>
          <span className="flex items-center gap-2">
            <MessageCircle size={18} />
            {commentCount} {t("project.comments")}
          </span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={async () => {
                try {
                  const ok = await toggleWatchLater(id as string);
                  setWatchLater(ok);
                } catch (e: unknown) {
                  toast.error(e instanceof Error ? e.message : t("error.generic"));
                }
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition text-sm ${watchLater ? "text-amber-400" : ""}`}
            >
              <Clock size={18} />
              {watchLater ? t("project.removeFromWatchLater") : t("project.watchLater")}
            </button>
            <button
              type="button"
              onClick={async () => {
                try {
                  const ok = await toggleSaved(id as string);
                  setSaved(ok);
                } catch (e: unknown) {
                  toast.error(e instanceof Error ? e.message : t("error.generic"));
                }
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition text-sm ${saved ? "text-amber-400" : ""}`}
            >
              <Bookmark size={18} fill={saved ? "currentColor" : "none"} />
              {saved ? t("project.removeFromLibrary") : t("project.addToLibrary")}
            </button>
            <button
              type="button"
              onClick={() => setShowAddToPlaylist(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition text-sm"
            >
              <ListPlus size={18} />
              {t("project.addToList")}
            </button>
            <ContentShareActions
              url={`${typeof window !== "undefined" ? window.location.origin : ""}/project/${id}`}
              title={project.title || ""}
              buttonClass="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition text-sm"
              iconSize={18}
              showLabels
            />
            <button
              type="button"
              onClick={() => setShowReport(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition text-sm text-gray-400 hover:text-white"
            >
              <Flag size={18} />
              {t("project.report")}
            </button>
          </div>
          {showReport && (
            <ReportModal
              projectId={id as string}
              onClose={() => setShowReport(false)}
            />
          )}
          {showAddToPlaylist && (
            <AddToPlaylistModal
              projectId={id as string}
              onClose={() => setShowAddToPlaylist(false)}
            />
          )}
        </div>

        {/* PROMPT ALANI VE KOPYALA BUTONU */}
        <div className="relative group bg-gray-900 p-8 rounded-3xl shadow-inner overflow-hidden">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xs font-black text-gray-500 uppercase tracking-[0.2em]">{t("project.prompt")}</h2>
            <button
              onClick={copyToClipboard}
              className={`text-xs font-bold px-4 py-2 rounded-lg transition-all ${
                copied ? "bg-green-500 text-white" : "bg-white/10 text-gray-300 hover:bg-white/20"
              }`}
            >
              {copied ? t("project.copied") : t("project.copy")}
            </button>
          </div>

          <p className="text-xl leading-relaxed font-medium text-gray-100 italic">
            &quot;{project.prompt || t("project.noPrompt")}&quot;
          </p>

          {/* Arka plan süsü */}
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
            <span className="text-8xl font-black">AI</span>
          </div>
        </div>

        {isMonetized && project.authorId && (
          <div className="mb-10">
            <AdSlot channelUserId={project.authorId} isMonetized={true} format="rectangle" className="min-h-[250px]" />
          </div>
        )}

        <VideoComments
          projectId={id as string}
          videoData={{
            authorId: project.authorId,
            authorName: project.authorName,
            authorImage: project.authorImage,
          }}
        />
        </div>

        {/* Öneri paneli - sidebar */}
        {similar.length > 0 && (
          <aside className="w-full lg:w-[400px] shrink-0 flex flex-col gap-3">
            {similar.map((p) => {
              const views = ((p.likedBy?.length ?? 0) * 100).toLocaleString("tr-TR");
              const hasShop = hasMallStore(p.tool);
              const progressPct = getProgressPercent(p.id);
              return (
                <Link
                  key={p.id}
                  href={`/project/${p.id}`}
                  className="flex gap-2 hover:translate-x-1 transition-transform"
                >
                  <div className="w-[168px] h-[94px] bg-[#1a1a1a] rounded-lg shrink-0 overflow-hidden relative">
                    <img
                      src={p.imageUrl || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=336"}
                      alt={p.title}
                      className="w-full h-full object-cover"
                    />
                    {progressPct != null && (
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                        <div
                          className="h-full bg-red-500"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold line-clamp-2 leading-snug">{p.title}</p>
                    <p className="text-xs text-gray-400 mt-1">{p.authorName || "NABZ-AI"}</p>
                    <p className="text-xs text-gray-400">{views} görüntüleme</p>
                    {hasShop && (
                      <span className="inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-400 border border-blue-500/50">
                        BAĞLI MAĞAZA
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </aside>
        )}
      </div>
    </div>
  );
}
