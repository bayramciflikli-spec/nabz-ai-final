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
} from "lucide-react";
import type { User as FirebaseUser } from "firebase/auth";
import { useAuth } from "@/components/AuthProvider";
import { useLocale } from "@/components/LocaleProvider";
import { useCountry } from "@/components/CountryProvider";
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
              <div className="px-4 py-3 border-b border-white/10 flex items-center gap-3">
                <div className="w-14 h-14 rounded-full overflow-hidden bg-white/10 shrink-0 flex items-center justify-center">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xl font-bold text-white">
                      {(user.displayName || user.email || "U")[0].toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-white truncate">{user.displayName || t("user.user")}</p>
                  {user.email && <p className="text-xs text-white/50 truncate">{user.email}</p>}
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {subscribed === true && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/40">
                        {t("user.subscribed")}
                      </span>
                    )}
                    {(projectCount ?? 0) > 0 && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
                        Creator
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {canUpload && (
                <Link href="/upload" onClick={onClose} className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-white/10">
                  <Upload size={20} className="text-white/60 shrink-0" />
                  {t("user.uploadContent")}
                </Link>
              )}
              <Link href="/dashboard" onClick={onClose} className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-white/10">
                <LayoutGrid size={20} className="text-white/60 shrink-0" />
                {t("user.dashboard")}
              </Link>
              {isAdmin(user.uid) && (
                <Link href="/admin" onClick={onClose} className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-white/10 text-amber-400">
                  <ShieldCheck size={20} className="shrink-0" />
                  {t("user.adminPanel")}
                </Link>
              )}
              <Link href={`/channel/${user.uid}`} onClick={onClose} className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-white/10">
                <User size={20} className="text-white/60 shrink-0" />
                {t("user.myChannel")}
              </Link>
              <Link href="/settings" onClick={onClose} className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-white/10">
                <Settings size={20} className="text-white/60 shrink-0" />
                {t("nav.settings")}
              </Link>
              <Link href="/subscriptions" onClick={onClose} className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-white/10">
                <UserPlus size={20} className="text-white/60 shrink-0" />
                {t("user.subscriptions")}
              </Link>
              <button
                type="button"
                onClick={closeAnd(() => signOut(auth))}
                className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-white/10 w-full text-left text-red-400"
              >
                <LogOut size={20} className="shrink-0" />
                {t("user.signOut")}
              </button>
            </>
          ) : (
            <>
              <div className="px-4 py-3 border-b border-white/10">
                <p className="text-sm text-white/80">{t("user.signInOrSubscribe")}</p>
                <p className="text-xs text-white/50 mt-0.5">İçerik paylaşmak veya yorum eklemek için giriş yapın.</p>
              </div>
              <button
                type="button"
                onClick={closeAnd(() => setShowLoginModal(true))}
                className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-white/10 w-full text-left"
              >
                <LogIn size={20} className="text-white/60 shrink-0" />
                {t("user.signInOrSignUp")}
              </button>
              <Link href="/abone-ol" onClick={onClose} className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-white/10">
                <UserPlus size={20} className="text-white/60 shrink-0" />
                {t("user.subscribe")}
              </Link>
            </>
          )}

          <div className="border-t border-white/10 mt-2 pt-2">
            <Link href="/help" onClick={onClose} className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-white/10">
              <HelpCircle size={20} className="text-white/60 shrink-0" />
              {t("user.help")}
            </Link>
            <Link href="/feedback" onClick={onClose} className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-white/10">
              <Send size={20} className="text-white/60 shrink-0" />
              {t("user.feedback")}
            </Link>
            <div className="px-4 py-2 text-xs font-bold text-white/60 uppercase tracking-wider">{t("settings.language")}</div>
            <label className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-white/10 cursor-pointer">
              <input type="radio" name="sheet-locale" checked={isAuto} onChange={() => setLocale(locale, true)} className="accent-cyan-500" />
              <Globe size={16} className="text-white/60" />
              {t("settings.autoLanguage")}
            </label>
            {LOCALES.slice(0, 8).map((loc) => (
              <label key={loc.code} className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-white/10 cursor-pointer">
                <input type="radio" name="sheet-locale" checked={!isAuto && locale === loc.code} onChange={() => setLocale(loc.code, false)} className="accent-cyan-500" />
                <span>{loc.native}</span>
              </label>
            ))}
            <Link href="/settings" onClick={onClose} className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-white/10 text-cyan-400">
              <Globe size={20} className="text-white/60 shrink-0" />
              {t("footer.settings")} →
            </Link>
            <Link href="/yasal/kullanim-sartlari" onClick={onClose} className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-white/10">
              <FileText size={20} className="text-white/60 shrink-0" />
              {t("footer.terms")}
            </Link>
            <Link href={countryRule.legalPath} onClick={onClose} className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-white/10">
              <Shield size={20} className="text-white/60 shrink-0" />
              {countryRule.legalLabel}
            </Link>
            <Link href="/yasal/reklam-politikasi" onClick={onClose} className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-white/10">
              <Megaphone size={20} className="text-white/60 shrink-0" />
              {t("footer.adPolicy")}
            </Link>
            <Link href="/yasal/fikri-mulkiyet" onClick={onClose} className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-white/10">
              <Copyright size={20} className="text-white/60 shrink-0" />
              {t("footer.ipRights")}
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
