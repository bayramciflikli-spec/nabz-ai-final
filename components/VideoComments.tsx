"use client";

import { useState, useEffect } from "react";
import { db, auth } from "@/lib/firebase";
import { useLocale } from "@/components/LocaleProvider";
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { onAuthStateChanged, type User } from "firebase/auth";
import { MoreVertical, Heart } from "lucide-react";
import { createNotification } from "@/lib/notifications";
import { Timestamp } from "firebase/firestore";

type VideoData = {
  authorId?: string;
  authorName?: string;
  authorImage?: string;
};

export default function VideoComments({
  projectId,
  videoData = {},
}: {
  projectId: string;
  videoData?: VideoData;
}) {
  const { t } = useLocale();
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (!projectId) return;

    const q = query(
      collection(db, "comments"),
      where("projectId", "==", projectId),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setComments(
        snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
      );
    });

    return () => unsubscribe();
  }, [projectId]);

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;

    await addDoc(collection(db, "comments"), {
      projectId,
      text: newComment.trim(),
      userId: user.uid,
      userName: user.displayName || t("user.user"),
      userImage: user.photoURL || "/default-avatar.png",
      createdAt: serverTimestamp(),
    });

    if (videoData.authorId && videoData.authorId !== user.uid) {
      await createNotification({
        userId: videoData.authorId,
        type: "comment",
        title: t("comment.newComment"),
        body: `${user.displayName || t("project.userLiked")} ${t("comment.commentedOn")}.`,
        link: `/project/${projectId}`,
      });
    }

    setNewComment("");
  };

  const formatDate = (ts: any) => {
    if (!ts) return "—";
    const date = ts instanceof Timestamp ? ts.toDate() : ts;
    return date?.toLocaleDateString?.() ?? "—";
  };

  const handleHeart = async (commentId: string, isHearted: boolean) => {
    if (!user) return;
    try {
      const commentRef = doc(db, "comments", commentId);
      await updateDoc(commentRef, {
        isHearted: !isHearted,
        heartedBy: isHearted ? null : user.uid,
      });
    } catch (err) {
      console.error(t("error.generic"), err);
    }
  };

  return (
    <div className="mt-8 max-w-4xl">
      <h3 className="text-xl font-bold mb-6">{comments.length} {t("comment.count")}</h3>

      {user ? (
        <form onSubmit={handleComment} className="flex gap-4 mb-10">
          <img
            src={user.photoURL || "/default-avatar.png"}
            alt={t("comment.profile")}
            className="w-10 h-10 rounded-full object-cover bg-gray-800 flex-shrink-0"
          />
          <div className="flex-1 border-b border-white/20 focus-within:border-white transition-all">
            <input
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={t("comment.addPlaceholder")}
              className="w-full bg-transparent py-2 outline-none text-sm text-white placeholder-gray-500"
            />
            <div className="flex justify-end gap-3 py-2">
              <button
                type="button"
                onClick={() => setNewComment("")}
                className="px-4 py-2 text-sm font-bold hover:bg-white/10 rounded-full transition text-gray-300"
              >
                {t("comment.cancel")}
              </button>
              <button
                type="submit"
                disabled={!newComment.trim()}
                className="px-4 py-2 text-sm font-bold bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-full transition text-white"
              >
                {t("comment.submit")}
              </button>
            </div>
          </div>
        </form>
      ) : (
        <div className="bg-white/5 p-4 rounded-xl mb-10 text-center text-gray-400">
          {t("comment.loginRequired")}
        </div>
      )}

      <div className="flex flex-col gap-6">
        {comments.map((comment) => (
          <div key={comment.id} className="flex gap-4 group">
            <img
              src={comment.userImage || "/default-avatar.png"}
              alt={comment.userName}
              className="w-10 h-10 rounded-full object-cover bg-gray-800 flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-[13px] font-bold text-white">
                  @{(comment.userName || t("comment.user")).replace(/\s/g, "").toLowerCase()}
                </span>
                <span className="text-[12px] text-gray-500">
                  {formatDate(comment.createdAt)}
                </span>
              </div>
              <p className="text-sm text-gray-200 leading-relaxed break-words">
                {comment.text}
              </p>
              <div className="flex items-center gap-4 mt-2">
                <button
                  type="button"
                  className="text-xs text-gray-400 hover:text-white transition font-medium"
                >
                  {t("comment.like")}
                </button>
                <button
                  type="button"
                  className="text-xs text-gray-400 hover:text-white transition font-medium"
                >
                  {t("comment.reply")}
                </button>

                <div className="flex items-center relative group/heart">
                  <button
                    type="button"
                    onClick={() =>
                      handleHeart(comment.id, comment.isHearted || false)
                    }
                    disabled={!user}
                    className={`transition-all duration-300 ${
                      comment.isHearted
                        ? "scale-110 opacity-100"
                        : "opacity-60 group-hover/heart:opacity-100 hover:scale-110"
                    } ${!user ? "cursor-not-allowed opacity-40" : "cursor-pointer"}`}
                  >
                    <Heart
                      size={16}
                      fill={comment.isHearted ? "#FF0000" : "none"}
                      className={
                        comment.isHearted ? "text-red-600" : "text-gray-400"
                      }
                    />
                  </button>

                  {comment.isHearted && videoData.authorImage && (
                    <img
                      src={videoData.authorImage}
                      alt={videoData.authorName || t("comment.channel")}
                      className="w-3 h-3 rounded-full absolute -bottom-1 -right-1 border border-[#0F0F0F] object-cover"
                      title={`${videoData.authorName || t("comment.channel")} ${t("comment.heartedBy")}`}
                    />
                  )}
                </div>
              </div>
            </div>
            <button
              type="button"
              className="opacity-0 group-hover:opacity-100 transition text-gray-400 flex-shrink-0"
            >
              <MoreVertical size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
