"use client";

import Link from "next/link";
import { Sidebar } from "@/components/Sidebar";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, type User } from "firebase/auth";
import { useEffect, useState } from "react";

export default function CCPAPage() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, setUser);
    return () => unsub();
  }, []);

  return (
    <div className="flex min-h-screen bg-[#050505] text-white">
      <div className="hidden sm:block">
        <Sidebar user={user} />
      </div>
      <div className="flex-1 sm:ml-56 p-8 max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">CCPA – California Consumer Privacy Act</h1>
        <p className="text-sm text-white/60 mb-6">For California residents – Your privacy rights</p>

        <div className="prose prose-invert prose-sm max-w-none space-y-6 text-white/90">
          <section>
            <h2 className="text-lg font-semibold text-white mb-2">1. Your Rights</h2>
            <p>
              Under the California Consumer Privacy Act (CCPA), California residents have the right to:
            </p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Know what personal information we collect and how it is used</li>
              <li>Request deletion of your personal information</li>
              <li>Opt-out of the sale of your personal information (we do not sell personal information)</li>
              <li>Non-discrimination for exercising your CCPA rights</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">2. Information We Collect</h2>
            <p>We may collect: name, email, profile photo, IP address, usage data, and content you share.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">3. How to Exercise Your Rights</h2>
            <p>
              Contact us or use the settings in your account to request access, deletion, or opt-out.
              We will respond within 45 days.
            </p>
          </section>
        </div>

        <div className="mt-8 flex flex-wrap gap-4 text-sm">
          <Link href="/yasal/kullanim-sartlari" className="text-cyan-400 hover:underline">
            Terms of Service
          </Link>
          <Link href="/yasal/gizlilik" className="text-cyan-400 hover:underline">
            Privacy Policy
          </Link>
          <Link href="/yasal/fikri-mulkiyet" className="text-cyan-400 hover:underline">
            IP & Copyright
          </Link>
          <Link href="/yasal/reklam-politikasi" className="text-cyan-400 hover:underline">
            Ad Policy
          </Link>
          <Link href="/" className="text-white/50 hover:text-white">
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
