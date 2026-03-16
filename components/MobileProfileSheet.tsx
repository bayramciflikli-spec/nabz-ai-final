"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { auth, db } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { collection, query, where, getCountFromServer } from "firebase/firestore";
import {
  User,
  LogIn,
  LogOut,
  UserPlus,
  Settings,
  FileText,
  Shield,
  Megaphone,
  Copyright,
  Globe,
  Upload,
  LayoutGrid,
  HelpCircle,
  Send,
  ShieldCheck,
  X,
  ChevronDown,
  ChevronRight,
  Copy,
  Check,
  Trash2,
  Search,
} from "lucide-react";
import type { User as FirebaseUser } from "firebase/auth";
import { useAuth } from "@/components/AuthProvider";
import { useLocale } from "@/components/LocaleProvider";
import { useCountry } from "@/components/CountryProvider";
import { useToast } from "@/components/ToastContext";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { LOCALES } from "@/lib/i18n/types";
import { isPlatformSubscribed } from "@/lib/subscription";
import { getUserAccess } from "@/lib/userAccess";
import { isAdmin } from "@/lib/isAdmin";

interface MobileProfileSheetProps {
  open: boolean;
  onClose: () => void;
  user: FirebaseUser | null;
}

export function MobileProfileSheet({ open, onClose, user }: MobileProfileSheetProps) {
  const { setShowLoginModal } = useAuth();
  const { t, locale, setLocale, isAuto } = useLocale();
  const { countryRule } = useCountry();
  const [subscribed, setSubscribed] = useState<boolean | null>(null);
  const [projectCount, setProjectCount] = useState<number | null>(null);
  const [canUpload, setCanUpload] = useState(true);
  const [openSection, setOpenSection] = useState<string | null>("account");
  const [copiedUid, setCopiedUid] = useState(false);
  const [rtbfConfirm, setRtbfConfirm] = useState(false);
  const [rtbfLoading, setRtbfLoading] = useState(false);
  const [languageSearch, setLanguageSearch] = useState("");
  const toast = useToast();

  const filteredLocales = !languageSearch.trim()
    ? LOCALES
    : LOCALES.filter(
        (loc) =>
          loc.native.toLowerCase().includes(languageSearch.toLowerCase()) ||
          loc.name.toLowerCase().includes(languageSearch.toLowerCase()) ||
          loc.code.toLowerCase().includes(languageSearch.toLowerCase())
      );

  useEffect(() => {
    if (!user?.uid) {
      setSubscribed(null);
      setProjectCount(null);
      return;
    }
    const load = async () => {
      try {
        const [subOk, count, access] = await Promise.all([
          isPlatformSubscribed(user.uid),
          (async () => {
            const q = query(collection(db, "projects"), where("authorId", "==", user.uid));
            const snap = await getCountFromServer(q);
            return snap.data().count;
          })(),
          getUserAccess(user.uid),
        ]);
        setSubscribed(subOk);
        setProjectCount(count);
        setCanUpload(access.canUpload);
      } catch {
        setSubscribed(false);
        setProjectCount(0);
        setCanUpload(false);
      }
    };
    load();
  }, [user?.uid]);

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  const closeAnd = (fn: () => void) => () => {
    onClose();
    fn();
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/70 z-[9998] lg:hidden"
        onClick={onClose}
        onKeyDown={(e) => e.key === "Escape" && onClose()}
        aria-hidden
      />
      <div
        className="fixed inset-x-0 bottom-0 top-[20%] z-[9999] bg-slate-900 border-t border-white/10 rounded-t-2xl flex flex-col overflow-hidden lg:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-white/10">
          <h2 className="text-lg font-bold text-white">
            {user ? (user.displayName || t("user.user")) : t("user.signInOrSubscribe")}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-white/80"
            aria-label="Kapat"
          >
            <X size={22} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-2">
          {user ? (
            <>
              {isAdmin(user.uid) && (
                <div className="px-4 pb-3 mb-1 border-b border-amber-500/20">
                  <Link href="/admin" onClick={onClose} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 transition-colors">
                    <ShieldCheck size={22} className="shrink-0" />
                    <span className="font-semibold">Kontrol Kulesi</span>
                  </Link>
                </div>
              )}
              {/* Hesabım – açılır kapanır */}
              <div className="border-b border-white/10">
                <button
                  type="button"
                  onClick={() => setOpenSection(openSection === "account" ? null : "account")}
                  className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-white/5"
                >
                  <span className="font-semibold text-white">Hesabım</span>
                  {openSection === "account" ? <ChevronDown size={20} className="text-white/60" /> : <ChevronRight size={20} className="text-white/60" />}
                </button>
                {openSection === "account" && (
                  <div className="px-4 pb-3 pt-0">
                    <div className="flex items-center gap-3 py-2">
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-white/10 shrink-0 flex items-center justify-center">
                        {user.photoURL ? (
                          <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-lg font-bold text-white">{(user.displayName || user.email || "U")[0].toUpperCase()}</span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-white truncate">{user.displayName || t("user.user")}</p>
                        {user.email && <p className="text-xs text-white/50 truncate">{user.email}</p>}
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {subscribed === true && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/40">{t("user.subscribed")}</span>
                          )}
                          {(projectCount ?? 0) > 0 && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">Creator</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* İçerik & Kanal – açılır kapanır */}
              <div className="border-b border-white/10">
                <button
                  type="button"
                  onClick={() => setOpenSection(openSection === "content" ? null : "content")}
                  className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-white/5"
                >
                  <span className="font-semibold text-white">İçerik & Kanal</span>
                  {openSection === "content" ? <ChevronDown size={20} className="text-white/60" /> : <ChevronRight size={20} className="text-white/60" />}
                </button>
                {openSection === "content" && (
                  <div className="pb-2">
                    {canUpload && (
                      <Link href="/upload" onClick={onClose} className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-white/10">
                        <Upload size={18} className="text-white/60 shrink-0" />
                        {t("user.uploadContent")}
                      </Link>
                    )}
                    <Link href="/dashboard" onClick={onClose} className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-white/10">
                      <LayoutGrid size={18} className="text-white/60 shrink-0" />
                      {t("user.dashboard")}
                    </Link>
                    {isAdmin(user.uid) && (
                      <Link href="/admin" onClick={onClose} className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-white/10 text-amber-400">
                        <ShieldCheck size={18} className="shrink-0" />
                        {t("user.adminPanel")}
                      </Link>
                    )}
                    <Link href={`/channel/${user.uid}`} onClick={onClose} className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-white/10">
                      <User size={18} className="text-white/60 shrink-0" />
                      {t("user.myChannel")}
                    </Link>
                    <Link href="/subscriptions" onClick={onClose} className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-white/10">
                      <UserPlus size={18} className="text-white/60 shrink-0" />
                      {t("user.subscriptions")}
                    </Link>
                  </div>
                )}
              </div>

              {/* Ayarlar – açılır kapanır: dil, hesap bilgisi, silinme hakkı (admin yok) */}
              <div className="border-b border-white/10">
                <button
                  type="button"
                  onClick={() => setOpenSection(openSection === "settings" ? null : "settings")}
                  className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-white/5"
                >
                  <span className="font-semibold text-white">Ayarlar</span>
                  {openSection === "settings" ? <ChevronDown size={20} className="text-white/60" /> : <ChevronRight size={20} className="text-white/60" />}
                </button>
                {openSection === "settings" && (
                  <div className="pb-2 space-y-3">
                    <Link href="/settings" onClick={onClose} className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-white/10">
                      <Settings size={18} className="text-white/60 shrink-0" />
                      {t("nav.settings")}
                    </Link>
                    {user && (
                      <>
                        <div className="px-4">
                          <p className="text-[10px] font-bold text-white/50 uppercase tracking-wider mb-1.5">Hesap bilgisi</p>
                          <div className="flex items-center gap-2">
                            <code className="text-xs text-cyan-300 break-all flex-1 truncate">{user.uid}</code>
                            <button
                              type="button"
                              onClick={() => {
                                if (user.uid) {
                                  navigator.clipboard.writeText(user.uid);
                                  setCopiedUid(true);
                                  setTimeout(() => setCopiedUid(false), 2000);
                                  toast.success("UID kopyalandı");
                                }
                              }}
                              className="shrink-0 p-1.5 rounded-lg bg-white/10 hover:bg-white/20"
                              title="Kopyala"
                            >
                              {copiedUid ? <Check size={14} className="text-green-400" /> : <Copy size={14} className="text-white/60" />}
                            </button>
                          </div>
                        </div>
                        <div className="px-4">
                          <p className="text-[10px] font-bold text-white/50 uppercase tracking-wider mb-1.5">Silinme hakkı (GDPR)</p>
                          <p className="text-xs text-white/60 mb-2">Hesabınızı ve kişisel verilerinizi kalıcı silebilirsiniz.</p>
                          <label className="flex items-center gap-2 mb-2 cursor-pointer">
                            <input type="checkbox" checked={rtbfConfirm} onChange={(e) => setRtbfConfirm(e.target.checked)} className="rounded border-red-500/50 bg-black/40 text-red-500 accent-red-500" />
                            <span className="text-xs text-white/70">Anladım ve onaylıyorum</span>
                          </label>
                          <button
                            type="button"
                            disabled={!rtbfConfirm || rtbfLoading}
                            onClick={async () => {
                              if (!rtbfConfirm || !user) return;
                              setRtbfLoading(true);
                              try {
                                const res = await fetchWithAuth("/api/right-to-be-forgotten", { method: "POST", body: JSON.stringify({}) });
                                const data = await res.json();
                                if (data.ok) {
                                  toast.success("Hesabınız anonimleştirildi. Çıkış yapılıyor.");
                                  onClose();
                                  auth.signOut();
                                  window.location.href = "/";
                                } else {
                                  toast.error(data.error || "İşlem başarısız");
                                }
                              } catch (e) {
                                toast.error(e instanceof Error ? e.message : "İşlem başarısız");
                              } finally {
                                setRtbfLoading(false);
                              }
                            }}
                            className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {rtbfLoading ? "İşleniyor..." : "Hesabımı sil"}
                          </button>
                        </div>
                      </>
                    )}
                    <div className="px-4">
                      <p className="text-[10px] font-bold text-white/50 uppercase tracking-wider mb-1.5">{t("settings.language")}</p>
                      <div className="relative mb-2">
                        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
                        <input
                          type="text"
                          value={languageSearch}
                          onChange={(e) => setLanguageSearch(e.target.value)}
                          placeholder="Dil ara..."
                          className="w-full pl-8 pr-2 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white placeholder-white/40 focus:outline-none focus:border-cyan-500/50"
                        />
                      </div>
                      <label className="flex items-center gap-3 py-2 text-sm hover:bg-white/10 cursor-pointer rounded-lg px-2">
                        <input type="radio" name="sheet-locale" checked={isAuto} onChange={() => setLocale(locale, true)} className="accent-cyan-500" />
                        <Globe size={16} className="text-white/60" />
                        {t("settings.autoLanguage")}
                      </label>
                      <div className="max-h-[40vh] overflow-y-auto">
                        {filteredLocales.map((loc) => (
                          <label key={loc.code} className="flex items-center gap-3 py-2 text-sm hover:bg-white/10 cursor-pointer rounded-lg px-2">
                            <input type="radio" name="sheet-locale" checked={!isAuto && locale === loc.code} onChange={() => setLocale(loc.code, false)} className="accent-cyan-500" />
                            <span>{loc.native} ({loc.name})</span>
                          </label>
                        ))}
                        {filteredLocales.length === 0 && <p className="text-white/50 text-xs py-2">Eşleşen dil yok</p>}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Yardım & Yasal – açılır kapanır */}
              <div className="border-b border-white/10">
                <button
                  type="button"
                  onClick={() => setOpenSection(openSection === "help" ? null : "help")}
                  className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-white/5"
                >
                  <span className="font-semibold text-white">Yardım & Yasal</span>
                  {openSection === "help" ? <ChevronDown size={20} className="text-white/60" /> : <ChevronRight size={20} className="text-white/60" />}
                </button>
                {openSection === "help" && (
                  <div className="pb-2">
                    <Link href="/help" onClick={onClose} className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-white/10">
                      <HelpCircle size={18} className="text-white/60 shrink-0" />
                      {t("user.help")}
                    </Link>
                    <Link href="/feedback" onClick={onClose} className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-white/10">
                      <Send size={18} className="text-white/60 shrink-0" />
                      {t("user.feedback")}
                    </Link>
                    <Link href="/settings" onClick={onClose} className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-white/10 text-cyan-400">
                      <Globe size={18} className="shrink-0" />
                      {t("footer.settings")} →
                    </Link>
                    <Link href="/yasal/kullanim-sartlari" onClick={onClose} className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-white/10">
                      <FileText size={18} className="text-white/60 shrink-0" />
                      {t("footer.terms")}
                    </Link>
                    <Link href={countryRule.legalPath} onClick={onClose} className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-white/10">
                      <Shield size={18} className="text-white/60 shrink-0" />
                      {countryRule.legalLabel}
                    </Link>
                    <Link href="/yasal/reklam-politikasi" onClick={onClose} className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-white/10">
                      <Megaphone size={18} className="text-white/60 shrink-0" />
                      {t("footer.adPolicy")}
                    </Link>
                    <Link href="/yasal/fikri-mulkiyet" onClick={onClose} className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-white/10">
                      <Copyright size={18} className="text-white/60 shrink-0" />
                      {t("footer.ipRights")}
                    </Link>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={closeAnd(() => signOut(auth))}
                className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-white/10 w-full text-left text-red-400 mt-1"
              >
                <LogOut size={20} className="shrink-0" />
                {t("user.signOut")}
              </button>
            </>
          ) : (
            <>
              {/* Giriş – açılır kapanır */}
              <div className="border-b border-white/10">
                <button
                  type="button"
                  onClick={() => setOpenSection(openSection === "login" ? null : "login")}
                  className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-white/5"
                >
                  <span className="font-semibold text-white">Giriş</span>
                  {openSection === "login" ? <ChevronDown size={20} className="text-white/60" /> : <ChevronRight size={20} className="text-white/60" />}
                </button>
                {openSection === "login" && (
                  <div className="px-4 pb-3 pt-0">
                    <p className="text-xs text-white/50 mb-2">İçerik paylaşmak veya yorum eklemek için giriş yapın.</p>
                    <button
                      type="button"
                      onClick={closeAnd(() => setShowLoginModal(true))}
                      className="flex items-center gap-3 px-0 py-2.5 text-sm hover:opacity-90 w-full text-left"
                    >
                      <LogIn size={18} className="text-white/60 shrink-0" />
                      {t("user.signInOrSignUp")}
                    </button>
                    <Link href="/abone-ol" onClick={onClose} className="flex items-center gap-3 px-0 py-2.5 text-sm hover:opacity-90">
                      <UserPlus size={18} className="text-white/60 shrink-0" />
                      {t("user.subscribe")}
                    </Link>
                  </div>
                )}
              </div>

              {/* Ayarlar (giriş yapmamış) */}
              <div className="border-b border-white/10">
                <button
                  type="button"
                  onClick={() => setOpenSection(openSection === "settings" ? null : "settings")}
                  className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-white/5"
                >
                  <span className="font-semibold text-white">Ayarlar</span>
                  {openSection === "settings" ? <ChevronDown size={20} className="text-white/60" /> : <ChevronRight size={20} className="text-white/60" />}
                </button>
                {openSection === "settings" && (
                  <div className="pb-2">
                    <div className="px-4">
                      <p className="text-[10px] font-bold text-white/50 uppercase tracking-wider mb-1.5">{t("settings.language")}</p>
                      <div className="relative mb-2">
                        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
                        <input
                          type="text"
                          value={languageSearch}
                          onChange={(e) => setLanguageSearch(e.target.value)}
                          placeholder="Dil ara..."
                          className="w-full pl-8 pr-2 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white placeholder-white/40 focus:outline-none focus:border-cyan-500/50"
                        />
                      </div>
                      <label className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-white/10 cursor-pointer">
                        <input type="radio" name="sheet-locale-out" checked={isAuto} onChange={() => setLocale(locale, true)} className="accent-cyan-500" />
                        <Globe size={16} className="text-white/60" />
                        {t("settings.autoLanguage")}
                      </label>
                      <div className="max-h-[40vh] overflow-y-auto">
                        {filteredLocales.map((loc) => (
                          <label key={loc.code} className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-white/10 cursor-pointer">
                            <input type="radio" name="sheet-locale-out" checked={!isAuto && locale === loc.code} onChange={() => setLocale(loc.code, false)} className="accent-cyan-500" />
                            <span>{loc.native} ({loc.name})</span>
                          </label>
                        ))}
                        {filteredLocales.length === 0 && <p className="text-white/50 text-xs py-2 px-4">Eşleşen dil yok</p>}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Yardım & Yasal (giriş yapmamış) */}
              <div className="border-b border-white/10">
                <button
                  type="button"
                  onClick={() => setOpenSection(openSection === "help" ? null : "help")}
                  className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-white/5"
                >
                  <span className="font-semibold text-white">Yardım & Yasal</span>
                  {openSection === "help" ? <ChevronDown size={20} className="text-white/60" /> : <ChevronRight size={20} className="text-white/60" />}
                </button>
                {openSection === "help" && (
                  <div className="pb-2">
                    <Link href="/help" onClick={onClose} className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-white/10">
                      <HelpCircle size={18} className="text-white/60 shrink-0" />
                      {t("user.help")}
                    </Link>
                    <Link href="/feedback" onClick={onClose} className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-white/10">
                      <Send size={18} className="text-white/60 shrink-0" />
                      {t("user.feedback")}
                    </Link>
                    <Link href="/yasal/kullanim-sartlari" onClick={onClose} className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-white/10">
                      <FileText size={18} className="text-white/60 shrink-0" />
                      {t("footer.terms")}
                    </Link>
                    <Link href={countryRule.legalPath} onClick={onClose} className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-white/10">
                      <Shield size={18} className="text-white/60 shrink-0" />
                      {countryRule.legalLabel}
                    </Link>
                    <Link href="/yasal/reklam-politikasi" onClick={onClose} className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-white/10">
                      <Megaphone size={18} className="text-white/60 shrink-0" />
                      {t("footer.adPolicy")}
                    </Link>
                    <Link href="/yasal/fikri-mulkiyet" onClick={onClose} className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-white/10">
                      <Copyright size={18} className="text-white/60 shrink-0" />
                      {t("footer.ipRights")}
                    </Link>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
