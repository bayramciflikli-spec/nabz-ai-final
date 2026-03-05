import { ProtectedRoute } from "@/components/ProtectedRoute";

export default function UploadLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}
