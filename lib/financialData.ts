/**
 * Financial Hub - Sponsorluk ve Komisyon verileri
 */

export interface SponsorRow {
  id: string;
  companyName: string;
  package: string;
  globalSalesMonthly: string;
  commissionPercent: number;
  commissionAmount: string;
  paymentStatus: "completed" | "pending";
}

export const SPONSOR_ROWS: SponsorRow[] = [
  { id: "1", companyName: "Visionary-AI Pro", package: "$20,000 (Yıllık)", globalSalesMonthly: "$450,000", commissionPercent: 10, commissionAmount: "$45,000", paymentStatus: "completed" },
  { id: "2", companyName: "SoundMaster GPT", package: "$20,000 (Yıllık)", globalSalesMonthly: "$210,000", commissionPercent: 10, commissionAmount: "$21,000", paymentStatus: "pending" },
  { id: "3", companyName: "Luma Labs (Global)", package: "$20,000 (Yıllık)", globalSalesMonthly: "$182,500", commissionPercent: 10, commissionAmount: "$18,250", paymentStatus: "completed" },
];

export interface CountryStat {
  country: string;
  flag: string;
  amount: string;
}

export const COUNTRY_STATS: CountryStat[] = [
  { country: "USA", flag: "🇺🇸", amount: "$142K" },
  { country: "TR", flag: "🇹🇷", amount: "$85K" },
  { country: "DE", flag: "🇩🇪", amount: "$62K" },
  { country: "JP", flag: "🇯🇵", amount: "$48K" },
];

export const SUMMARY = {
  totalSponsorship: "$400,000.00",
  totalSponsorshipTrend: "▲ %12 (20 Şirket Hedefi: %100)",
  monthlyCommission: "$84,250.00",
  monthlyCommissionTrend: "▲ %8 (Geçen aya göre)",
  activeCompanies: 20,
  targetCompanies: 120,
  activePercent: 16,
};
