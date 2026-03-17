"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { db, auth } from "@/lib/firebase";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  onSnapshot,
  updateDoc,
  setDoc,
  arrayUnion,
  arrayRemove,
  increment,
} from "firebase/firestore";
import { isChannelMonetized } from "@/lib/monetization";
import { Timestamp } from "firebase/firestore";
import { CheckCircle, Info, Camera, Sparkles, DollarSign, ImagePlus } from "lucide-react";
import { VideoCard } from "@/components/VideoCard";
import { LoadingPulse } from "@/components/LoadingPulse";
import { createNotification } from "@/lib/notifications";
import { AdSlot } from "@/components/AdSlot";
import { useToast } from "@/components/ToastContext";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { uploadBannerImage, uploadProfilePhoto, updateUserProfile } from "@/lib/firebase-auth";

export default function ChannelPage() {
  const params = useParams();
  const id = params?.id as string;
  const toast = useToast();
  const [channel, setChannel] = useState<any>(null);
  const [videos, setVideos] = useState<any[]>([]);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [newBannerUrl, setNewBannerUrl] = useState("");
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isMonetized, setIsMonetized] = useState(false);
  const [bannerUploading, setBannerUploading] = useState(false);
  const [profilePhotoUploading, setProfilePhotoUploading] = useState(false);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const profileInputRef = useRef<HTMLInputElement>(null);
  type TabId = "videos" | "shorts" | "playlists" | "about";
  const [activeTab, setActiveTab] = useState<TabId>("videos");

  const isOwner = auth.currentUser?.uid === id;
  const channelShorts = videos.filter((v: any) => v.isShort || v.format === "short" || (v.imageUrl && (v.height ?? 0) > (v.width ?? 1)));

  useEffect(() => {
    if (!id) return;

    const q = query(collection(db, "projects"), where("authorId", "==", id));
    const unsubVideos = onSnapshot(q, async (snapshot) => {
      const videoList = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setVideos(videoList);

      const docRef = doc(db, "users", id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setChannel(data);
        setIsSubscribed(data.subscribers?.includes(auth.currentUser?.uid));
        isChannelMonetized(id).then(setIsMonetized);
      } else if (videoList.length > 0) {
        const first = videoList[0] as any;
        setChannel({
          displayName: first.authorName || first.tool || "İsimsiz Kanal",
          photoURL: first.authorImage || "/default-avatar.png",
          subscribers: [],
        });
        isChannelMonetized(id).then(setIsMonetized);
      } else {
        setChannel({
          displayName: "Kanal Bulunamadı",
          photoURL: "/default-avatar.png",
          subscribers: [],
        });
      }
    });

    return () => unsubVideos();
  }, [id]);

  const toggleSubscribe = async () => {
    if (!auth.currentUser) { toast.error("Lütfen önce giriş yapın!"); return; }
    if (id === auth.currentUser.uid) return;
    const channelRef = doc(db, "users", id);

    try {
      const userRef = doc(db, "users", auth.currentUser.uid);
      if (isSubscribed) {
        await Promise.all([
          updateDoc(channelRef, {
            subscribers: arrayRemove(auth.currentUser.uid),
            subscribersCount: increment(-1),
          }),
          updateDoc(userRef, {
            following: arrayRemove(id),
          }),
        ]);
      } else {
        try {
          await Promise.all([
            updateDoc(channelRef, {
              subscribers: arrayUnion(auth.currentUser.uid),
              subscribersCount: increment(1),
            }),
            setDoc(userRef, { following: arrayUnion(id) }, { merge: true }),
          ]);
        } catch {
          await setDoc(
            channelRef,
            {
              subscribers: arrayUnion(auth.currentUser.uid),
              subscribersCount: 1,
            },
            { merge: true }
          );
          await setDoc(userRef, { following: arrayUnion(id) }, { merge: true });
        }
      }
      setIsSubscribed(!isSubscribed);
      if (!isSubscribed && auth.currentUser) {
        createNotification({
          userId: id,
          type: "subscribe",
          title: "Yeni abone",
          body: `${auth.currentUser.displayName || "Bir kullanıcı"} kanalınıza abone oldu.`,
          link: `/channel/${id}`,
        });
      }
    } catch (error) {
      console.error("Abone hatası:", error);
    }
  };

  const generateAiBanner = async () => {
    if (!prompt.trim()) { toast.error("Lütfen bir hayalini yaz!"); return; }
    setIsGenerating(true);

    try {
      const response = await fetchWithAuth("/api/generate-banner", {
        method: "POST",
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json();
      if (response.status === 401) {
        toast.error("Banner oluşturmak için giriş yapmanız gerekiyor.");
        return;
      }
      if (response.status === 429) {
        toast.error("Çok fazla istek. Lütfen biraz bekleyin.");
        return;
      }
      if (data.imageUrl) setNewBannerUrl(data.imageUrl);
    } catch (error) {
      console.error("AI üretim hatası:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleBannerUpdate = async () => {
    if (!newBannerUrl) return;
    const userRef = doc(db, "users", id);

    try {
      await updateDoc(userRef, {
        bannerUrl: newBannerUrl,
      });
      setChannel({ ...channel, bannerUrl: newBannerUrl });
      setIsEditing(false);
      setNewBannerUrl("");
      toast.success("Banner başarıyla güncellendi!");
    } catch (error) {
      console.error("Güncelleme hatası:", error);
    }
  };

  const onBannerFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) {
      toast.error("Lütfen bir görsel seçin (JPEG, PNG, WebP).");
      e.target.value = "";
      return;
    }
    setBannerUploading(true);
    try {
      const url = await uploadBannerImage(id, file);
      setNewBannerUrl(url);
      toast.success("Görsel yüklendi. Kanalıma Uygula ile kaydedin.");
    } catch {
      toast.error("Yükleme başarısız.");
    } finally {
      setBannerUploading(false);
      e.target.value = "";
    }
  };

  const onProfilePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) {
      toast.error("Lütfen bir görsel seçin (JPEG, PNG, WebP). Önerilen: 800×800 px.");
      e.target.value = "";
      return;
    }
    setProfilePhotoUploading(true);
    try {
      const url = await uploadProfilePhoto(id, file);
      await updateUserProfile(id, { photoURL: url });
      setChannel({ ...channel, photoURL: url });
      toast.success("Profil fotoğrafı güncellendi!");
    } catch {
      toast.error("Yükleme başarısız.");
    } finally {
      setProfilePhotoUploading(false);
      e.target.value = "";
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "—";
    const date = timestamp instanceof Timestamp ? timestamp.toDate() : timestamp;
    return date?.toLocaleDateString?.() ?? "—";
  };

  if (!id) return <div className="text-white p-10">Geçersiz kanal.</div>;

  if (!channel) return <div className="min-h-screen bg-black flex items-center justify-center"><LoadingPulse /></div>;

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white">
      {/* 1. KANAL BANNER ALANI – YouTube gibi oran (2560×423 px) */}
      <div className="group w-full bg-gradient-to-r from-[#1a1a1a] to-[#0a0a0a] relative overflow-hidden aspect-[2560/423] min-h-[120px] max-h-[280px]">
        <img
          src={
            channel.bannerUrl ||
            "https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=2000"
          }
          alt="Channel Banner"
          className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
        />

        {isOwner && (
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="bg-white/20 backdrop-blur-md border border-white/30 p-3 rounded-full hover:bg-white/40 transition"
            >
              <Camera size={24} className="text-white" />
            </button>
          </div>
        )}
      </div>

      {isEditing && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-[#1e1e1e] w-full max-w-lg p-8 rounded-[2rem] border border-white/10 shadow-2xl">
            <h2 className="text-2xl font-black mb-2 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              AI Banner Stüdyosu
            </h2>
            <p className="text-sm text-gray-400 mb-2">
              Kanalının ruhunu anlatan bir cümle yaz, AI senin için tasarlasın.
            </p>
            <p className="text-xs text-gray-500 mb-6">
              Önerilen boyut: <strong className="text-gray-400">2560 × 423 px</strong> (YouTube kanal arkası). Görsel bu orana göre kırpılır.
            </p>

            {/* SEÇİM: AI veya kendi görselini yükle */}
            <input
              type="file"
              ref={bannerInputRef}
              accept="image/*"
              className="hidden"
              onChange={onBannerFileChange}
            />
            <div className="flex gap-2 mb-4">
              <button
                type="button"
                onClick={() => bannerInputRef.current?.click()}
                disabled={bannerUploading}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-sm font-medium disabled:opacity-50"
              >
                {bannerUploading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <ImagePlus size={18} />
                    Görsel yükle
                  </>
                )}
              </button>
            </div>

            {/* AI PROMPT ALANI */}
            <div className="relative mb-6">
              <textarea
                placeholder="Örn: Siberpunk bir şehirde mor neon ışıklar altında süzülen bir robot..."
                className="w-full bg-[#121212] border border-white/5 rounded-2xl px-4 py-4 min-h-[100px] outline-none focus:border-purple-500/50 transition resize-none text-sm text-white placeholder-gray-500"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
              <button
                type="button"
                onClick={generateAiBanner}
                disabled={isGenerating}
                className="absolute bottom-3 right-3 bg-gradient-to-tr from-blue-600 to-purple-600 p-2 rounded-xl hover:scale-105 active:scale-95 transition disabled:opacity-50"
              >
                {isGenerating ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Sparkles size={20} className="text-white" />
                )}
              </button>
            </div>

            {/* ÖNİZLEME VEYA URL ALANI */}
            {newBannerUrl && (
              <div className="mb-6 rounded-xl overflow-hidden border-2 border-purple-500/30 transition-all duration-500">
                <img
                  src={newBannerUrl}
                  className="w-full h-24 object-cover"
                  alt="AI Preview"
                />
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleBannerUpdate}
                disabled={!newBannerUrl}
                className="flex-[2] bg-white text-black font-black py-3 rounded-2xl hover:bg-gray-200 transition disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Kanalıma Uygula
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setNewBannerUrl("");
                  setPrompt("");
                }}
                className="flex-1 bg-white/5 text-gray-400 font-bold py-3 rounded-2xl hover:bg-white/10 transition"
              >
                İptal
              </button>
            </div>
            <p className="mt-4 pt-4 border-t border-white/10 text-xs text-gray-500">
              YouTube uyumlu pixel: Banner <strong className="text-gray-400">2560×423</strong>, profil fotoğrafı <strong className="text-gray-400">800×800</strong>. Bilgisayar ve mobilde aynı görünür.
            </p>
          </div>
        </div>
      )}

      {/* 2. KANAL BİLGİ ALANI – Profil fotoğrafı Firestore’dan (cihazlar arası aynı) */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 flex flex-col md:flex-row items-center md:items-start gap-6 -mt-12 relative z-10 pb-10 border-b border-white/10">
        <input
          type="file"
          ref={profileInputRef}
          accept="image/*"
          className="hidden"
          onChange={onProfilePhotoChange}
        />
        {isOwner ? (
          <button
            type="button"
            className="relative shrink-0 rounded-full border-4 border-[#0F0F0F] bg-gray-800 overflow-hidden cursor-pointer hover:ring-2 hover:ring-cyan-500/50 transition-shadow"
            onClick={() => profileInputRef.current?.click()}
            disabled={profilePhotoUploading}
          >
            <img
              src={channel.photoURL || "/default-avatar.png"}
              alt={channel.displayName || "Kanal"}
              className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 object-cover"
            />
            <span className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity rounded-full">
              {profilePhotoUploading ? (
                <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Camera className="w-8 h-8 text-white" />
              )}
            </span>
          </button>
        ) : (
          <img
            src={channel.photoURL || "/default-avatar.png"}
            alt={channel.displayName || "Kanal"}
            className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full border-4 border-[#0F0F0F] object-cover bg-gray-800 shrink-0"
          />
        )}
        <div className="flex-1 text-center md:text-left pt-14 md:pt-16">
          <div className="flex items-center justify-center md:justify-start gap-2">
            <h1 className="text-3xl md:text-4xl font-black">
              {channel.displayName || "İsimsiz Kanal"}
            </h1>
            <CheckCircle className="text-gray-400 mt-1" size={20} />
          </div>
          <div className="text-gray-400 text-sm mt-2 font-medium flex gap-3 justify-center md:justify-start">
            <span>@{channel.displayName?.toLowerCase().replace(/\s/g, "") || "kanal"}</span>
            <span>•</span>
            <span>{channel.subscribersCount ?? channel.subscribers?.length ?? 0} Abone</span>
            <span>•</span>
            <span>{videos.length} Video</span>
          </div>

          <div className="mt-4 flex gap-3 justify-center md:justify-start">
            {!isOwner && (
              <button
                type="button"
                onClick={toggleSubscribe}
                className={`px-6 py-2 rounded-full font-bold transition-all ${
                  isSubscribed ? "bg-white/10 text-white" : "bg-white text-black hover:bg-gray-200"
                }`}
              >
                {isSubscribed ? "Abone Olundu" : "Abone Ol"}
              </button>
            )}
            {isOwner && (
              <Link
                href={`/channel/${id}/monetization`}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-400 font-medium transition"
              >
                <DollarSign size={18} />
                Monetizasyon
              </Link>
            )}
            <button
              type="button"
              className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition"
            >
              <Info size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* 3. KANAL SEKMLERİ – YouTube tarzı */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 border-b border-white/10">
        <nav className="flex gap-1" aria-label="Kanal sekmeleri">
          {(
            [
              { id: "videos" as const, label: "Videolar" },
              { id: "shorts" as const, label: "Shorts" },
              { id: "playlists" as const, label: "Oynatma listeleri" },
              { id: "about" as const, label: "Hakkında" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
                activeTab === tab.id
                  ? "text-white border-white"
                  : "text-gray-400 border-transparent hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* 4. SEKME İÇERİĞİ */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        {isMonetized && activeTab === "videos" && (
          <div className="mb-6">
            <AdSlot channelUserId={id} isMonetized={true} format="horizontal" className="min-h-[100px]" />
          </div>
        )}

        {activeTab === "videos" && (
          <>
            <div className="flex items-center justify-between mb-4">
              <span className="text-white/60 text-sm">
                {videos.length} video
              </span>
              <Link href="/" className="text-gray-400 hover:text-white text-sm">
                ← Ana sayfa
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
              {videos.length > 0 ? (
                videos.map((video) => (
                  <VideoCard
                    key={video.id}
                    video={{
                      id: video.id,
                      title: video.title,
                      imageUrl: video.imageUrl,
                      videoUrl: video.videoUrl,
                      authorImage: video.authorImage,
                      authorName: video.authorName || video.tool,
                      views: String(video.likedBy?.length ?? video.likes ?? video.likesCount ?? 0),
                      tags: [video.tool, video.category].filter(Boolean),
                    }}
                  />
                ))
              ) : (
                <div className="col-span-full text-center py-16 text-gray-500 text-sm">
                  Bu kanalda henüz video yok.
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === "shorts" && (
          <div className="py-12 text-center">
            {channelShorts.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {channelShorts.slice(0, 20).map((video: any) => (
                  <Link key={video.id} href={`/shorts/${video.id}`} className="relative aspect-[9/16] rounded-lg overflow-hidden bg-white/5 block">
                    <img src={video.imageUrl || ""} alt={video.title} className="w-full h-full object-cover" />
                    <p className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent text-white text-xs line-clamp-2">
                      {video.title}
                    </p>
                  </Link>
                ))}
              </div>
            ) : (
              <>
                <p className="text-gray-400 text-sm mb-4">Bu kanalda henüz Shorts yok.</p>
                <Link href="/shorts" className="text-cyan-400 hover:underline text-sm">Shorts keşfet →</Link>
              </>
            )}
          </div>
        )}

        {activeTab === "playlists" && (
          <div className="py-12">
            {isOwner ? (
              <>
                <p className="text-gray-400 text-sm mb-4">Oynatma listelerinizi yönetin.</p>
                <Link
                  href="/playlists"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm font-medium transition"
                >
                  Oynatma listelerime git →
                </Link>
              </>
            ) : (
              <p className="text-gray-500 text-sm text-center py-8">Bu kanal oynatma listelerini herkese açmıyor.</p>
            )}
          </div>
        )}

        {activeTab === "about" && (
          <div className="max-w-2xl py-8 space-y-6">
            <h2 className="text-lg font-semibold text-white">Hakkında</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Abone</p>
                <p className="text-white font-medium">{channel.subscribersCount ?? channel.subscribers?.length ?? 0}</p>
              </div>
              <div>
                <p className="text-gray-500">Video</p>
                <p className="text-white font-medium">{videos.length}</p>
              </div>
            </div>
            {channel.description ? (
              <p className="text-white/80 text-sm leading-relaxed whitespace-pre-wrap">{channel.description}</p>
            ) : (
              <p className="text-gray-500 text-sm">Açıklama eklenmemiş.</p>
            )}
            <Link href="/" className="inline-block text-cyan-400 hover:underline text-sm">← Ana sayfa</Link>
          </div>
        )}
      </div>
    </div>
  );
}
