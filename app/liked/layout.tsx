import { ProtectedRoute } from "@/components/ProtectedRoute";

export default function LikedLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}
