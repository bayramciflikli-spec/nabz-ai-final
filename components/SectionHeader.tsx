"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { useLocale } from "@/components/LocaleProvider";
import type { SectionConfig } from "@/lib/sectionApps";

interface SectionHeaderProps {
  section: SectionConfig;
  className?: string;
}

export function SectionHeader({ section, className = "" }: SectionHeaderProps) {
  const { t } = useLocale();
  return (
    <div className={`flex flex-wrap items-center gap-3 ${className}`}>
      <h2 className="text-lg font-bold">{t(section.titleKey)}</h2>

      <div className="flex items-center gap-2 flex-wrap">
        <Link
          href={`/upload?kategori=${section.id}`}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/80 hover:bg-red-500 text-white transition-colors"
        >
          <Plus size={14} />
          {t(section.uploadLabelKey || "home.uploadContent")}
        </Link>

        <span className="text-white/40 text-xs">|</span>

        {section.apps.map((app) => (
          <a
            key={app.name}
            href={app.href}
            target="_blank"
            rel="noopener noreferrer"
            title={`${app.name} ${t("home.createWith")}`}
            className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs bg-white/5 hover:bg-white/15 border border-white/10 transition-colors"
          >
            {app.logo ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={app.logo} alt="" className="w-4 h-4 rounded" />
            ) : null}
            <span>{app.name}</span>
          </a>
        ))}
      </div>
    </div>
  );
}
