import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Güncel AI Haberleri | NABZ-AI",
  description: "Yapay zeka gelişmeleri, startup yatırımları ve sektör haberleri. OpenAI, Microsoft, Nvidia, Tesla ve daha fazlası.",
};

export default function HaberlerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
