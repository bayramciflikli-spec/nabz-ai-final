import { ProtectedRoute } from "@/components/ProtectedRoute";

export default function HistoryLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}
