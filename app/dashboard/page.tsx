"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { auth } from "@/lib/firebase";
import { db } from "@/lib/firebase";
import { onAuthStateChanged, type User } from "firebase/auth";
import { collection, query, where, orderBy, limit, onSnapshot } from "firebase/firestore";
import { evaluateContentPromotion } from "@/lib/contentDistribution";
import { Sidebar } from "@/components/Sidebar";
import { Library, Wallet, Settings, Sparkles, LayoutGrid, Image, Plus, TrendingUp, ShieldCheck } from "lucide-react";
import { isAdmin } from "@/lib/isAdmin";

type TabKey = "videos" | "images" | "tools";

const DASHBOARD_NAV = [
  { key: "dashboard", label: "Dashboard", href: "/dashboard" },
  { key: "admin", label: "Admin Panel", href: "/admin", adminOnly: true },
  { label: "Galerim", href: "/channel", needsUserId: true },
  { label: "Cüzdan & Gelir", href: "/wallet" },
  { label: "AI Araçlarım", href: "/mall" },
  { label: "Ayarlar", href: "/settings" },
];

function getRankLevel(videoCount: number, totalViews: number): string {
  const views = totalViews * 100;
  if (views >= 1_000_000) return "LVL 50 PIONEER";
  if (views >= 500_000) return "LVL 40 LEGEND";
  if (views >= 100_000) return "LVL 42 ARCHITECT";
  if (videoCount >= 5 || views >= 10_000) return "LVL 25 CREATOR";
  return "LVL 5 BEGINNER";
}

