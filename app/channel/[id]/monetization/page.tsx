"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/firebase";
import {
  checkMonetizationEligibility,
  getMonetizationStatus,
  applyForMonetization,
  MONETIZATION_REQUIREMENTS,
} from "@/lib/monetization";
import { DollarSign, Users, Video, Eye, CheckCircle, Clock } from "lucide-react";

export default function MonetizationPage() {
  const params = useParams();
  const channelId = params?.id as string;
  const [eligibility, setEligibility] = useState<{
    eligible: boolean;
    subscribers: number;
    videos: number;
    views: number;
  } | null>(null);
  const [monetization, setMonetization] = useState<{
    status: string;
    appliedAt?: string;
    approvedAt?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState("");
  const [adPolicyAccepted, setAdPolicyAccepted] = useState(false);

  const isOwner = auth.currentUser?.uid === channelId;

  useEffect(() => {
    const load = async () => {
      if (!channelId) return;
      setLoading(true);
      try {
        const [elig, mon] = await Promise.all([
          checkMonetizationEligibility(channelId),
          getMonetizationStatus(channelId),
        ]);
        setEligibility(elig);
        setMonetization(mon ? { status: mon.status, appliedAt: mon.appliedAt, approvedAt: mon.approvedAt } : null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [channelId]);

  const handleApply = async () => {
    if (!isOwner || !channelId) return;
    setApplying(true);
    setError("");
    try {
      await applyForMonetization(channelId, adPolicyAccepted);
      setMonetization({ status: "approved", appliedAt: new Date().toISOString(), approvedAt: new Date().toISOString() });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Başvuru yapılamadı");
    } finally {
      setApplying(false);
    }
  };

  if (!isOwner) {
    return (
      <div className="min-h-screen bg-[#0F0F0F] text-white p-8 flex flex-col items-center justify-center">
        <p className="text-lg mb-4">Bu sayfayı yalnızca kanal sahibi görüntüleyebilir.</p>
        <Link href={`/channel/${channelId}`} className="text-red-400 font-bold hover:underline">
          ← Kanalıma dön
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F0F0F] text-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-red-500/50 border-t-red-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white p-4 sm:p-8">
      <div className="max-w-2xl mx-auto">
        <Link
          href={`/channel/${channelId}`}
          className="inline-block text-gray-400 hover:text-white mb-6 text-sm"
        >
          ← Kanalıma dön
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center">
            <DollarSign size={24} className="text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Kanal Monetizasyonu</h1>
            <p className="text-sm text-gray-400">
              Google AdSense ile reklam geliri kazanın
            </p>
          </div>
        </div>

        {monetization?.status === "approved" && (
          <div className="mb-6 p-4 rounded-xl bg-green-500/10 border border-green-500/30 flex items-center gap-3">
            <CheckCircle size={24} className="text-green-400" />
            <div>
              <p className="font-semibold text-green-400">Monetizasyon Aktif</p>
              <p className="text-sm text-white/70">
                Kanalınızda reklamlar gösteriliyor. Gelirleriniz NABZ-AI panelinden takip edilebilir.
              </p>
            </div>
          </div>
        )}

        {monetization?.status === "pending" && (
          <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-3">
            <Clock size={24} className="text-amber-400" />
            <div>
              <p className="font-semibold text-amber-400">Başvuru İnceleniyor</p>
              <p className="text-sm text-white/70">
                Başvurunuz alındı. Genelde 24-48 saat içinde yanıt verilir.
              </p>
            </div>
          </div>
        )}

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
          <h2 className="text-lg font-bold mb-4">Gereksinimler</h2>
          <div className="grid gap-4">
            <div className="flex items-center justify-between p-3 rounded-xl bg-white/5">
              <div className="flex items-center gap-3">
                <Users size={20} className="text-white/60" />
                <span>En az {MONETIZATION_REQUIREMENTS.minSubscribers} abone</span>
              </div>
              <span className={eligibility && eligibility.subscribers >= MONETIZATION_REQUIREMENTS.minSubscribers ? "text-green-400" : "text-amber-400"}>
                {eligibility?.subscribers ?? 0}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-white/5">
              <div className="flex items-center gap-3">
                <Video size={20} className="text-white/60" />
                <span>En az {MONETIZATION_REQUIREMENTS.minVideos} video</span>
              </div>
              <span className={eligibility && eligibility.videos >= MONETIZATION_REQUIREMENTS.minVideos ? "text-green-400" : "text-amber-400"}>
                {eligibility?.videos ?? 0}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-white/5">
              <div className="flex items-center gap-3">
                <Eye size={20} className="text-white/60" />
                <span>En az {MONETIZATION_REQUIREMENTS.minTotalViews} görüntülenme</span>
              </div>
              <span className={eligibility && eligibility.views >= MONETIZATION_REQUIREMENTS.minTotalViews ? "text-green-400" : "text-amber-400"}>
                {eligibility?.views ?? 0}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
          <h2 className="text-lg font-bold mb-3">Google AdSense</h2>
          <p className="text-sm text-white/70 mb-4">
            NABZ-AI, reklam geliri için Google AdSense kullanır. Bu, dünyanın en güvenilir reklam ağıdır.
            Onaylandıktan sonra videolarınızda ve kanal sayfanızda reklamlar gösterilir.
          </p>
          <p className="text-xs text-white/50">
            Minimum ödeme eşiği: 100 TL. Ödemeler banka havalesi veya PayPal ile yapılır.
          </p>
        </div>

        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-6 mb-6">
          <h2 className="text-lg font-bold mb-3 text-amber-400">Reklam Politikası</h2>
          <p className="text-sm text-white/80 mb-4">
            Etik ve ahlaki kurallarımıza uymayan reklamlar NABZ-AI&apos;da asla gösterilmez. Yetişkin içerik,
            kumar, uyuşturucu, nefret söylemi ve benzeri kategoriler kesinlikle yasaktır.
          </p>
          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={adPolicyAccepted}
              onChange={(e) => setAdPolicyAccepted(e.target.checked)}
              className="mt-1 w-4 h-4 rounded border-amber-500/50 bg-black/40 text-amber-500 focus:ring-amber-500/50"
            />
            <span className="text-sm text-white/90 group-hover:text-white">
              <Link href="/yasal/reklam-politikasi" className="text-amber-400 hover:underline font-medium">
                Reklam Politikasını
              </Link>
              {" "}okudum ve etik/ahlaki kurallara uygun reklam anlaşması yapmayı kabul ediyorum.
            </span>
          </label>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            {error}
          </div>
        )}

        {monetization?.status !== "approved" && monetization?.status !== "pending" && (
          <button
            type="button"
            onClick={handleApply}
            disabled={!eligibility?.eligible || !adPolicyAccepted || applying}
            className="w-full py-4 rounded-xl bg-amber-500 hover:bg-amber-500/90 text-black font-bold transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {applying ? "Başvuru yapılıyor..." : "Monetizasyon için Başvur"}
          </button>
        )}
      </div>
    </div>
  );
}
