"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { db, auth } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { ThumbsUp, ThumbsDown, MessageCircle, Flag, Heart } from "lucide-react";
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

  return (
    <div
      className="h-[calc(100vh-80px)] w-full flex justify-center bg-black overflow-hidden snap-y snap-mandatory touch-pan-y"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* SHORTS KONTEYNER */}
      <div className="relative h-full aspect-[9/16] bg-zinc-900 rounded-2xl overflow-hidden snap-start max-h-[calc(100vh-80px)]">
        {/* VİDEO / GÖRSEL - double-tap like */}
        <div
          className="absolute inset-0 z-0"
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
          {/* Double-tap heart animasyonu */}
          {heartAnim && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <Heart
                size={80}
                fill="currentColor"
                className="text-red-500 animate-heart-pop"
              />
            </div>
          )}
        </div>

        {/* SAĞ TARAF ETKİLEŞİM PANELİ */}
        <div className="absolute right-3 bottom-10 flex flex-col gap-6 items-center z-10">
          <div className="flex flex-col items-center">
            <button
              type="button"
              onClick={handleLike}
              className={`bg-white/10 p-3 rounded-full hover:bg-white/20 transition backdrop-blur-md ${liked ? "text-red-400" : ""}`}
            >
              <ThumbsUp size={24} fill={liked ? "currentColor" : "white"} />
            </button>
            <span className="text-xs font-bold mt-1">
              {short.likedBy?.length ?? short.likes ?? 0}
            </span>
          </div>

          <div className="flex flex-col items-center">
            <button
              type="button"
              onClick={handleDislike}
              className={`bg-white/10 p-3 rounded-full hover:bg-white/20 transition backdrop-blur-md ${disliked ? "text-gray-400" : ""}`}
            >
              <ThumbsDown size={24} fill={disliked ? "currentColor" : "white"} />
            </button>
            <span className="text-xs font-bold mt-1">{t("project.dislike")}</span>
          </div>

          <Link
            href={`/project/${id}`}
            className="flex flex-col items-center group"
          >
            <button
              type="button"
              className="bg-white/10 p-3 rounded-full hover:bg-white/20 transition backdrop-blur-md"
            >
              <MessageCircle size={24} fill="white" />
            </button>
            <span className="text-xs font-bold mt-1">
              {short.commentCount ?? short.comments?.length ?? 0} {t("shorts.comments")}
            </span>
          </Link>

          <ContentShareActions
            url={`${typeof window !== "undefined" ? window.location.origin : ""}/shorts/${id}`}
            title={short.title || ""}
            buttonClass="bg-white/10 p-3 rounded-full hover:bg-white/20 transition backdrop-blur-md flex flex-col items-center"
            iconSize={24}
          />

          <div className="flex flex-col items-center">
            <button
              type="button"
              onClick={() => setShowReport(true)}
              className="bg-white/10 p-3 rounded-full hover:bg-white/20 transition backdrop-blur-md"
            >
              <Flag size={24} className="text-gray-400" />
            </button>
            <span className="text-xs font-bold mt-1">{t("shorts.report")}</span>
          </div>
        </div>
        {showReport && (
          <ReportModal
            projectId={id}
            onClose={() => setShowReport(false)}
          />
        )}

        {/* ALT TARAF KANAL BİLGİSİ */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 to-transparent z-10">
          <div className="flex items-center gap-3 mb-3">
            <Link href={short.authorId ? `/channel/${short.authorId}` : "#"}>
              <img
                src={authorImage}
                alt={authorName}
                className="w-9 h-9 rounded-full border border-white/20 object-cover"
              />
            </Link>
            <span className="font-bold text-sm">
              @{authorName.replace(/\s/g, "").toLowerCase()}
            </span>
            <Link
              href={short.authorId ? `/channel/${short.authorId}` : "#"}
              className="bg-white text-black px-4 py-1.5 rounded-full text-xs font-bold hover:bg-gray-200 transition"
            >
              {t("project.subscribe")}
            </Link>
          </div>
          <p className="text-sm line-clamp-1">{short.title}</p>
        </div>
      </div>
    </div>
  );
}
