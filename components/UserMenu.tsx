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
} from "lucide-react";
import { useAuth } from "./AuthProvider";
import { useLocale } from "./LocaleProvider";
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
  const menuRef = useRef<HTMLDivElement>(null);
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
        className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/5 border border-red-500/50 shrink-0 overflow-hidden hover:bg-white/10 hover:border-red-500/70 transition-all flex items-center justify-center"
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
        <div className="absolute top-full right-0 mt-2 py-2 w-64 max-w-[calc(100vw-2rem)] max-h-[calc(100vh-6rem)] overflow-y-auto bg-black/95 border border-white/20 rounded-xl shadow-2xl z-50 overflow-x-hidden">
          {user ? (
            <>
              {/* Profil başlığı */}
              <div className="px-4 py-3 border-b border-white/10">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <p className="font-semibold text-sm truncate">{user.displayName || t("user.user")}</p>
                  {subscribed === true && (
                    <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/40">
                      {t("user.subscribed")}
                    </span>
                  )}
                  {(projectCount ?? 0) > 0 && (
                    <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
                      Creator
                    </span>
                  )}
                </div>
                {user.email && (
                  <p className="text-xs text-white/50 truncate" title={user.email}>
                    {user.email}
                  </p>
                )}
                <p className="text-xs text-white/40 mt-0.5">{t("user.signedIn")}</p>
                {subscribed === false && (
                  <div className="mt-2 flex items-center gap-2 text-amber-400/90 text-xs">
                    <AlertCircle size={14} />
                    <span>{t("user.notSubscribed")}</span>
                    <Link
                      href="/abone-ol"
                      onClick={() => setOpen(false)}
                      className="text-cyan-400 hover:underline shrink-0"
                    >
                      →
                    </Link>
                  </div>
                )}
                {subscribed === true && (
                  <div className="mt-2 flex items-center gap-2 text-green-400/90 text-xs">
                    <CheckCircle size={14} />
                    <span>{t("user.subscribed")}</span>
                  </div>
                )}
              </div>

              {/* Hızlı erişim */}
              {canUpload && (
                <Link
                  href="/upload"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-white/10"
                >
                  <Upload size={18} className="text-white/60" />
                  {t("user.uploadContent")}
                </Link>
              )}
              <Link
                href="/dashboard"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-white/10"
              >
                <LayoutGrid size={18} className="text-white/60" />
                {t("user.dashboard")}
              </Link>
              {isAdmin(user?.uid) && (
                <Link
                  href="/admin"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-white/10 text-amber-400"
                >
                  <ShieldCheck size={18} className="text-amber-400/80" />
                  {t("user.adminPanel")}
                </Link>
              )}
              <Link
                href={`/channel/${user.uid}`}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-white/10"
              >
                <User size={18} className="text-white/60" />
                {t("user.myChannel")}
              </Link>
              <Link
                href={`/channel/${user.uid}`}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-white/10"
              >
                <Pencil size={18} className="text-white/60" />
                {t("user.editProfile")}
              </Link>
              <Link
                href="/settings"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-white/10"
              >
                <Settings size={18} className="text-white/60" />
                {t("nav.settings")}
              </Link>
              <Link
                href="/subscriptions"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-white/10"
              >
                <UserPlus size={18} className="text-white/60" />
                {t("user.subscriptions")}
              </Link>
              <button
                type="button"
                onClick={() => {
                  signOut(auth);
                  setOpen(false);
                }}
                className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-white/10 w-full text-left text-red-400"
              >
                <LogOut size={18} />
                {t("user.signOut")}
              </button>
            </>
          ) : (
            <>
              <div className="px-4 py-3 border-b border-white/10">
                <p className="text-sm font-medium">{t("user.signInOrSubscribe")}</p>
                <p className="text-xs text-white/50 mt-0.5">İçerik paylaşmak veya yorum eklemek için giriş yapın.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowLoginModal(true);
                  setOpen(false);
                }}
                className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-white/10 w-full text-left"
              >
                <LogIn size={18} className="text-white/60" />
                {t("user.signInOrSignUp")}
              </button>
              <Link
                href="/subscriptions"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-white/10"
              >
                <UserPlus size={18} className="text-white/60" />
                {t("user.subscribe")}
              </Link>
            </>
          )}

          {/* Dil & Yasal */}
          <div className="border-t border-white/10 mt-1 pt-1">
            <Link
              href="/help"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-white/10"
            >
              <HelpCircle size={18} className="text-white/60" />
              {t("user.help")}
            </Link>
            <Link
              href="/feedback"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-white/10"
            >
              <Send size={18} className="text-white/60" />
              {t("user.feedback")}
            </Link>
            <div className="px-4 py-2 text-xs font-bold text-white/60 uppercase tracking-wider">
              {t("settings.language")}
            </div>
            <label className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-white/10 cursor-pointer">
              <input
                type="radio"
                name="menu-locale"
                checked={isAuto}
                onChange={() => { setLocale(locale, true); }}
                className="accent-cyan-500"
              />
              <Globe size={16} className="text-white/60" />
              {t("settings.autoLanguage")}
            </label>
            {LOCALES.slice(0, 8).map((loc) => (
              <label
                key={loc.code}
                className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-white/10 cursor-pointer"
              >
                <input
                  type="radio"
                  name="menu-locale"
                  checked={!isAuto && locale === loc.code}
                  onChange={() => { setLocale(loc.code, false); }}
                  className="accent-cyan-500"
                />
                <span>{loc.native}</span>
              </label>
            ))}
            <Link
              href="/settings"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-white/10 text-cyan-400"
            >
              <Globe size={18} className="text-white/60" />
              {t("footer.settings")} →
            </Link>
            <Link
              href="/yasal/kullanim-sartlari"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-white/10"
            >
              <FileText size={18} className="text-white/60" />
              {t("footer.terms")}
            </Link>
            <Link
              href={countryRule.legalPath}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-white/10"
            >
              <Shield size={18} className="text-white/60" />
              {countryRule.legalLabel}
            </Link>
            <Link
              href="/yasal/reklam-politikasi"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-white/10"
            >
              <Megaphone size={18} className="text-white/60" />
              {t("footer.adPolicy")}
            </Link>
            <Link
              href="/yasal/fikri-mulkiyet"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-white/10"
            >
              <Copyright size={18} className="text-white/60" />
              {t("footer.ipRights")}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
