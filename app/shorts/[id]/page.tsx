"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { db, auth } from "@/lib/firebase";
import { doc, getDoc, collection, query, where, getCountFromServer } from "firebase/firestore";
import { ThumbsUp, ThumbsDown, MessageCircle, Flag, Heart, ChevronUp, ChevronDown, ArrowLeft } from "lucide-react";
import { ContentShareActions } from "@/components/ContentShareActions";
import { LoadingPulse } from "@/components/LoadingPulse";
import { toggleLike, toggleDislike, hasLiked, hasDisliked, addToHistory } from "@/lib/engagement";
import { ReportModal } from "@/components/ReportModal";
import { useLocale } from "@/components/LocaleProvider";
import { useToast } from "@/components/ToastContext";
import { useAuth } from "@/components/AuthProvider";
import { fetchSimilarContent, getShortsFeedFromStorage } from "@/lib/contentDiscovery";

const SWIPE_THRESHOLD = 80;

export default function ShortsPage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useLocale();
  const toast = useToast();
  const { setShowLoginModal } = useAuth();
  const id = params?.id as string;
  const [short, setShort] = useState<any>(null);
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showInfoSheet, setShowInfoSheet] = useState(false);
  const [commentCount, setCommentCount] = useState(0);
  const [nextId, setNextId] = useState<string | null>(null);
  const [heartAnim, setHeartAnim] = useState(false);
  const touchStartY = useRef(0);

  useEffect(() => {
    const fetchShort = async () => {
      const docRef = doc(db, "projects", id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setShort({ id: docSnap.id, ...data });
        addToHistory(id, { title: data.title, imageUrl: data.imageUrl, authorName: data.authorName });
        hasLiked(id).then(setLiked);
        hasDisliked(id).then(setDisliked);
      }
    };
    if (id) fetchShort();
  }, [id]);

  useEffect(() => {
    const fetchCommentCount = async () => {
      if (!id) return;
      try {
        const q = query(collection(db, "comments"), where("projectId", "==", id));
        const snap = await getCountFromServer(q);
        setCommentCount(snap.data().count);
      } catch {
        setCommentCount(0);
      }
    };
    fetchCommentCount();
  }, [id]);

  const [prevId, setPrevId] = useState<string | null>(null);

  useEffect(() => {
    const feed = getShortsFeedFromStorage();
    if (feed.length > 0) {
      const idx = feed.indexOf(id);
      if (idx >= 0) {
        if (idx > 0) setPrevId(feed[idx - 1]);
        if (idx < feed.length - 1) setNextId(feed[idx + 1]);
        return;
      }
    }
    const load = async () => {
      if (!id || !short) return;
      const list = await fetchSimilarContent(id, short.kategori, short.tool, 10);
      if (list.length > 0) setNextId(list[0].id);
    };
    load();
  }, [id, short]);

  const uid = auth.currentUser?.uid;

  const handleSwipeUp = useCallback(() => {
    if (nextId) router.push(`/shorts/${nextId}`);
  }, [nextId, router]);

  const handleSwipeDown = useCallback(() => {
    if (prevId) router.push(`/shorts/${prevId}`);
    else router.back();
  }, [prevId, router]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    if (dy < -SWIPE_THRESHOLD) handleSwipeUp();
    else if (dy > SWIPE_THRESHOLD) handleSwipeDown();
  };

  const lastTap = useRef(0);
  const handleDoubleTap = () => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      lastTap.current = 0;
      if (!liked) {
        handleLike();
        setHeartAnim(true);
        setTimeout(() => setHeartAnim(false), 600);
      }
    } else {
      lastTap.current = now;
    }
  };

  const handleLike = async () => {
    if (!auth.currentUser) {
      setShowLoginModal(true);
      return;
    }
    try {
      await toggleLike(id);
      setLiked(!liked);
      setDisliked(false);
      setShort((s: any) => {
        const prev = s.likedBy || [];
        const next = liked ? prev.filter((u: string) => u !== uid) : [...prev, uid];
        const dPrev = s.dislikedBy || [];
        const dNext = liked ? dPrev : dPrev.filter((u: string) => u !== uid);
        return { ...s, likedBy: next, dislikedBy: dNext };
      });
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : t("error.generic"));
    }
  };

  const handleDislike = async () => {
    if (!auth.currentUser) {
      setShowLoginModal(true);
      return;
    }
    try {
      await toggleDislike(id);
      setDisliked(!disliked);
      setLiked(false);
      setShort((s: any) => {
        const dPrev = s.dislikedBy || [];
        const dNext = disliked ? dPrev.filter((u: string) => u !== uid) : [...dPrev, uid];
        const prev = s.likedBy || [];
        const next = liked ? prev.filter((u: string) => u !== uid) : prev;
        return { ...s, dislikedBy: dNext, likedBy: next };
      });
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : t("error.generic"));
    }
  };

  if (!short)
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <LoadingPulse className="text-white" />
      </div>
    );

  const videoUrl = short.videoUrl;
  const authorImage = short.authorImage || "/default-avatar.png";
  const authorName = short.authorName || short.tool || "AI";
  const viewCount = ((short.likedBy?.length ?? 0) * 100 + (short.views ?? 0)).toLocaleString("tr-TR");
  const likesCount = short.likedBy?.length ?? short.likes ?? 0;

  return (
    <div
      className="fixed inset-0 z-[100] bg-black flex flex-col overflow-hidden touch-pan-y"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Geri butonu */}
      <button
        type="button"
        onClick={() => router.back()}
        className="absolute top-4 left-4 z-20 p-2 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-sm text-white transition-colors"
        aria-label="Geri"
      >
        <ArrowLeft size={24} />
      </button>

      {/* VİDEO – tam ekran, içeriği bozmaz */}
      <div
        className="absolute inset-0 z-0 flex items-center justify-center"
        onClick={handleDoubleTap}
        onWheel={(e) => {
          if (e.deltaY < -50 && nextId) {
            e.preventDefault();
            handleSwipeUp();
          } else if (e.deltaY > 50) {
            e.preventDefault();
            handleSwipeDown();
          }
        }}
        style={{ touchAction: "pan-y" }}
      >
        {videoUrl ? (
          <video
            src={videoUrl}
            className="w-full h-full object-cover"
            autoPlay
            loop
            muted
            playsInline
          />
        ) : (
          <img
            src={
              short.imageUrl ||
              short.thumbnail ||
              "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400"
            }
            alt={short.title}
            className="w-full h-full object-cover"
          />
        )}
        {heartAnim && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <Heart size={80} fill="currentColor" className="text-red-500 animate-heart-pop" />
          </div>
        )}
      </div>

      {/* ALT ŞEFFAF ÇUBUK – izlenme, beğeni, yorum; tıklanınca panel açılır */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setShowInfoSheet(true)}
        onKeyDown={(e) => e.key === "Enter" && setShowInfoSheet(true)}
        className="absolute bottom-0 left-0 right-0 z-10 pt-12 pb-6 px-4 bg-gradient-to-t from-black/75 via-black/40 to-transparent flex items-end justify-between"
      >
        <div className="flex items-center gap-4 text-white/90 text-sm">
          <span>{viewCount} görüntüleme</span>
          <span className="flex items-center gap-1">
            <ThumbsUp size={16} className={liked ? "text-red-400" : ""} />
            {likesCount}
          </span>
          <span className="flex items-center gap-1">
            <MessageCircle size={16} />
            {commentCount}
          </span>
        </div>
        <span className="text-white/70 flex items-center gap-1 text-sm">
          <ChevronUp size={20} />
          Bilgi
        </span>
      </div>

      {/* BİLGİ PANELİ – yukarı kalkan, kanal / yorum / izlenme net */}
      {showInfoSheet && (
        <>
          <div
            className="absolute inset-0 z-30 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowInfoSheet(false)}
            aria-hidden
          />
          <div
            className="absolute bottom-0 left-0 right-0 z-40 max-h-[85vh] overflow-y-auto rounded-t-2xl bg-black/95 border-t border-white/10 shadow-2xl animate-in slide-in-from-bottom duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 flex items-center justify-between px-4 py-3 bg-black/95 border-b border-white/10">
              <h3 className="text-base font-bold text-white">Bilgi ve işlemler</h3>
              <button
                type="button"
                onClick={() => setShowInfoSheet(false)}
                className="p-2 rounded-full hover:bg-white/10 text-white/80"
                aria-label="Kapat"
              >
                <ChevronDown size={24} />
              </button>
            </div>
            <div className="p-4 space-y-4">
              {/* Kanal */}
              <div className="flex items-center gap-3">
                <Link href={short.authorId ? `/channel/${short.authorId}` : "#"} className="shrink-0">
                  <img
                    src={authorImage}
                    alt={authorName}
                    className="w-12 h-12 rounded-full border border-white/20 object-cover"
                  />
                </Link>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-white truncate">@{authorName.replace(/\s/g, "").toLowerCase()}</p>
                  <Link
                    href={short.authorId ? `/channel/${short.authorId}` : "#"}
                    className="text-sm text-red-400 hover:underline"
                  >
                    {t("project.subscribe")}
                  </Link>
                </div>
              </div>
              <p className="text-white/90 text-sm line-clamp-2">{short.title}</p>
              <p className="text-white/60 text-sm">{viewCount} görüntüleme</p>

              {/* Beğeni, beğenme, yorum – net ve tıklanabilir */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <button
                  type="button"
                  onClick={handleLike}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition ${liked ? "bg-red-500/20 text-red-400" : "bg-white/10 text-white hover:bg-white/15"}`}
                >
                  <ThumbsUp size={18} fill={liked ? "currentColor" : "none"} />
                  {likesCount} {t("project.like")}
                </button>
                <button
                  type="button"
                  onClick={handleDislike}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition ${disliked ? "bg-white/20 text-gray-400" : "bg-white/10 text-white hover:bg-white/15"}`}
                >
                  <ThumbsDown size={18} fill={disliked ? "currentColor" : "none"} />
                  {t("project.dislike")}
                </button>
                <Link
                  href={`/project/${id}`}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-white hover:bg-white/15 text-sm font-medium transition"
                >
                  <MessageCircle size={18} />
                  {commentCount} {t("project.comments")}
                </Link>
                <ContentShareActions
                  url={`${typeof window !== "undefined" ? window.location.origin : ""}/shorts/${id}`}
                  title={short.title || ""}
                  buttonClass="px-4 py-2 rounded-full bg-white/10 text-white hover:bg-white/15 text-sm font-medium transition inline-flex items-center gap-2"
                  iconSize={18}
                />
                <button
                  type="button"
                  onClick={() => { setShowReport(true); setShowInfoSheet(false); }}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-white/80 hover:bg-white/15 text-sm transition"
                >
                  <Flag size={18} />
                  {t("shorts.report")}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {showReport && (
        <ReportModal projectId={id} onClose={() => setShowReport(false)} />
      )}
    </div>
  );
}
