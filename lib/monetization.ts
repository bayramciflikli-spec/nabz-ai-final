/**
 * NABZ-AI Monetizasyon Sistemi
 * Google AdSense ile entegre - en güvenilir reklam ağı
 * 
 * Koşullar: Min 50 abone, 5 video, 100 toplam görüntülenme
 */

import { db } from "./firebase";
import {
  doc,
  getDoc,
  setDoc,
  getDocs,
  collection,
  query,
  where,
  increment,
} from "firebase/firestore";

/** Monetizasyon için minimum gereksinimler */
export const MONETIZATION_REQUIREMENTS = {
  minSubscribers: 10,
  minVideos: 2,
  minTotalViews: 50,
};

export type MonetizationStatus = "pending" | "approved" | "rejected" | "suspended";

export interface ChannelMonetization {
  userId: string;
  status: MonetizationStatus;
  appliedAt: string;
  approvedAt?: string;
  rejectedReason?: string;
  adSensePublisherId?: string; // Gelecekte kendi AdSense hesabı bağlanabilir
}

export interface MonthlyEarnings {
  userId: string;
  yearMonth: string; // "2026-02"
  impressions: number;
  estimatedRevenue: number; // TL
  paid: boolean;
  paidAt?: string;
}

const CPM_ESTIMATE = 15; // Tahmini CPM (TL / 1000 görüntülenme)

/** Kanalın abone sayısını al */
export async function getSubscriberCount(userId: string): Promise<number> {
  const userRef = doc(db, "users", userId);
  const snap = await getDoc(userRef);
  const data = snap.data();
  return data?.subscribersCount ?? data?.subscribers?.length ?? 0;
}

/** Kanalın toplam video sayısını al */
export async function getVideoCount(userId: string): Promise<number> {
  const q = query(
    collection(db, "projects"),
    where("authorId", "==", userId)
  );
  const snap = await getDocs(q);
  return snap.size;
}

/** Kanalın toplam görüntülenme sayısını al (likedBy + basit view tahmini) */
export async function getTotalViews(userId: string): Promise<number> {
  const q = query(
    collection(db, "projects"),
    where("authorId", "==", userId)
  );
  const snap = await getDocs(q);
  let total = 0;
  snap.docs.forEach((d) => {
    const data = d.data();
    total += data?.likedBy?.length ?? data?.views ?? 0;
  });
  return total;
}

/** Monetizasyon için uygunluk kontrolü */
export async function checkMonetizationEligibility(
  userId: string
): Promise<{ eligible: boolean; subscribers: number; videos: number; views: number }> {
  const [subscribers, videos, views] = await Promise.all([
    getSubscriberCount(userId),
    getVideoCount(userId),
    getTotalViews(userId),
  ]);

  const eligible =
    subscribers >= MONETIZATION_REQUIREMENTS.minSubscribers &&
    videos >= MONETIZATION_REQUIREMENTS.minVideos &&
    views >= MONETIZATION_REQUIREMENTS.minTotalViews;

  return { eligible, subscribers, videos, views };
}

/** Monetizasyon durumunu al */
export async function getMonetizationStatus(
  userId: string
): Promise<ChannelMonetization | null> {
  const ref = doc(db, "channelMonetization", userId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return snap.data() as ChannelMonetization;
}

/** Monetizasyon başvurusu yap - gereksinimler karşılanıyorsa otomatik onay */
export async function applyForMonetization(
  userId: string,
  adPolicyAccepted: boolean
): Promise<void> {
  if (!adPolicyAccepted) {
    throw new Error("Monetizasyon için Reklam Politikasını kabul etmeniz gerekiyor.");
  }

  const eligibility = await checkMonetizationEligibility(userId);
  if (!eligibility.eligible) {
    throw new Error(
      `Gereksinimler karşılanmıyor. En az ${MONETIZATION_REQUIREMENTS.minSubscribers} abone, ${MONETIZATION_REQUIREMENTS.minVideos} video ve ${MONETIZATION_REQUIREMENTS.minTotalViews} görüntülenme gerekli.`
    );
  }

  const existing = await getMonetizationStatus(userId);
  if (existing?.status === "approved") {
    throw new Error("Kanalınız zaten monetize edilmiş.");
  }
  if (existing?.status === "pending") {
    throw new Error("Başvurunuz inceleniyor. Lütfen bekleyin.");
  }

  const now = new Date().toISOString();
  await setDoc(doc(db, "channelMonetization", userId), {
    userId,
    status: "approved",
    appliedAt: now,
    approvedAt: now,
    adPolicyAccepted: true,
    adPolicyAcceptedAt: now,
  });
}

/** Monetizasyon onayla (admin) */
export async function approveMonetization(userId: string): Promise<void> {
  await setDoc(
    doc(db, "channelMonetization", userId),
    {
      userId,
      status: "approved",
      approvedAt: new Date().toISOString(),
    },
    { merge: true }
  );
}

/** Kanal monetize mi? */
export async function isChannelMonetized(userId: string): Promise<boolean> {
  const status = await getMonetizationStatus(userId);
  return status?.status === "approved";
}

/** Reklam gösterilebilir mi? (kanal monetize + platform AdSense aktif) */
export async function canShowAds(channelUserId: string): Promise<boolean> {
  return isChannelMonetized(channelUserId);
}

/** Tahmini aylık gelir hesapla */
export function estimateRevenue(impressions: number): number {
  return (impressions / 1000) * CPM_ESTIMATE;
}
