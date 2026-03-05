"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, X } from "lucide-react";
import { searchAitube } from "@/lib/searchAitube";

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ videos: any[]; channels: any[] } | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    const data = await searchAitube(query);
    setResults(data);
  };

  const clearQuery = (e: React.MouseEvent) => {
    e.preventDefault();
    setQuery("");
  };

  return (
    <div className="relative w-[200px] min-w-0 mr-5 group">
      <form onSubmit={handleSearch} className="w-full flex">
        <div className="flex flex-row items-center w-full h-9 bg-[#111] border border-[#222] rounded-[18px] overflow-hidden px-4">
          <input
            type="text"
            placeholder="Ara"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none text-[#888] text-sm placeholder:text-[#888]/60 min-w-0 font-sans"
          />
          {query && (
            <button
              type="button"
              onClick={clearQuery}
              className="p-0.5 flex-shrink-0"
              aria-label="Temizle"
            >
              <X size={18} className="text-[#888] cursor-pointer hover:text-white" />
            </button>
          )}
          <button type="submit" className="ml-2.5 flex-shrink-0 p-0 bg-transparent border-none cursor-pointer opacity-60">
            <Search size={18} className="text-white" />
          </button>
        </div>
      </form>

      {/* ARAMA SONUÇLARI DROPDOWN */}
      {results && query && (
        <div className="absolute top-14 right-0 left-0 bg-[#282828] rounded-xl shadow-2xl z-50 overflow-hidden border border-white/10">
          {(results.channels?.length ?? 0) > 0 && (
            <div className="p-2 border-b border-white/5">
              <p className="text-[10px] text-gray-400 font-bold px-3 py-1 uppercase">
                Kanallar
              </p>
              {results.channels.map((c: any) => (
                <Link
                  key={c.id}
                  href={`/channel/${c.id}`}
                  className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg transition"
                >
                  <img
                    src={c.photoURL || "/default-avatar.png"}
                    alt={c.displayName}
                    className="w-8 h-8 rounded-full object-cover bg-gray-800"
                  />
                  <span className="text-sm font-medium truncate">
                    {c.displayName || "İsimsiz"}
                  </span>
                </Link>
              ))}
            </div>
          )}
          <div className="p-2">
            <p className="text-[10px] text-gray-400 font-bold px-3 py-1 uppercase">
              Videolar
            </p>
            {(results.videos?.length ?? 0) > 0 ? (
              results.videos.map((v: any) => (
                <Link
                  key={v.id}
                  href={`/project/${v.id}`}
                  className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg transition"
                >
                  <Search size={14} className="text-gray-500 flex-shrink-0" />
                  <span className="text-sm truncate">{v.title}</span>
                </Link>
              ))
            ) : (
              <p className="text-sm text-gray-500 px-3 py-2">Sonuç bulunamadı.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
