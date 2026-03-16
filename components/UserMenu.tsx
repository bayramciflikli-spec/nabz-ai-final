"use client";

import { useState, useRef, useEffect } from "react";
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
  Pencil,
  HelpCircle,
  Send,
  CheckCircle,
  AlertCircle,
  ShieldCheck,
  ChevronDown,
  ChevronRight,
  Copy,
  Check,
  Trash2,
  Search,
} from "lucide-react";
import { useAuth } from "./AuthProvider";
import { useLocale } from "./LocaleProvider";
import { useToast } from "./ToastContext";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { LOCALES } from "@/lib/i18n/types";
import { isPlatformSubscribed } from "@/lib/subscription";
import { getUserAccess } from "@/lib/userAccess";
import { useCountry } from "@/components/CountryProvider";
import { isAdmin } from "@/lib/isAdmin";

interface UserMenuProps {
  user: { photoURL?: string | null; displayName?: string | null; uid?: string; email?: string | null } | null;
}

export function UserMenu({ user }: UserMenuProps) {
  const { setShowLoginModal } = useAuth();
  const { t, locale, setLocale, isAuto } = useLocale();
  const { countryRule } = useCountry();
  const [open, setOpen] = useState(false);
  const [openSection, setOpenSection] = useState<string | null>("account");
  const [copiedUid, setCopiedUid] = useState(false);
  const [rtbfConfirm, setRtbfConfirm] = useState(false);
  const [rtbfLoading, setRtbfLoading] = useState(false);
  const [languageSearch, setLanguageSearch] = useState("");
  const toast = useToast();
  const menuRef = useRef<HTMLDivElement>(null);

  const filteredLocales = !languageSearch.trim()
    ? LOCALES
    : LOCALES.filter(
        (loc) =>
          loc.native.toLowerCase().includes(languageSearch.toLowerCase()) ||
          loc.name.toLowerCase().includes(languageSearch.toLowerCase()) ||
          loc.code.toLowerCase().includes(languageSearch.toLowerCase())
      );
  const [subscribed, setSubscribed] = useState<boolean | null>(null);
  const [projectCount, setProjectCount] = useState<number | null>(null);
  const [canUpload, setCanUpload] = useState<boolean>(true);

  useEffect(() => {
    const hide = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("click", hide);
    return () => document.removeEventListener("click", hide);
  }, []);

  useEffect(() => {
    const uid = user?.uid;
    if (!uid) {
      setSubscribed(null);
      setProjectCount(null);
      setCanUpload(true);
      return;
    }
    const load = async () => {
      try {
        const [subOk, count, access] = await Promise.all([
          isPlatformSubscribed(uid),
          (async () => {
            const q = query(collection(db, "projects"), where("authorId", "==", uid));
            const snap = await getCountFromServer(q);
            return snap.data().count;
          })(),
          getUserAccess(uid),
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

  return (
    <div ref={menuRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full shrink-0 overflow-hidden flex items-center justify-center border transition-all duration-200 ${
          open
            ? "bg-red-500/20 border-red-400 shadow-[0_0_0_1px_rgba(248,113,113,0.6)]"
            : "bg-white/5 border-red-500/50 hover:bg-white/10 hover:border-red-500/70"
        }`}
        aria-label={user ? t("user.menu") : t("user.login")}
        aria-expanded={open}
      >
        {user?.photoURL ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={user.photoURL}
            alt={user.displayName || "Kullanıcı"}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-sm font-bold text-white flex items-center justify-center">
            {user ? (user.displayName || user.email || "U")[0].toUpperCase() : <User size={18} className="text-white/80" />}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-2 py-2 w-72 max-w-[calc(100vw-2rem)] max-h-[calc(100vh-6rem)] overflow-y-auto bg-black/95 border border-white/15 rounded-2xl shadow-2xl z-50 overflow-x-hidden animate-in fade-in zoom-in-95 duration-150 origin-top-right">
          {user ? (
            <>
              <div className="border-b border-white/10">
                <button type="button" onClick={() => setOpenSection(openSection === "account" ? null : "account")} className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-white/5">
                  <span className="font-semibold text-sm text-white">Hesabım</span>
                  {openSection === "account" ? <ChevronDown size={18} className="text-white/60" /> : <ChevronRight size={18} className="text-white/60" />}
                </button>
                {openSection === "account" && (
                  <div className="px-4 pb-3 pt-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <p className="font-semibold text-sm truncate">{user.displayName || t("user.user")}</p>
                      {subscribed === true && (
                        <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/40">{t("user.subscribed")}</span>
                      )}
                      {(projectCount ?? 0) > 0 && (
                        <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">Creator</span>
                      )}
                    </div>
                    {user.email && <p className="text-xs text-white/50 truncate" title={user.email}>{user.email}</p>}
                    <p className="text-xs text-white/40 mt-0.5">{t("user.signedIn")}</p>
                    {subscribed === false && (
                      <div className="mt-2 flex items-center gap-2 text-amber-400/90 text-xs">
                        <AlertCircle size={14} />
                        <span>{t("user.notSubscribed")}</span>
                        <Link href="/abone-ol" onClick={() => setOpen(false)} className="text-cyan-400 hover:underline shrink-0">→</Link>
                      </div>
                    )}
                    {subscribed === true && (
                      <div className="mt-2 flex items-center gap-2 text-green-400/90 text-xs">
                        <CheckCircle size={14} />
                        <span>{t("user.subscribed")}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="border-b border-white/10">
                <button type="button" onClick={() => setOpenSection(openSection === "content" ? null : "content")} className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-white/5">
                  <span className="font-semibold text-sm text-white">İçerik & Kanal</span>
                  {openSection === "content" ? <ChevronDown size={18} className="text-white/60" /> : <ChevronRight size={18} className="text-white/60" />}
                </button>
                {openSection === "content" && (
                  <div className="pb-1">
                    {canUpload && (
                      <Link href="/upload" onClick={() => setOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-white/10">
                        <Upload size={18} className="text-white/60" />
                        {t("user.uploadContent")}
                      </Link>
                    )}
                    <Link href="/dashboard" onClick={() => setOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-white/10">
                      <LayoutGrid size={18} className="text-white/60" />
                      {t("user.dashboard")}
                    </Link>
                    {isAdmin(user?.uid) && (
                      <Link href="/admin" onClick={() => setOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-white/10 text-amber-400">
                        <ShieldCheck size={18} className="text-amber-400/80" />
                        {t("user.adminPanel")}
                      </Link>
                    )}
                    <Link href={`/channel/${user.uid}`} onClick={() => setOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-white/10">
                      <User size={18} className="text-white/60" />
                      {t("user.myChannel")}
                    </Link>
                    <Link href={`/channel/${user.uid}`} onClick={() => setOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-white/10">
                      <Pencil size={18} className="text-white/60" />
                      {t("user.editProfile")}
                    </Link>
                    <Link href="/subscriptions" onClick={() => setOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-white/10">
                      <UserPlus size={18} className="text-white/60" />
                      {t("user.subscriptions")}
                    </Link>
                  </div>
                )}
              </div>

              <div className="border-b border-white/10">
                <button type="button" onClick={() => setOpenSection(openSection === "settings" ? null : "settings")} className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-white/5">
                  <span className="font-semibold text-sm text-white">Ayarlar</span>
                  {openSection === "settings" ? <ChevronDown size={18} className="text-white/60" /> : <ChevronRight size={18} className="text-white/60" />}
                </button>
                {openSection === "settings" && (
                  <div className="pb-1 space-y-2">
                    <Link href="/settings" onClick={() => setOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-white/10">
                      <Settings size={18} className="text-white/60" />
                      {t("nav.settings")}
                    </Link>
                    {user?.uid && (
                      <>
                        <div className="px-4">
                          <p className="text-[10px] font-bold text-white/50 uppercase tracking-wider mb-1">Hesap bilgisi</p>
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
                          <p className="text-[10px] font-bold text-white/50 uppercase tracking-wider mb-1">Silinme hakkı (GDPR)</p>
                          <p className="text-xs text-white/60 mb-1.5">Hesabınızı kalıcı silebilirsiniz.</p>
                          <label className="flex items-center gap-2 mb-1.5 cursor-pointer">
                            <input type="checkbox" checked={rtbfConfirm} onChange={(e) => setRtbfConfirm(e.target.checked)} className="rounded border-red-500/50 accent-red-500" />
                            <span className="text-xs text-white/70">Anladım ve onaylıyorum</span>
                          </label>
                          <button
                            type="button"
                            disabled={!rtbfConfirm || rtbfLoading}
                            onClick={async () => {
                              if (!rtbfConfirm || !user?.uid) return;
                              setRtbfLoading(true);
                              try {
                                const res = await fetchWithAuth("/api/right-to-be-forgotten", { method: "POST", body: JSON.stringify({}) });
                                const data = await res.json();
                                if (data.ok) {
                                  toast.success("Hesabınız anonimleştirildi. Çıkış yapılıyor.");
                                  setOpen(false);
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
                      <p className="text-[10px] font-bold text-white/50 uppercase tracking-wider mb-1">{t("settings.language")}</p>
                      <div className="relative mb-1.5">
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
                        <input type="radio" name="menu-locale" checked={isAuto} onChange={() => setLocale(locale, true)} className="accent-cyan-500" />
                        <Globe size={16} className="text-white/60" />
                        {t("settings.autoLanguage")}
                      </label>
                      <div className="max-h-[35vh] overflow-y-auto">
                        {filteredLocales.map((loc) => (
                          <label key={loc.code} className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-white/10 cursor-pointer">
                            <input type="radio" name="menu-locale" checked={!isAuto && locale === loc.code} onChange={() => setLocale(loc.code, false)} className="accent-cyan-500" />
                            <span>{loc.native} ({loc.name})</span>
                          </label>
                        ))}
                        {filteredLocales.length === 0 && <p className="text-white/50 text-xs py-2 px-4">Eşleşen dil yok</p>}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="border-b border-white/10">
                <button type="button" onClick={() => setOpenSection(openSection === "help" ? null : "help")} className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-white/5">
                  <span className="font-semibold text-sm text-white">Yardım & Yasal</span>
                  {openSection === "help" ? <ChevronDown size={18} className="text-white/60" /> : <ChevronRight size={18} className="text-white/60" />}
                </button>
                {openSection === "help" && (
                  <div className="pb-1">
                    <Link href="/help" onClick={() => setOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-white/10">
                      <HelpCircle size={18} className="text-white/60" />
                      {t("user.help")}
                    </Link>
                    <Link href="/feedback" onClick={() => setOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-white/10">
                      <Send size={18} className="text-white/60" />
                      {t("user.feedback")}
                    </Link>
                    <Link href="/settings" onClick={() => setOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-white/10 text-cyan-400">
                      <Globe size={18} className="text-white/60" />
                      {t("footer.settings")} →
                    </Link>
                    <Link href="/yasal/kullanim-sartlari" onClick={() => setOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-white/10">
                      <FileText size={18} className="text-white/60" />
                      {t("footer.terms")}
                    </Link>
                    <Link href={countryRule.legalPath} onClick={() => setOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-white/10">
                      <Shield size={18} className="text-white/60" />
                      {countryRule.legalLabel}
                    </Link>
                    <Link href="/yasal/reklam-politikasi" onClick={() => setOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-white/10">
                      <Megaphone size={18} className="text-white/60" />
                      {t("footer.adPolicy")}
                    </Link>
                    <Link href="/yasal/fikri-mulkiyet" onClick={() => setOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-white/10">
                      <Copyright size={18} className="text-white/60" />
                      {t("footer.ipRights")}
                    </Link>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => { signOut(auth); setOpen(false); }}
                className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-white/10 w-full text-left text-red-400 mt-1"
              >
                <LogOut size={18} />
                {t("user.signOut")}
              </button>
            </>
          ) : (
            <>
              <div className="border-b border-white/10">
                <button type="button" onClick={() => setOpenSection(openSection === "login" ? null : "login")} className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-white/5">
                  <span className="font-semibold text-sm text-white">Giriş</span>
                  {openSection === "login" ? <ChevronDown size={18} className="text-white/60" /> : <ChevronRight size={18} className="text-white/60" />}
                </button>
                {openSection === "login" && (
                  <div className="px-4 pb-3 pt-0">
                    <p className="text-xs text-white/50 mb-2">İçerik paylaşmak veya yorum eklemek için giriş yapın.</p>
                    <button type="button" onClick={() => { setShowLoginModal(true); setOpen(false); }} className="flex items-center gap-3 px-0 py-2 text-sm hover:opacity-90 w-full text-left">
                      <LogIn size={18} className="text-white/60" />
                      {t("user.signInOrSignUp")}
                    </button>
                    <Link href="/abone-ol" onClick={() => setOpen(false)} className="flex items-center gap-3 px-0 py-2 text-sm hover:opacity-90">
                      <UserPlus size={18} className="text-white/60" />
                      {t("user.subscribe")}
                    </Link>
                  </div>
                )}
              </div>
              <div className="border-b border-white/10">
                <button type="button" onClick={() => setOpenSection(openSection === "settings" ? null : "settings")} className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-white/5">
                  <span className="font-semibold text-sm text-white">Ayarlar</span>
                  {openSection === "settings" ? <ChevronDown size={18} className="text-white/60" /> : <ChevronRight size={18} className="text-white/60" />}
                </button>
                {openSection === "settings" && (
                  <div className="pb-1">
                    <div className="px-4">
                      <p className="text-[10px] font-bold text-white/60 uppercase tracking-wider mb-1">{t("settings.language")}</p>
                      <div className="relative mb-1.5">
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
                        <input type="radio" name="menu-locale-guest" checked={isAuto} onChange={() => setLocale(locale, true)} className="accent-cyan-500" />
                        <Globe size={16} className="text-white/60" />
                        {t("settings.autoLanguage")}
                      </label>
                      <div className="max-h-[35vh] overflow-y-auto">
                        {filteredLocales.map((loc) => (
                          <label key={loc.code} className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-white/10 cursor-pointer">
                            <input type="radio" name="menu-locale-guest" checked={!isAuto && locale === loc.code} onChange={() => setLocale(loc.code, false)} className="accent-cyan-500" />
                            <span>{loc.native} ({loc.name})</span>
                          </label>
                        ))}
                        {filteredLocales.length === 0 && <p className="text-white/50 text-xs py-2 px-4">Eşleşen dil yok</p>}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="border-b border-white/10">
                <button type="button" onClick={() => setOpenSection(openSection === "help" ? null : "help")} className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-white/5">
                  <span className="font-semibold text-sm text-white">Yardım & Yasal</span>
                  {openSection === "help" ? <ChevronDown size={18} className="text-white/60" /> : <ChevronRight size={18} className="text-white/60" />}
                </button>
                {openSection === "help" && (
                  <div className="pb-1">
                    <Link href="/help" onClick={() => setOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-white/10">
                      <HelpCircle size={18} className="text-white/60" />
                      {t("user.help")}
                    </Link>
                    <Link href="/feedback" onClick={() => setOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-white/10">
                      <Send size={18} className="text-white/60" />
                      {t("user.feedback")}
                    </Link>
                    <Link href="/yasal/kullanim-sartlari" onClick={() => setOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-white/10">
                      <FileText size={18} className="text-white/60" />
                      {t("footer.terms")}
                    </Link>
                    <Link href={countryRule.legalPath} onClick={() => setOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-white/10">
                      <Shield size={18} className="text-white/60" />
                      {countryRule.legalLabel}
                    </Link>
                    <Link href="/yasal/reklam-politikasi" onClick={() => setOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-white/10">
                      <Megaphone size={18} className="text-white/60" />
                      {t("footer.adPolicy")}
                    </Link>
                    <Link href="/yasal/fikri-mulkiyet" onClick={() => setOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-white/10">
                      <Copyright size={18} className="text-white/60" />
                      {t("footer.ipRights")}
                    </Link>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
