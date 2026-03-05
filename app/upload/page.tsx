"use client";
import { Suspense, useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { db, storage } from "@/lib/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { isPlatformSubscribed, isUserBanned } from "@/lib/subscription";
import { getUserAccess } from "@/lib/userAccess";
import { SubscriptionRequiredModal } from "@/components/SubscriptionRequiredModal";
import { CONTENT_RULES } from "@/lib/contentRules";
import { useAuth } from "@/components/AuthProvider";
import { useCountry } from "@/components/CountryProvider";
import { useToast } from "@/components/ToastContext";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { sanitizeText, TITLE_MAX_LENGTH, PROMPT_MAX_LENGTH } from "@/lib/security";
import { getEcosystemOwnerUid, ECOSYSTEM_OWNER_FIELD } from "@/lib/ecosystem";

const KATEGORI_TOOL: Record<string, string> = {
  shorts: "Kling AI",
  enler: "Kling AI",
  video: "Kling AI",
  muzik: "Suno",
  animasyon: "Kling AI",
  "logo-tasarim": "Midjourney",
};

const ENGINE_OPTIONS: { id: string; label: string; value: string; color: string }[] = [
  { id: "midjourney", label: "Midjourney v6.1", value: "Midjourney", color: "#3b82f6" },
  { id: "luma", label: "Luma Dream Machine", value: "Luma", color: "#8b5cf6" },
  { id: "kling", label: "Kling AI", value: "Kling AI", color: "#10b981" },
  { id: "runway", label: "Runway Gen-3", value: "Runway", color: "#f59e0b" },
  { id: "suno", label: "Suno", value: "Suno", color: "#ec4899" },
  { id: "elevenlabs", label: "ElevenLabs", value: "ElevenLabs", color: "#06b6d4" },
  { id: "leonardo", label: "Leonardo", value: "Leonardo", color: "#6366f1" },
  { id: "ideogram", label: "Ideogram", value: "Ideogram", color: "#84cc16" },
];

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];

