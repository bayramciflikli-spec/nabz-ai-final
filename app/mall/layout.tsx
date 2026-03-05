import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "NABZ-AI | Global Virtual Mall",
  description:
    "Yapay zeka araçları sanal AVM. Video, ses, görsel ve sohbet AI mağazaları. KVKK & GDPR uyumlu.",
};

export default function MallLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="font-['Inter',sans-serif]">
      {children}
    </div>
  );
}