function formatViews(n: number): string {
  const v = n * 100;
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
  return v.toLocaleString();
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [myProjects, setMyProjects] = useState<any[]>([]);
  const [totalViews, setTotalViews] = useState(0);
  const [estimatedEarnings, setEstimatedEarnings] = useState(0);
  const [activeTab, setActiveTab] = useState<TabKey>("videos");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, setUser);
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user?.uid) {
      setMyProjects([]);
      setTotalViews(0);
      return;
    }
    const q = query(
      collection(db, "projects"),
      where("authorId", "==", user.uid),
      orderBy("createdAt", "desc"),
      limit(12)
    );
    const unsub = onSnapshot(q, (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setMyProjects(items);
      let views = 0;
      items.forEach((p: any) => {
        views += (p.likedBy?.length ?? 0) + (p.views ?? 0);
      });
      setTotalViews(views);
      const impressions = views * 100;
      setEstimatedEarnings((impressions / 1000) * 0.2);
    });
    return () => unsub();
  }, [user?.uid]);

  const displayName = user?.displayName || "Kullanıcı";
  const photoURL = user?.photoURL || "/default-avatar.png";
  const rankBadge = getRankLevel(myProjects.length, totalViews);
  const rankTitle = rankBadge.split(" ").pop() || "CREATOR";
  const complianceScore = myProjects.length === 0 ? 100 : Math.min(
    100,
    100 - myProjects.filter((p: any) => evaluateContentPromotion(p) === "lock").length * 10
  );

  if (!user) {
    return (
      <div className="flex min-h-screen bg-[#050505] text-white">
        <div className="hidden sm:block">
          <Sidebar user={null} />
        </div>
        <div className="flex-1 sm:ml-56 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-400 mb-4">Dashboard&apos;a erişmek için giriş yapın.</p>
            <Link href="/" className="text-[#3b82f6] hover:underline">
              Ana Sayfaya Dön
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const pulseChange = totalViews > 0 ? "+12.4" : "0";
  const videos = myProjects.filter((p: any) => p.videoUrl || (!p.imageUrl && !p.videoUrl));
  const images = myProjects.filter((p: any) => p.imageUrl && !p.videoUrl);
  const activeContent =
    activeTab === "videos" ? videos : activeTab === "images" ? images : [];

  return (
    <div className="flex min-h-screen bg-[#050505] text-[#e5e7eb]">
      <div className="hidden sm:block">
        <Sidebar user={user} />
      </div>

      <div className="flex-1 sm:ml-56 flex">
        {/* Dashboard Kenar Menü */}
        <aside className="hidden lg:block w-60 min-h-screen bg-[#0f0f0f] border-r border-[#222] py-8 px-4">
          <div className="font-['Orbitron'] font-semibold text-xl mb-10 text-[#3b82f6]">NABZ-AI</div>
          <nav className="space-y-1">
            {DASHBOARD_NAV.filter((item) => !("adminOnly" in item && item.adminOnly) || isAdmin(user?.uid)).map((item) => {
              const href =
                "key" in item && item.key === "dashboard"
                  ? "/dashboard"
                  : "key" in item && item.key === "admin"
                    ? "/admin/global-control"
                    : "needsUserId" in item && item.needsUserId && user?.uid
                      ? `${item.href}/${user.uid}${"subPath" in item ? item.subPath || "" : ""}`
                      : item.href;
              return (
              <Link
                key={item.label}
                href={href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  item.key === "dashboard"
                    ? "bg-[#3b82f6]/10 text-[#3b82f6] font-semibold"
                    : item.key === "admin"
                      ? "text-amber-400 hover:bg-amber-500/10 hover:text-amber-300"
                      : "text-[#888] hover:bg-white/5 hover:text-white"
                }`}
              >
                {"key" in item && item.key === "dashboard" && <LayoutGrid size={18} />}
                {"key" in item && item.key === "admin" && <ShieldCheck size={18} />}
                {item.label === "Galerim" && <Library size={18} />}
                {item.label === "Cüzdan & Gelir" && <Wallet size={18} />}
                {item.label === "AI Araçlarım" && <Sparkles size={18} />}
                {item.label === "Ayarlar" && <Settings size={18} />}
                {item.label}
              </Link>
            );
            })}
          </nav>
        </aside>

        <main className="flex-1 p-4 sm:p-6 lg:p-10 min-w-0 overflow-auto pb-24 lg:pb-10">
          {/* Mobil: Günaydın + Quick Stats */}
          <div className="lg:hidden mb-6">
            <div className="pt-6 sm:pt-8 px-2 sm:px-4 pb-4">
              <p className="text-[#666] text-xs">GÜNAYDIN, {rankTitle}</p>
              <h2 className="text-xl font-bold mt-1">
                Bugünkü Nabız: <span className="text-[#4ade80]">+{pulseChange}%</span>
              </h2>
            </div>
            <div className="flex justify-around py-5 px-4 bg-gradient-to-b from-[#111] to-[#000] rounded-2xl mx-2 sm:mx-4">
              <div className="text-center">
                <small className="text-[#888] text-xs">Kazanç</small>
                <p className="font-bold text-white text-lg">${estimatedEarnings.toFixed(2)}</p>
              </div>
              <div className="text-center">
                <small className="text-[#888] text-xs">İzlenme</small>
                <p className="font-bold text-white text-lg">{formatViews(totalViews)}</p>
              </div>
              <div className="text-center">
                <small className="text-[#888] text-xs">Etik Skor</small>
                <p className="font-bold text-[#4ade80] text-lg">%{complianceScore}</p>
              </div>
            </div>
            <div className="mt-4 mx-2 sm:mx-4 p-5 rounded-2xl bg-[#111] border border-[#222]">
              <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                <TrendingUp size={18} className="text-[#4ade80]" /> Trend Analizi
              </h4>
              <p className="text-xs text-[#aaa]">
                İçeriklerin şu an en çok <strong className="text-white">Almanya</strong> ve <strong className="text-white">Japonya</strong> pazarında ilgi görüyor.
              </p>
            </div>
            <div className="mt-4 mx-2 sm:mx-4 h-[200px] rounded-2xl bg-[#111] border border-[#222] flex items-center justify-center">
              <span className="text-[#666] text-sm">Grafik alanı (yakında)</span>
            </div>
          </div>

          {/* Profil Header - Desktop */}
          <header className="hidden lg:flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 p-6 lg:p-8 rounded-2xl bg-gradient-to-br from-[#111] to-[#1a1a1a] border border-[#222] mb-8">
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 rounded-full bg-[#3b82f6] border-2 border-[#222] overflow-hidden shrink-0">
                <img src={photoURL} alt="" className="w-full h-full object-cover" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white flex items-center gap-2 flex-wrap">
                  {displayName}
                  <span className="px-3 py-0.5 rounded-full text-xs font-medium border border-[#f59e0b] bg-[#f59e0b]/10 text-[#f59e0b] font-['Orbitron']">
                    {rankBadge}
                  </span>
                </h1>
                <p className="text-sm text-[#666] mt-1">Yapay zeka sanatı ve fütüristik video üreticisi.</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-xl bg-[#4ade80]/5 border border-[#4ade80]/20">
              <span className="text-2xl">🛡️</span>
              <div>
                <p className="text-xs font-semibold text-[#4ade80]">ETİK MUHAFIZ SKORU: %{complianceScore}</p>
                <p className="text-[10px] text-[#888]">İçerikleriniz topluluk kurallarına tam uyumludur.</p>
              </div>
            </div>
          </header>

          {/* İstatistik Kartları - Desktop */}
          <div className="hidden lg:grid grid-cols-1 sm:grid-cols-3 gap-5 mb-10">
            <div className="p-6 rounded-2xl bg-[#0f0f0f] border border-[#222]">
              <p className="text-xs text-[#666]">TOPLAM KAZANÇ</p>
              <p className="text-2xl font-bold text-white mt-1">${estimatedEarnings.toFixed(2)}</p>
              <p className="text-[11px] text-[#4ade80] mt-1">↑ Tahmini (CPM bazlı)</p>
            </div>
            <div className="p-6 rounded-2xl bg-[#0f0f0f] border border-[#222]">
              <p className="text-xs text-[#666]">GLOBAL ETKİLEŞİM</p>
              <p className="text-2xl font-bold text-white mt-1">{formatViews(totalViews)}</p>
              <p className="text-[11px] text-[#3b82f6] mt-1">1M Barajına Yakın</p>
            </div>
            <div className="p-6 rounded-2xl bg-[#0f0f0f] border border-[#222]">
              <p className="text-xs text-[#666]">AKTİF SPONSORLUK</p>
              <p className="text-2xl font-bold text-white mt-1">{myProjects.length} İçerik</p>
              <p className="text-[11px] text-[#666] mt-1">Yayında</p>
            </div>
          </div>

          {/* Mobil FAB */}
          <Link
            href="/create"
            className="lg:hidden fixed bottom-8 left-1/2 -translate-x-1/2 w-14 h-14 rounded-full bg-[#3b82f6] flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.5)] hover:scale-105 active:scale-95 transition-transform z-50"
            aria-label="Yeni içerik oluştur"
          >
            <Plus size={24} className="text-white" />
          </Link>

          {/* İçerik Sekmeleri */}
          <section>
            <div className="flex gap-8 border-b border-[#222] mb-6">
              {[
                { key: "videos" as TabKey, label: "VİDEOLARIM", icon: Library },
                { key: "images" as TabKey, label: "GÖRSELLER", icon: Image },
                { key: "tools" as TabKey, label: "FAVORİ ARAÇLAR", icon: Sparkles },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 py-3 px-0 relative transition-colors ${
                    activeTab === tab.key ? "text-[#4ade80] font-medium" : "text-[#666] hover:text-white"
                  }`}
                >
                  <tab.icon size={16} />
                  {tab.label}
                  {activeTab === tab.key && (
                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#4ade80]" />
                  )}
                </button>
              ))}
            </div>

            {activeTab === "tools" ? (
              <div className="py-12 text-center text-[#666]">
                <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Favori AI araçlarınız burada görünecek.</p>
                <Link href="/mall" className="inline-block mt-4 text-[#3b82f6] hover:underline">
                  AVM&apos;ye Git →
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeContent.slice(0, 6).map((project: any) => {
                  const result = evaluateContentPromotion(project);
                  const status =
                    result === "promote"
                      ? { label: "GLOBAL LIVE", color: "text-[#4ade80]" }
                      : result === "lock"
                        ? { label: "KİLİTLİ", color: "text-[#ef4444]" }
                        : { label: "IN REVIEW", color: "text-[#f59e0b]" };
                  return (
                    <Link
                      key={project.id}
                      href={`/project/${project.id}`}
                      className="group relative aspect-video rounded-xl bg-[#1a1a1a] border border-[#222] overflow-hidden hover:border-[#3b82f6]/30 transition-colors"
                    >
                      <img
                        src={
                          project.imageUrl ||
                          project.thumbnail ||
                          "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400"
                        }
                        alt={project.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <span
                        className={`absolute top-2 right-2 text-[10px] font-medium px-2 py-0.5 rounded bg-black/70 ${status.color}`}
                      >
                        ● {status.label}
                      </span>
                      <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                        <p className="text-sm font-medium truncate">{project.title || "İsimsiz"}</p>
                      </div>
                    </Link>
                  );
                })}
                <Link
                  href="/create"
                  className="aspect-video rounded-xl border-2 border-dashed border-[#333] flex flex-col items-center justify-center gap-2 hover:border-[#4ade80]/30 transition-colors text-[#666] hover:text-[#4ade80]"
                >
                  <span className="text-3xl">+</span>
                  <span className="text-xs font-medium">Yeni İçerik</span>
                </Link>
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
