"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, type User as AuthUser } from "firebase/auth";
import { Sidebar } from "@/components/Sidebar";
import { useLocale } from "@/components/LocaleProvider";
import { LOCALES, type Locale } from "@/lib/i18n/types";
import { Globe, User, Copy, Check, Shield, ShieldAlert, Trash2, Search, Settings } from "lucide-react";
import { isAdmin } from "@/lib/isAdmin";
import { useToast } from "@/components/ToastContext";
import { fetchWithAuth } from "@/lib/fetchWithAuth";

type SettingsSection = "account" | "language" | "privacy" | "admin";

const NAV_ITEMS: { id: SettingsSection; label: string; icon: React.ReactNode }[] = [
  { id: "account", label: "Hesap", icon: <User size={20} /> },
  { id: "language", label: "Dil", icon: <Globe size={20} /> },
  { id: "privacy", label: "Gizlilik ve silinme", icon: <Trash2 size={20} /> },
  { id: "admin", label: "Admin / UID", icon: <Shield size={20} /> },
];

export default function SettingsPage() {
  const toast = useToast();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [section, setSection] = useState<SettingsSection>("account");
  const [copied, setCopied] = useState<"uid" | "env" | null>(null);
  const [rtbfLoading, setRtbfLoading] = useState(false);
  const [rtbfConfirm, setRtbfConfirm] = useState(false);
  const [languageSearch, setLanguageSearch] = useState("");
  const { t, locale, setLocale, isAuto } = useLocale();

  const filteredLocales = languageSearch.trim()
    ? LOCALES.filter(
        (loc) =>
          loc.native.toLowerCase().includes(languageSearch.toLowerCase()) ||
          loc.name.toLowerCase().includes(languageSearch.toLowerCase()) ||
          loc.code.toLowerCase().includes(languageSearch.toLowerCase())
      )
    : LOCALES;

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, setUser);
    return () => unsub();
  }, []);

  const copyUid = () => {
    if (!user?.uid) return;
    navigator.clipboard.writeText(user.uid);
    setCopied("uid");
    setTimeout(() => setCopied(null), 2000);
  };

  const copyEnvLine = () => {
    if (!user?.uid) return;
    const line = `NEXT_PUBLIC_ADMIN_UIDS=${user.uid}`;
    navigator.clipboard.writeText(line);
    setCopied("env");
    setTimeout(() => setCopied(null), 2000);
  };

  const adminStatus = user ? isAdmin(user.uid) : false;

  const handleLocaleChange = (l: Locale, auto: boolean) => {
    setLocale(l, auto);
  };

  const handleRightToBeForgotten = async () => {
    if (!rtbfConfirm || !user) return;
    setRtbfLoading(true);
    try {
      const res = await fetchWithAuth("/api/right-to-be-forgotten", {
        method: "POST",
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (data.ok) {
        toast.success("Hesabınız anonimleştirildi. Kişisel verileriniz silindi. Çıkış yapılıyor.");
        auth.signOut();
        window.location.href = "/";
      } else {
        toast.error(data.error || "İşlem başarısız");
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "İşlem başarısız";
      toast.error(msg);
    } finally {
      setRtbfLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#0F0F0F] text-white">
      <div className="hidden sm:block">
        <Sidebar user={user} />
      </div>

      {/* Web ve mobil aynı: sol/dikey menü + ana alan (mobilde menü üstte dikey) */}
      <div className="flex-1 flex flex-col sm:flex-row sm:ml-56 min-h-screen">
        <aside className="w-full sm:w-56 shrink-0 bg-[#212121] border-b sm:border-b-0 sm:border-r border-white/10">
          <div className="px-4 py-4 flex flex-col gap-1">
            <div className="flex items-center gap-2 px-3 py-2 mb-2 text-gray-400 text-sm font-medium">
              <Settings size={18} />
              {t("settings.title")}
            </div>
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSection(item.id)}
                className={`flex items-center gap-3 px-3 py-3 min-h-[44px] rounded-lg text-left text-sm font-medium transition-colors ${
                  section === item.id ? "bg-white/10 text-white" : "text-gray-400 hover:bg-white/5 active:bg-white/10 text-white"
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </div>
        </aside>

        <main className="flex-1 bg-[#181818] overflow-y-auto min-h-screen">
          <div className="max-w-2xl w-full p-4 sm:p-6 md:p-8 pb-24 sm:pb-8">
            {section === "account" && (
              <>
                <h2 className="text-xl font-semibold text-white mb-6">Hesap bilgisi</h2>
                {user ? (
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-[#212121] border border-white/5">
                      <p className="text-gray-400 text-xs mb-2">Firebase UID</p>
                      <div className="flex items-center gap-2">
                        <code className="text-sm text-cyan-300 break-all flex-1">{user.uid}</code>
                        <button
                          type="button"
                          onClick={copyUid}
                          className="shrink-0 p-2 rounded-lg bg-white/10 hover:bg-white/15 transition-colors"
                          title="Kopyala"
                        >
                          {copied === "uid" ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
                        </button>
                      </div>
                    </div>
                    <p className="text-gray-500 text-xs">E-posta ve profil bilgileri Firebase Auth üzerinden yönetilir.</p>
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">Giriş yaparak hesap bilgilerinizi görüntüleyin.</p>
                )}
              </>
            )}

            {section === "language" && (
              <>
                <h2 className="text-xl font-semibold text-white mb-2">{t("settings.language")}</h2>
                <p className="text-gray-400 text-sm mb-4">{t("settings.languageDescription")}</p>
                <div className="relative mb-4">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
                  <input
                    type="text"
                    value={languageSearch}
                    onChange={(e) => setLanguageSearch(e.target.value)}
                    placeholder="Dil ara (örn. Türkçe, English...)"
                    className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-[#212121] border border-white/10 text-sm text-white placeholder-white/40 focus:outline-none focus:border-white/20"
                  />
                </div>
                <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-2">
                  <label className="flex items-center gap-3 p-3 rounded-lg bg-[#212121] hover:bg-[#2a2a2a] cursor-pointer border border-white/5">
                    <input type="radio" name="locale" checked={isAuto} onChange={() => handleLocaleChange(locale, true)} className="accent-red-500" />
                    <span className="text-sm text-white">{t("settings.autoLanguage")}</span>
                  </label>
                  {filteredLocales.map((loc) => (
                    <label
                      key={loc.code}
                      className="flex items-center gap-3 p-3 rounded-lg bg-[#212121] hover:bg-[#2a2a2a] cursor-pointer border border-white/5"
                    >
                      <input
                        type="radio"
                        name="locale"
                        checked={!isAuto && locale === loc.code}
                        onChange={() => handleLocaleChange(loc.code, false)}
                        className="accent-red-500"
                      />
                      <span className="text-sm text-white">{loc.native} ({loc.name})</span>
                    </label>
                  ))}
                  {filteredLocales.length === 0 && <p className="text-gray-500 text-sm py-4 text-center">Eşleşen dil yok</p>}
                </div>
              </>
            )}

            {section === "privacy" && (
              <>
                <h2 className="text-xl font-semibold text-white mb-2">Gizlilik ve silinme hakkı</h2>
                <p className="text-gray-400 text-sm mb-6">GDPR Madde 17 — Hesabınızı ve kişisel verilerinizi kalıcı olarak silebilirsiniz.</p>
                {user ? (
                  <div className="p-4 rounded-xl bg-[#212121] border border-red-500/20">
                    <p className="text-white/80 text-sm mb-3">
                      Bu işlem geri alınamaz. Kimlik bilgileriniz anonimleştirilir, içerikleriniz gizlenir. Mali kayıtlar hukuki süre boyunca saklanır.
                    </p>
                    <label className="flex items-center gap-2 mb-3 cursor-pointer">
                      <input type="checkbox" checked={rtbfConfirm} onChange={(e) => setRtbfConfirm(e.target.checked)} className="rounded border-red-500/50 bg-[#181818] text-red-500" />
                      <span className="text-sm text-white/80">Bu işlemi anladım ve onaylıyorum</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleRightToBeForgotten}
                      disabled={!rtbfConfirm || rtbfLoading}
                      className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {rtbfLoading ? "İşleniyor..." : "Hesabımı sil"}
                    </button>
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">Giriş yaparak silinme talebinde bulunabilirsiniz.</p>
                )}
              </>
            )}

            {section === "admin" && user && (
              <>
                <h2 className="text-xl font-semibold text-white mb-6">Admin ve UID</h2>
                <div className="space-y-6">
                  <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/30">
                    <p className="text-cyan-300 font-medium text-sm mb-2">Senin UID numaran</p>
                    <p className="text-white/60 text-xs mb-2">
                      Admin paneli için .env.local dosyasına <code className="bg-black/30 px-1 rounded">NEXT_PUBLIC_ADMIN_UIDS=</code> yazıp bu UID&apos;yi yapıştırın.
                    </p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <code className="text-sm text-cyan-200 break-all flex-1 min-w-0 font-mono">{user.uid}</code>
                      <button type="button" onClick={copyUid} className="shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg bg-cyan-500/30 hover:bg-cyan-500/50 text-cyan-200 transition-colors text-sm">
                        {copied === "uid" ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
                        {copied === "uid" ? "Kopyalandı!" : "UID kopyala"}
                      </button>
                      <button type="button" onClick={copyEnvLine} className="shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 transition-colors text-sm">
                        {copied === "env" ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
                        {copied === "env" ? "Kopyalandı!" : "Satırı kopyala"}
                      </button>
                    </div>
                  </div>
                  <div className={`p-4 rounded-xl border ${adminStatus ? "bg-green-500/10 border-green-500/30" : "bg-amber-500/10 border-amber-500/30"}`}>
                    {adminStatus ? (
                      <>
                        <p className="text-green-400 font-medium flex items-center gap-2">
                          <Shield size={18} /> Admin olarak tanınıyorsunuz
                        </p>
                        <p className="text-white/60 text-sm mt-1">Panel ve tüm admin yetkileri aktiftir.</p>
                        <Link href="/admin" className="inline-block mt-3 text-cyan-400 hover:underline text-sm">
                          Kontrol Kulesi →
                        </Link>
                      </>
                    ) : (
                      <>
                        <p className="text-amber-400 font-medium flex items-center gap-2">
                          <ShieldAlert size={18} /> Admin olarak tanınmıyorsunuz
                        </p>
                        <p className="text-white/70 text-sm mt-2">.env.local dosyasına UID&apos;inizi ekleyin. Satırı kopyalayıp yapıştırın, sunucuyu yeniden başlatın.</p>
                        <div className="mt-3 p-3 rounded-lg bg-[#181818] font-mono text-sm text-cyan-300 break-all">
                          NEXT_PUBLIC_ADMIN_UIDS={user.uid}
                        </div>
                        <button type="button" onClick={copyEnvLine} className="mt-3 flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/40 transition-colors text-sm">
                          {copied === "env" ? <Check size={16} /> : <Copy size={16} />}
                          {copied === "env" ? "Kopyalandı!" : "Satırı kopyala"}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </>
            )}

            {section === "admin" && !user && (
              <p className="text-gray-500 text-sm">Giriş yaparak admin bilgilerinizi görüntüleyin.</p>
            )}

            <Link href="/" className="inline-block mt-8 text-gray-400 hover:text-white text-sm">
              ← Ana sayfaya dön
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}
