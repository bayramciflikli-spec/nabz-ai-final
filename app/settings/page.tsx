"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, type User as AuthUser } from "firebase/auth";
import { Sidebar } from "@/components/Sidebar";
import { useLocale } from "@/components/LocaleProvider";
import { LOCALES, type Locale } from "@/lib/i18n/types";
import { Globe, User, Copy, Check, Shield, ShieldAlert, Trash2, Search } from "lucide-react";
import { isAdmin } from "@/lib/isAdmin";
import { useToast } from "@/components/ToastContext";
import { fetchWithAuth } from "@/lib/fetchWithAuth";

export default function SettingsPage() {
  const toast = useToast();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [copied, setCopied] = useState<"uid" | "env" | null>(null);
  const [rtbfLoading, setRtbfLoading] = useState(false);
  const [rtbfConfirm, setRtbfConfirm] = useState(false);
  const [languageSearch, setLanguageSearch] = useState("");
  const [languageSectionOpen, setLanguageSectionOpen] = useState(false);
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
    setLocale(l, auto); // auto=true -> re-detect; auto=false -> use l
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
      <main className="flex-1 sm:ml-56 flex flex-col p-8 max-w-2xl">
        <h1 className="text-3xl font-black mb-6">{t("settings.title")}</h1>

        {/* Admin Durumu */}
        {user && (
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <Shield size={20} className={adminStatus ? "text-green-400" : "text-amber-400"} />
              <h2 className="text-lg font-bold">Admin Durumu</h2>
            </div>
            <div className={`p-4 rounded-xl border ${adminStatus ? "bg-green-500/10 border-green-500/40" : "bg-amber-500/10 border-amber-500/40"}`}>
              {adminStatus ? (
                <>
                  <p className="text-green-400 font-semibold flex items-center gap-2">
                    <Shield size={18} /> Admin olarak tanınıyorsunuz
                  </p>
                  <p className="text-white/60 text-sm mt-1">Panel, onay bypass ve tüm admin yetkileri aktiftir.</p>
                  <Link href="/admin" className="inline-block mt-3 text-cyan-400 hover:underline text-sm">
                    Kontrol Kulesi →
                  </Link>
                </>
              ) : (
                <>
                  <p className="text-amber-400 font-semibold flex items-center gap-2">
                    <ShieldAlert size={18} /> Admin olarak tanınmıyorsunuz
                  </p>
                  <p className="text-white/70 text-sm mt-2">
                    Sizi admin yapmak için .env.local dosyasına UID&apos;inizi ekleyin. Aşağıdaki satırı kopyalayıp .env.local&apos;e yapıştırın (veya mevcut NEXT_PUBLIC_ADMIN_UIDS satırını güncelleyin):
                  </p>
                  <div className="mt-3 p-3 rounded-lg bg-black/30 font-mono text-sm text-cyan-300 break-all">
                    NEXT_PUBLIC_ADMIN_UIDS={user.uid}
                  </div>
                  <button
                    type="button"
                    onClick={copyEnvLine}
                    className="mt-3 flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/40 transition-colors"
                  >
                    {copied === "env" ? <Check size={16} /> : <Copy size={16} />}
                    {copied === "env" ? "Kopyalandı!" : "Satırı Kopyala"}
                  </button>
                  <p className="text-white/50 text-xs mt-3">
                    Kopyaladıktan sonra .env.local dosyasını kaydedin ve sunucuyu yeniden başlatın (npm run dev).
                  </p>
                </>
              )}
            </div>
          </section>
        )}

        {/* Hesap / UID */}
        {user && (
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <User size={20} className="text-cyan-400" />
              <h2 className="text-lg font-bold">Hesap bilgisi</h2>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <p className="text-gray-400 text-xs mb-2">Firebase UID</p>
              <div className="flex items-center gap-2">
                <code className="text-sm text-cyan-300 break-all flex-1">{user.uid}</code>
                <button
                  type="button"
                  onClick={copyUid}
                  className="shrink-0 p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                  title="Kopyala"
                >
                  {copied === "uid" ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
                </button>
              </div>
            </div>
          </section>
        )}

        {/* GDPR Silinme Hakkı */}
        {user && (
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <Trash2 size={20} className="text-red-400" />
              <h2 className="text-lg font-bold">Silinme Hakkı (GDPR Madde 17)</h2>
            </div>
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30">
              <p className="text-white/80 text-sm mb-3">
                Hesabınızı ve kişisel verilerinizi kalıcı olarak silebilirsiniz. Bu işlem geri alınamaz.
                Kimlik bilgileriniz anonimleştirilir, içerikleriniz gizlenir. Mali kayıtlar hukuki süre boyunca saklanır.
              </p>
              <label className="flex items-center gap-2 mb-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rtbfConfirm}
                  onChange={(e) => setRtbfConfirm(e.target.checked)}
                  className="rounded border-red-500/50 bg-black/40 text-red-500"
                />
                <span className="text-sm text-white/80">Bu işlemi anladım ve onaylıyorum</span>
              </label>
              <button
                type="button"
                onClick={handleRightToBeForgotten}
                disabled={!rtbfConfirm || rtbfLoading}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {rtbfLoading ? "İşleniyor..." : "Hesabımı Sil"}
              </button>
            </div>
          </section>
        )}

        {/* Dil seçimi – başlığa tıklanınca arama çubuğu açılır, tüm diller listelenir */}
        <section className="mb-8">
          <button
            type="button"
            onClick={() => setLanguageSectionOpen((o) => !o)}
            className="flex items-center gap-2 mb-3 w-full text-left"
          >
            <Globe size={20} className="text-cyan-400 shrink-0" />
            <h2 className="text-lg font-bold">{t("settings.language")}</h2>
          </button>
          {languageSectionOpen && (
            <>
              <p className="text-gray-400 text-sm mb-3">{t("settings.languageDescription")}</p>
              <div className="relative mb-3">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
                <input
                  type="text"
                  value={languageSearch}
                  onChange={(e) => setLanguageSearch(e.target.value)}
                  placeholder="Dil ara (örn. Türkçe, English...)"
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder-white/40 focus:outline-none focus:border-cyan-500/50"
                />
              </div>
              <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-2">
                <label className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 cursor-pointer border border-white/10">
                  <input
                    type="radio"
                    name="locale"
                    checked={isAuto}
                    onChange={() => handleLocaleChange(locale, true)}
                    className="accent-cyan-500"
                  />
                  <span>{t("settings.autoLanguage")}</span>
                </label>
                {filteredLocales.map((loc) => (
                  <label
                    key={loc.code}
                    className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 cursor-pointer border border-white/10"
                  >
                    <input
                      type="radio"
                      name="locale"
                      checked={!isAuto && locale === loc.code}
                      onChange={() => handleLocaleChange(loc.code, false)}
                      className="accent-cyan-500"
                    />
                    <span>
                      {loc.native} ({loc.name})
                    </span>
                  </label>
                ))}
                {filteredLocales.length === 0 && (
                  <p className="text-white/50 text-sm py-4 text-center">Eşleşen dil yok</p>
                )}
              </div>
            </>
          )}
        </section>

        <Link href="/" className="text-cyan-400 hover:underline">
          {t("settings.backToHome")}
        </Link>
      </main>
    </div>
  );
}
