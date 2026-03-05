import { ProtectedRoute } from "@/components/ProtectedRoute";

export default function LibraryLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}