function UploadContent() {
  const searchParams = useSearchParams();
  const kategoriParam = searchParams.get("kategori");
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [tool, setTool] = useState("Suno");
  const [selectedEngineId, setSelectedEngineId] = useState("suno");
  const [imageUrl, setImageUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [prompt, setPrompt] = useState("");
  const { user } = useAuth();
  const { country } = useCountry();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [copyrightChecking, setCopyrightChecking] = useState(false);
  const [canUpload, setCanUpload] = useState<boolean | null>(null);

  useEffect(() => {
    if (!user?.uid) {
      setCanUpload(null);
      return;
    }
    getUserAccess(user.uid).then((a) => setCanUpload(a.canUpload));
  }, [user?.uid]);

  useEffect(() => {
    if (kategoriParam && KATEGORI_TOOL[kategoriParam]) {
      const t = KATEGORI_TOOL[kategoriParam];
      setTool(t);
      const eng = ENGINE_OPTIONS.find((e) => e.value === t);
      if (eng) setSelectedEngineId(eng.id);
    }
  }, [kategoriParam]);

  const uploadFile = async (file: File, path: string): Promise<string> => {
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    return getDownloadURL(storageRef);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    const hasImage = imageUrl || imageFile;
    if (!title || !hasImage || !prompt) {
      toast.error("Lütfen Başlık, Görsel (URL veya dosya) ve Prompt alanlarını doldurun!");
      return;
    }
    if (!user) {
      toast.error("İçerik paylaşmak için giriş yapmanız gerekiyor. Sağ üstten giriş yapın.");
      return;
    }

    const subscribed = await isPlatformSubscribed(user.uid);
    if (!subscribed) {
      setShowSubscriptionModal(true);
      return;
    }

    const access = await getUserAccess(user.uid);
    if (!access.canUpload) {
      toast.error("İçerik yüklemek için Architect rütbesine yükselmeniz gerekiyor. Şu an sadece izleyici (Explorer) olarak erişiminiz var.");
      return;
    }

    const banned = await isUserBanned(user.uid);
    if (banned) {
      toast.error("Hesabınız içerik kuralları ihlali nedeniyle engellenmiştir. Destek ile iletişime geçin.");
      return;
    }

    setLoading(true);
    try {
      let finalImageUrl = imageUrl;
      let finalVideoUrl = videoUrl || null;

      if (imageFile) {
        const uid = user?.uid || "anon";
        finalImageUrl = await uploadFile(imageFile, `projects/${uid}/${Date.now()}_img`);
      }
      if (videoFile) {
        const uid = user?.uid || "anon";
        finalVideoUrl = await uploadFile(videoFile, `projects/${uid}/${Date.now()}_vid`);
      }

      setCopyrightChecking(true);
      let aiReport: "Clean" | "Flagged" | "Review" = "Clean";
      try {
        const checkRes = await fetchWithAuth("/api/check-copyright", {
          method: "POST",
          body: JSON.stringify({
            imageUrl: finalImageUrl,
            videoUrl: finalVideoUrl || undefined,
            type: finalVideoUrl ? "video" : "image",
          }),
        });
        const checkData = await checkRes.json();
        if (!checkData.ok || !checkData.passed) {
          toast.error("Telif kontrolü: Bu içerik paylaşıma uygun değil veya telif ihlali tespit edildi. Lütfen orijinal veya lisanslı içerik paylaşın.");
          return;
        }
        aiReport = checkData.ai_report || "Clean";
      } finally {
        setCopyrightChecking(false);
      }

      const safeTitle = sanitizeText(title, TITLE_MAX_LENGTH) || "İsimsiz";
      const safePrompt = sanitizeText(prompt, PROMPT_MAX_LENGTH) || "";
      const primaryUrl = finalVideoUrl || finalImageUrl;

      const registerRes = await fetchWithAuth("/api/register-ip", {
        method: "POST",
        body: JSON.stringify({
          imageUrl: finalImageUrl,
          videoUrl: finalVideoUrl || undefined,
          tool,
        }),
      });
      const registerData = await registerRes.json();
      if (!registerData.ok || !registerData.contentID) {
        toast.error(registerData.error || "IP kaydı başarısız. Lütfen tekrar deneyin.");
        return;
      }
      const contentID = registerData.contentID;

      const ecosystemOwnerUid = getEcosystemOwnerUid();
      await setDoc(doc(db, "projects", contentID), {
        title: safeTitle,
        titleLower: safeTitle.toLowerCase(),
        url: primaryUrl,
        imageUrl: finalImageUrl,
        videoUrl: finalVideoUrl,
        tool,
        prompt: safePrompt,
        kategori: kategoriParam || null,
        authorId: user?.uid,
        authorName: user?.displayName,
        authorImage: user?.photoURL,
        owner_uid: user?.uid,
        ...(ecosystemOwnerUid ? { [ECOSYSTEM_OWNER_FIELD]: ecosystemOwnerUid } : {}),
        country: country || "TR",
        status: "pending",
        ai_report: aiReport,
        likedBy: [],
        dislikedBy: [],
        subscribers: [],
        distribution: "local",
        isAdult: false,
        contentID,
        createdAt: serverTimestamp(),
      });
      toast.success("İçeriğiniz NABZ-AI'da paylaşıldı!");
      setTitle("");
      setImageUrl("");
      setVideoUrl("");
      setImageFile(null);
      setVideoFile(null);
      setPrompt("");
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Beklenmeyen hata";
      toast.error("Hata: " + msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 sm:p-6 md:p-8 flex flex-col items-center">
      {showSubscriptionModal && (
        <SubscriptionRequiredModal
          onClose={() => setShowSubscriptionModal(false)}
          returnUrl="/upload"
        />
      )}
      <h1 className="text-2xl sm:text-3xl font-bold mb-2 text-white text-center sm:text-left">İçeriğini Paylaş</h1>
      <p className="text-slate-400 text-sm mb-4 text-center sm:text-left">AI ile oluşturduğun içerikleri NABZ-AI&apos;da herkesle paylaş — URL veya kendi dosyalarından</p>

      <div className="w-full max-w-md mb-4 sm:mb-6 p-3 sm:p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
        <p className="text-xs font-bold text-amber-400/90 uppercase mb-2">İçerik Kuralları</p>
        <p className="text-xs text-white/80 mb-2">Telifli müzik, video vb. paylaşımı kendi sorumluluğunuzdadır.</p>
        <p className="text-xs text-white/60 mb-1">Yasak: {CONTENT_RULES.prohibited.join(", ")}.</p>
        <p className="text-xs text-red-400/80">{CONTENT_RULES.consequence}</p>
        <p className="text-xs text-white/50 mt-2">İçerikler web ve uygulamalarda telif kontrolünden geçirilir.</p>
      </div>

      {canUpload === false && (
        <div className="w-full max-w-md mb-4 p-4 rounded-xl bg-amber-500/20 border border-amber-500/50">
          <p className="text-sm font-bold text-amber-400">Architect rütbesi gerekli</p>
          <p className="text-xs text-white/90 mt-1">Şu an Explorer (izleyici) olarak giriş yaptınız. İçerik yüklemek için Architect rütbesine yükselmeniz gerekiyor.</p>
        </div>
      )}

      
      <form onSubmit={handleUpload} className="bg-slate-900/80 border border-slate-700 p-4 sm:p-6 md:p-8 rounded-2xl shadow-xl w-full max-w-md flex flex-col gap-4 sm:gap-5">
        <div>
          <label className="text-xs font-bold text-slate-400 uppercase ml-1">Başlık</label>
          <input 
            className="w-full border border-slate-600 p-3 rounded-xl bg-slate-800 text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500" 
            placeholder="İçeriğinin adı"
            value={title} onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div>
          <label className="text-xs font-bold text-slate-400 uppercase ml-1">Görsel (Kapak)</label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input 
              type="text"
              className="flex-1 border border-slate-600 p-3 rounded-xl bg-slate-800 text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-red-500"
              placeholder="URL yapıştır"
              value={imageUrl} onChange={(e) => { setImageUrl(e.target.value); setImageFile(null); }}
              disabled={!!imageFile}
            />
            <input
              type="file"
              ref={imageInputRef}
              accept={IMAGE_TYPES.join(",")}
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) { setImageFile(f); setImageUrl(""); }
              }}
            />
            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-sm font-medium shrink-0"
            >
              {imageFile ? imageFile.name.slice(0, 12) + "…" : "Dosya Seç"}
            </button>
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-400 uppercase ml-1">Video (Opsiyonel)</label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              className="flex-1 border border-slate-600 p-3 rounded-xl bg-slate-800 text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-red-500"
              placeholder="Video URL veya dosya seç"
              value={videoUrl}
              onChange={(e) => { setVideoUrl(e.target.value); setVideoFile(null); }}
              disabled={!!videoFile}
            />
            <input
              type="file"
              ref={videoInputRef}
              accept={VIDEO_TYPES.join(",")}
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) { setVideoFile(f); setVideoUrl(""); }
              }}
            />
            <button
              type="button"
              onClick={() => videoInputRef.current?.click()}
              className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-sm font-medium shrink-0"
            >
              {videoFile ? videoFile.name.slice(0, 12) + "…" : "Dosya Seç"}
            </button>
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-400 uppercase ml-1">Prompt</label>
          <textarea
            className="w-full border border-slate-600 p-3 rounded-xl bg-slate-800 text-white placeholder-slate-500 h-28 outline-none focus:ring-2 focus:ring-red-500"
            placeholder="Bu içeriği oluştururken hangi promptu kullandın?"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
        </div>

        <div className="mt-4 pt-4 border-t border-slate-700">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[11px] text-slate-500 uppercase tracking-wider">Engine:</span>
          </div>
          <div className="flex flex-wrap gap-2 mb-4">
            {ENGINE_OPTIONS.map((eng) => {
              const isSelected = selectedEngineId === eng.id || tool === eng.value;
              return (
                <button
                  key={eng.id}
                  type="button"
                  onClick={() => {
                    setSelectedEngineId(eng.id);
                    setTool(eng.value);
                  }}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md border transition-all ${
                    isSelected
                      ? "border-blue-500 bg-blue-500/10"
                      : "border-slate-600 bg-white/5 hover:border-slate-500 hover:bg-white/10"
                  }`}
                >
                  <div
                    className="w-3.5 h-3.5 rounded-sm shrink-0"
                    style={{ backgroundColor: eng.color }}
                  />
                  <span className="text-xs font-medium text-slate-300">{eng.label}</span>
                </button>
              );
            })}
          </div>
          <h2 className="text-lg font-semibold text-white mt-2">
            {title || "İçeriğinin adı"}
          </h2>
        </div>

        <button
          type="submit"
          className="bg-red-600 hover:bg-red-500 text-white p-4 rounded-2xl font-bold shadow-lg transition-all disabled:opacity-50"
          disabled={loading}
        >
          {loading
            ? copyrightChecking
              ? "Telif kontrolü yapılıyor..."
              : "Yükleniyor..."
            : "NABZ-AI'da Paylaş"}
        </button>
        <a href="/" className="text-center text-slate-400 text-sm hover:text-white">Ana Sayfaya Dön</a>
      </form>
    </div>
  );
}

export default function UploadPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0d0f12] flex items-center justify-center"><div className="w-10 h-10 border-2 border-red-500/50 border-t-red-500 rounded-full animate-spin" /></div>}>
      <UploadContent />
    </Suspense>
  );
}