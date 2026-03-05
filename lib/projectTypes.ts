/**
 * AI Gelecek Tasarımı - Proje modeli
 */
export type ProjectStatus = "pending" | "approved" | "rejected" | "locked";
export type AiReportStatus = "Clean" | "Flagged" | "Review";

export interface ProjectDoc {
  title: string;
  url?: string;
  owner_uid: string;
  country: string;
  status: ProjectStatus;
  ai_report: AiReportStatus;
  // Mevcut alanlar
  imageUrl?: string;
  videoUrl?: string;
  authorId?: string;
  authorName?: string;
  authorImage?: string;
  tool?: string;
  prompt?: string;
  kategori?: string | null;
  likedBy?: string[];
  distribution?: string;
  createdAt?: unknown;
}
