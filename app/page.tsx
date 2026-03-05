import Dashboard from "@/components/Dashboard";

/**
 * Ana giriş – ACİL KURTARMA BYPASS
 * Yetki kontrolleri kapalı; önce görseli göster, güvenlik sonra adım adım eklenir.
 */
export default function Page() {
  const adminUid =
    (process.env.NEXT_PUBLIC_ADMIN_UIDS ?? "").trim().split(",")[0]?.trim() ||
    "iZt8LY8jfpeGwCqxNU0HjhHCoIq2";
  const adminEmail =
    (process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? "").trim() || "bayramciflikli@gmail.com";

  return (
    <Dashboard adminUid={adminUid} adminEmail={adminEmail} />
  );
}
