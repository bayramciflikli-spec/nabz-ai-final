"use client";

import { useEffect, useRef, useState } from "react";
import { Settings, PictureInPicture2 } from "lucide-react";
import { useLocale } from "@/components/LocaleProvider";
import { saveProgress, getProgress } from "@/lib/watchProgress";

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

interface VideoPlayerProps {
  projectId: string;
  src: string;
  poster?: string;
  className?: string;
}

export function VideoPlayer({ projectId, src, poster, className = "" }: VideoPlayerProps) {
  const { t } = useLocale();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [speed, setSpeed] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [pipSupported, setPipSupported] = useState(false);
  const [resumeFrom, setResumeFrom] = useState<number | null>(null);
  const [hasResumed, setHasResumed] = useState(false);

  useEffect(() => {
    setResumeFrom(getProgress(projectId));
    setPipSupported(
      typeof document !== "undefined" &&
        "pictureInPictureEnabled" in document &&
        document.pictureInPictureEnabled
    );
  }, [projectId]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.playbackRate = speed;
  }, [speed]);

  const handleLoadedMetadata = () => {
    const v = videoRef.current;
    if (!v || hasResumed || resumeFrom == null) return;
    if (resumeFrom < v.duration - 5) {
      v.currentTime = resumeFrom;
      setHasResumed(true);
    }
  };

  const handleTimeUpdate = () => {
    const v = videoRef.current;
    if (!v) return;
    saveProgress(projectId, v.currentTime, v.duration);
  };

  const handlePip = async () => {
    const v = videoRef.current;
    if (!v || !pipSupported) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await v.requestPictureInPicture();
      }
    } catch {
      // Kullanıcı iptal etti veya desteklenmiyor
    }
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className={`relative group ${className}`}>
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        controls
        className="w-full h-full object-contain"
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
      />

      {/* Sağ üst - Hız ve PiP */}
      <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        {resumeFrom != null && !hasResumed && (
          <span className="text-xs bg-black/70 px-2 py-1 rounded text-white/90">
            {t("video.continue")} {formatTime(resumeFrom)}
          </span>
        )}
        {pipSupported && (
          <button
            type="button"
            onClick={handlePip}
            className="p-2 rounded-lg bg-black/60 hover:bg-black/80 text-white transition"
            title={t("video.pip")}
          >
            <PictureInPicture2 size={18} />
          </button>
        )}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowSpeedMenu((x) => !x)}
            className="p-2 rounded-lg bg-black/60 hover:bg-black/80 text-white transition flex items-center gap-1 min-w-[52px]"
            title={t("video.speed")}
          >
            <Settings size={16} />
            <span className="text-xs font-medium">{speed}x</span>
          </button>
          {showSpeedMenu && (
            <>
              <div
                className="fixed inset-0 z-20"
                onClick={() => setShowSpeedMenu(false)}
                aria-hidden
              />
              <div className="absolute top-full right-0 mt-1 py-2 bg-black/90 rounded-lg shadow-xl z-30 min-w-[100px]">
                {SPEEDS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      setSpeed(s);
                      setShowSpeedMenu(false);
                    }}
                    className={`w-full px-4 py-2 text-left text-sm hover:bg-white/10 transition ${
                      speed === s ? "text-cyan-400 font-semibold" : "text-white"
                    }`}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
