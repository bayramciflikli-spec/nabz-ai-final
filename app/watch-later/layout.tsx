import { ProtectedRoute } from "@/components/ProtectedRoute";

export default function WatchLaterLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}
