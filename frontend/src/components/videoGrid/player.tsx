import { Calendar, Film, HardDrive, X } from "lucide-react";
import { useEffect } from "react";
import { Button } from "../ui/button";
import type { Clip } from "./videoCard";
import { Badge } from "../ui/badge";
import { MediaPlayer, MediaProvider } from '@vidstack/react';
import { defaultLayoutIcons, DefaultVideoLayout } from '@vidstack/react/player/layouts/default';
import '@vidstack/react/player/styles/default/theme.css';
import '@vidstack/react/player/styles/default/layouts/video.css';
import { useSettings } from "@/hooks/useSettings";

const PlayerModal: React.FC<{ clip: Clip, api: string, onClose: () => void }> = ({ clip, api, onClose }) => {
  const streamUrl = `${api}/clips/stream?path=${encodeURIComponent(clip.path)}`;

  const settings = useSettings();
  const volume = settings?.sound_volume ?? 0.35;

  const formatDate = (ts: number) =>
    new Date(ts * 1000).toLocaleString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const formatSize = (mb: number) =>
    mb >= 1024 ? `${(mb / 1024).toFixed(1)} ГБ` : `${mb} МБ`;


  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-card rounded-xl overflow-hidden w-full max-w-4xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Шапка */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2 min-w-0">
            <Film className="h-4 w-4 text-muted-foreground shrink-0" />
            <p className="text-sm font-medium truncate">{clip.name}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="shrink-0">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Плеер */}
        <MediaPlayer src={streamUrl} autoPlay volume={volume} playsInline>
          <MediaProvider />
          <DefaultVideoLayout icons={defaultLayoutIcons} />
        </MediaPlayer>

        {/* Инфо */}
        <div className="px-4 py-3 flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <HardDrive className="h-3 w-3" />
            {formatSize(clip.size_mb)}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {formatDate(clip.created_at)}
          </span>
          {clip.game && (
            <Badge variant="secondary" className="text-xs">
              {clip.game}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlayerModal;