"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, type User } from "firebase/auth";
import { MobileNav } from "./MobileNav";

export const MobileNavWrapper = () => {
  const [user, setUser] = useState<User | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    try {
      const unsub = onAuthStateChanged(auth, setUser);
      return () => unsub();
    } catch {
      return undefined;
    }
  }, []);

  if (pathname === "/landing") return null;

  return <MobileNav user={user} />;
};
