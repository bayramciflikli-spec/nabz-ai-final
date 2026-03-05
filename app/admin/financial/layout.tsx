import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "NABZ-AI | Financial Command",
  description: "Sponsorluk geliri ve komisyon yönetimi. Mali dönem özeti.",
};

export default function FinancialLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
