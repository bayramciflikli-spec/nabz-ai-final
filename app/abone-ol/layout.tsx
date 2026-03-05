import { ProtectedRoute } from "@/components/ProtectedRoute";

export default function AboneOlLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}
