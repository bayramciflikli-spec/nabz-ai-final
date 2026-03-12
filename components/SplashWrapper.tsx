"use client";

// Splash tamamen devre dışı: uygulama açıldığında doğrudan ana sayfa gelir.
// Bu wrapper sadece gelecekte tekrar ihtiyaç olursa kalsın.

export function SplashWrapper({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
