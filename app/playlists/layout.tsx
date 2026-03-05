import { ProtectedRoute } from "@/components/ProtectedRoute";

export default function PlaylistsLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}
