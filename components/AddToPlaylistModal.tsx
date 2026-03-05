"use client";

import { useEffect, useState } from "react";
import { getPlaylists, addToPlaylist, type Playlist } from "@/lib/playlists";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/components/AuthProvider";
import { useLocale } from "@/components/LocaleProvider";
import { useToast } from "@/components/ToastContext";
import { ListPlus } from "lucide-react";

interface AddToPlaylistModalProps {
  projectId: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export function AddToPlaylistModal({ projectId, onClose, onSuccess }: AddToPlaylistModalProps) {
  const { setShowLoginModal } = useAuth();
  const { t } = useLocale();
  const toast = useToast();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const uid = auth.currentUser?.uid;
      if (!uid) {
        setLoading(false);
        setPlaylists([]);
        return;
      }
      try {
        const list = await getPlaylists(uid);
        setPlaylists(list);
      } catch {
        setPlaylists([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleAdd = async (playlistId: string) => {
    setAdding(playlistId);
    try {
      await addToPlaylist(playlistId, projectId);
      onSuccess?.();
      onClose();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Listeye eklenemedi.");
    } finally {
      setAdding(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-md bg-[#1a1a1a] border border-white/20 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <ListPlus size={24} className="text-amber-400" />
          <h2 className="text-xl font-bold">{t("playlist.addToPlaylist")}</h2>
        </div>
        {loading ? (
          <div className="text-white/60 py-8 text-center">{t("playlist.loading")}</div>
        ) : !auth.currentUser ? (
          <div className="space-y-4">
            <p className="text-white/60">{t("playlist.loginRequired")}</p>
            <button
              type="button"
              onClick={() => {
                setShowLoginModal(true);
                onClose();
              }}
              className="w-full py-3 rounded-xl bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 transition"
            >
              {t("report.login")}
            </button>
          </div>
        ) : playlists.length === 0 ? (
          <div className="space-y-4">
            <p className="text-white/60">{t("playlist.noPlaylists")}</p>
            <a
              href="/playlists"
              className="block text-center py-3 rounded-xl bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 transition"
            >
              {t("playlist.createPlaylist")}
            </a>
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {playlists.map((p) => {
              const hasProject = (p.projectIds || []).includes(projectId);
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => !hasProject && handleAdd(p.id)}
                  disabled={hasProject || adding !== null}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition ${
                    hasProject
                      ? "bg-white/5 text-white/40 cursor-not-allowed"
                      : "bg-white/10 hover:bg-white/15"
                  }`}
                >
                  <span className="font-medium truncate">{p.name}</span>
                  {hasProject ? (
                    <span className="text-xs text-white/40">{t("playlist.alreadyAdded")}</span>
                  ) : adding === p.id ? (
                    <span className="text-xs text-amber-400">{t("playlist.adding")}</span>
                  ) : (
                    <span className="text-xs text-amber-400">{t("playlist.add")}</span>
                  )}
                </button>
              );
            })}
          </div>
        )}
        <button
          type="button"
          onClick={onClose}
          className="w-full mt-4 py-3 rounded-xl bg-white/10 hover:bg-white/15 transition"
        >
          {t("playlist.close")}
        </button>
      </div>
    </div>
  );
}
