import { Calendar, HardDrive, Play } from "lucide-react";
import React from "react";
// import { Badge } from "../ui/badge";


export interface Clip {
  name: string;
  filename: string;
  path: string;
  size_mb: number;
  created_at: number;
  game: string | null;
}

const VideoCard: React.FC<{ clip: Clip; api: string; hoverPlaybackEnabled: boolean; onClick: () => void }> = ({ clip, api, hoverPlaybackEnabled, onClick }) => {
  const [shouldPlay, setShouldPlay] = React.useState(false);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const hoverTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    return () => {
      if (hoverTimer.current) clearTimeout(hoverTimer.current);
    };
  }, []);

  React.useEffect(() => {
    setShouldPlay(false);
    if (hoverTimer.current) {
      clearTimeout(hoverTimer.current);
      hoverTimer.current = null;
    }
  }, [clip]);

  React.useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (shouldPlay) {
      video.play().catch(err => console.debug("Playback prevented:", err));
    } else {
      video.pause();
      video.currentTime = 0;
    }
  }, [shouldPlay]);

  const handleMouseEnter = () => {
    if (!hoverPlaybackEnabled || shouldPlay) return;
    hoverTimer.current = setTimeout(() => {
      setShouldPlay(true);
    }, 800);
  };

  const handleMouseLeave = () => {
    if (hoverTimer.current) {
      clearTimeout(hoverTimer.current);
      hoverTimer.current = null;
    }
    setShouldPlay(false);
  };

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

  const thumbnailUrl = `${api}/clips/thumbnail?path=${encodeURIComponent(clip.path)}`;

  return (
    <div
      className="group relative rounded-lg bg-card border border-border cursor-pointer hover:border-primary/50 transition-all duration-200 hover:shadow-lg hover:shadow-black/20"
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="relative aspect-video bg-muted">
        {hoverPlaybackEnabled ? (
          <video
            ref={videoRef}
            poster={thumbnailUrl}
            src={shouldPlay ? `${api}/clips/stream?path=${encodeURIComponent(clip.path)}` : undefined}
            className="w-full h-full object-cover"
            muted
            loop
            onError={(e) => { (e.target as HTMLVideoElement).style.display = "none"; }}
          />
        ) : (
          <img
            src={thumbnailUrl}
            alt={clip.name}
            className="w-full h-full object-cover"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
        )}
        {!hoverPlaybackEnabled && (
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
              <Play className="h-6 w-6 text-white fill-white" />
            </div>
          </div>
        )}
      </div>
      {/* Инфо */}
      <div className="p-3 space-y-1.5">
        <p className="text-sm font-medium leading-tight line-clamp-2 text-foreground">
          {clip.name}
        </p>
        <div className="flex justify-between items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <HardDrive className="h-3 w-3" />
            {formatSize(clip.size_mb)}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {formatDate(clip.created_at)}
          </span>
        </div>
      </div>
    </div>
  );
};


export default VideoCard