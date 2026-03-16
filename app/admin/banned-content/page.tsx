"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, type User } from "firebase/auth";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { Ban, Shield, Plus, Trash2, Database } from "lucide-react";
import { SEARCH_BLACKLIST, SAFE_SEARCH_ALTERNATIVES } from "@/lib/searchGuard";
import { CONTENT_RULES } from "@/lib/contentRules";

export default function AdminBannedContentPage() {
  const [user, setUser] = useState<User | null>(null);
  const [filter, setFilter] = useState("");
  const [terms, setTerms] = useState<string[]>([]);
  const [fromFirestore, setFromFirestore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newTerm, setNewTerm] = useState("");
  const [actionError, setActionError] = useState("");
  const [acting, setActing] = useState<string | null>(null);

  const loadTerms = async () => {
    setLoading(true);
    try {
      const res = await fetchWithAuth("/api/admin/banned-terms");
      const data = await res.json();
      if (data.ok && Array.isArray(data.terms)) {
        setTerms(data.terms);
        setFromFirestore(data.fromFirestore !== false);
      } else {
        setTerms(SEARCH_BLACKLIST);
        setFromFirestore(false);
      }
    } catch {
      setTerms(SEARCH_BLACKLIST);
      setFromFirestore(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, setUser);
    return () => unsub();
  }, []);

  useEffect(() => {
    if (user) loadTerms();
  }, [user]);

  const handleAdd = async () => {
    if (!newTerm.trim() || acting) return;
    setActionError("");
    setActing("add");
    try {
      const res = await fetchWithAuth("/api/admin/banned-terms", {
        method: "POST",
        body: JSON.stringify({ term: newTerm.trim() }),
      });
      const data = await res.json();
      if (data.ok && Array.isArray(data.terms)) {
        setTerms(data.terms);
        setNewTerm("");
      } else {
        setActionError(data.error || "Eklenemedi");
      }
    } catch {
      setActionError("İstek başarısız");
    } finally {
      setActing(null);
    }
  };

  const handleRemove = async (term: string) => {
    if (acting) return;
    setActionError("");
    setActing(term);
    try {
      const res = await fetchWithAuth("/api/admin/banned-terms", {
        method: "DELETE",
        body: JSON.stringify({ term }),
      });
      const data = await res.json();
      if (data.ok && Array.isArray(data.terms)) {
        setTerms(data.terms);
        setFromFirestore(true);
      } else {
        setActionError(data.error || "Silinemedi");
      }
    } catch {
      setActionError("İstek başarısız");
    } finally {
      setActing(null);
    }
  };

  const handleSeed = async () => {
    if (acting) return;
    setActionError("");
    setActing("seed");
    try {
      const res = await fetchWithAuth("/api/admin/banned-terms", { method: "PATCH" });
      const data = await res.json();
      if (data.ok && Array.isArray(data.terms)) {
        setTerms(data.terms);
        setFromFirestore(true);
      } else {
        setActionError(data.error || "Seed başarısız");
      }
    } catch {
      setActionError("İstek başarısız");
    } finally {
      setActing(null);
    }
  };

  const navItems = [
    { label: "Global Onay Kuyruğu", href: "/admin/global-control", active: false },
    { label: "Kullanıcı Yönetimi", href: "/admin/users", active: false },
    { label: "Financial Hub", href: "/admin/financial", active: false },
    { label: "Şeffaflık Raporu", href: "/admin/transparency", active: false },
    { label: "Aktif Sponsorlar", href: "/admin/financial", active: false },
    { label: "Hukuki Filtreler", href: "/admin/legal-filters", active: false },
    { label: "Yasaklı Kelime/İçerik", href: "/admin/banned-content", active: true },
    { label: "Sanal AVM Analitik", href: "/mall", active: false },
  ];

  const displayTerms = terms.length > 0 ? terms : SEARCH_BLACKLIST;
  const filteredTerms = filter
    ? displayTerms.filter((t) => t.toLowerCase().includes(filter.toLowerCase()))
    : displayTerms;

  return (
    <div className="p-8">
          <h1 className="text-2xl font-bold mb-8 flex items-center gap-2">
            <Ban size={28} className="text-red-400" />
            Yasaklı Kelime ve İçerik
          </h1>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="p-6 rounded-xl bg-[#111] border border-white/10">
              <h3 className="font-bold text-white mb-3 flex items-center gap-2">
                <Shield size={18} className="text-amber-400" />
                İçerik Kuralları
              </h3>
              <ul className="text-sm text-white/80 space-y-2">
                {CONTENT_RULES.prohibited.map((r) => (
                  <li key={r}>• {r}</li>
                ))}
              </ul>
              <p className="text-amber-400/80 text-xs mt-3">{CONTENT_RULES.consequence}</p>
            </div>

            <div className="p-6 rounded-xl bg-[#111] border border-white/10">
              <h3 className="font-bold text-white mb-3">Arama Güvenliği</h3>
              <p className="text-sm text-white/70 mb-2">
                Toplam <strong>{displayTerms.length}</strong> yasaklı terim arama ve içerik filtrelemede kullanılıyor.
              </p>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newTerm}
                  onChange={(e) => { setNewTerm(e.target.value); setActionError(""); }}
                  onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                  placeholder="Yeni terim ekle..."
                  className="flex-1 px-3 py-2 rounded-lg bg-black/40 border border-white/20 text-white placeholder-white/40 text-sm"
                />
                <button
                  onClick={handleAdd}
                  disabled={!newTerm.trim() || !!acting}
                  className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-sm font-medium flex items-center gap-1"
                >
                  <Plus size={16} />
                  Ekle
                </button>
              </div>
              {!fromFirestore && (
                <button
                  onClick={handleSeed}
                  disabled={!!acting}
                  className="text-sm text-amber-400 hover:underline flex items-center gap-1"
                >
                  <Database size={14} />
                  Varsayılan listeyi yükle
                </button>
              )}
              <label className="block text-xs text-white/50 mb-1 mt-2">Filtrele</label>
              <input
                type="text"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Terim ara..."
                className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/20 text-white placeholder-white/40 text-sm"
              />
            </div>
          </div>

          <div className="p-6 rounded-xl bg-[#0d0d0d] border border-white/10 mb-6">
            <h3 className="font-bold text-white mb-4">
              Yasaklı Arama Terimleri ({filteredTerms.length})
              {loading && <span className="text-white/50 text-sm font-normal ml-2">yükleniyor…</span>}
            </h3>
            {actionError && <p className="text-red-400 text-sm mb-2">{actionError}</p>}
            <div className="flex flex-wrap gap-2 max-h-64 overflow-y-auto">
              {filteredTerms.map((term) => (
                <span
                  key={term}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs bg-red-900/30 text-red-300 border border-red-500/30 group"
                >
                  {term}
                  <button
                    onClick={() => handleRemove(term)}
                    disabled={!!acting}
                    className="opacity-0 group-hover:opacity-100 hover:bg-red-500/30 rounded p-0.5 transition-opacity disabled:opacity-50"
                    title="Sil"
                  >
                    <Trash2 size={12} />
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="p-6 rounded-xl bg-[#0d0d0d] border border-green-500/30">
            <h3 className="font-bold text-green-400 mb-3">Güvenli Arama Önerileri</h3>
            <ul className="text-sm text-white/80 space-y-1">
              {SAFE_SEARCH_ALTERNATIVES.map((s) => (
                <li key={s}>• {s}</li>
              ))}
            </ul>
          </div>

          <p className="text-xs text-white/40 mt-6">
            Yasaklı terimler Firestore config/banned_terms dokümanında saklanır. Arama sayfaları /api/banned-terms ile senkronize edilir.
          </p>

          <div className="mt-8 flex gap-4">
            <Link href="/admin/legal-filters" className="text-sm text-cyan-400 hover:underline">
              ← Hukuki Filtreler
            </Link>
            <Link href="/" className="text-sm text-white/50 hover:text-white">
              Ana Sayfa
            </Link>
          </div>
    </div>
  );
}
