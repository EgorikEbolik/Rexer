import {
    Calendar,
    HardDrive,
    Play,
    MoreVertical,
    Trash2,
    Edit3,
} from "lucide-react";
import React from "react";
import Dropdown, { type DropdownItemInterface } from "../dropdown";
import Dialog from "../AlertDialog";
import { Input } from "../ui/input";
import useClipActions from "@/hooks/useClipActions";
import { useThumbnail } from "@/hooks/useThumb";

export interface Clip {
    name: string;
    filename: string;
    path: string;
    size_mb: number;
    created_at: number;
    game: string | null;
    _t?: number; //костыль для видео которые были перезаписаны и их путь не поменялся (по научному кэш-бастер)
}

const VideoCard: React.FC<{
    clip: Clip;
    api: string;
    hoverPlaybackEnabled: boolean;
    onClick: () => void;
    onDelete: () => void;
    onRename: (newPath: string, newName: string) => void;
}> = ({ clip, api, hoverPlaybackEnabled, onClick, onDelete, onRename }) => {
    const { renameClip, deleteClip } = useClipActions();
    const [shouldPlay, setShouldPlay] = React.useState(false);

    const [editing, setEditing] = React.useState<boolean>(false);
    const [currentPath, setCurrentPath] = React.useState<string>(clip.path);

    const [newName, setNewName] = React.useState<string>(clip.name);
    const [streamUrl, setStreamUrl] = React.useState<string>(
        `${api}/clips/stream?path=${encodeURIComponent(currentPath)}`,
    );
    const thumbnailUrl = useThumbnail(api, currentPath);
    const [loading, setLoading] = React.useState<boolean>(false);

    const videoRef = React.useRef<HTMLVideoElement>(null);
    const hoverTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
    const handleRename = async () => {
        setShouldPlay(false);
        setLoading(true);

        const oldStreamUrl = streamUrl;
        setStreamUrl("");
        await renameClip(
            currentPath,
            newName,
            (newPath) => {
                setCurrentPath(newPath);
                setStreamUrl(
                    `${api}/clips/stream?path=${encodeURIComponent(newPath)}`,
                );

                onRename(newPath, newName);
            },
            () => {
                setStreamUrl(oldStreamUrl);
            },
        );
        setEditing(false);
        setLoading(false);
    };
    const dropdownItems: DropdownItemInterface[] = [
        {
            label: "Переименовать",
            onClick: () => setEditing(true),
            isCritical: false,
            icon: <Edit3 />,
        },
        {
            label: "Удалить",
            onClick: async () => {
                await deleteClip(currentPath, () => onDelete());
            },
            isCritical: true,
            icon: <Trash2 />,
        },
    ];

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
            video
                .play()
                .catch((err) => console.debug("Playback prevented:", err));
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

    return (
        <div
            className="group flex flex-col rounded-lg bg-card border border-border cursor-pointer hover:border-primary/50 transition-all duration-200 hover:shadow-lg hover:shadow-black/20 overflow-hidden h-full"
            onClick={onClick}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <div className="relative aspect-video bg-muted">
                {hoverPlaybackEnabled ? (
                    <video
                        ref={videoRef}
                        poster={thumbnailUrl}
                        preload="none"
                        src={shouldPlay ? streamUrl : undefined}
                        className="w-full h-full object-cover"
                        muted
                        loop
                        onError={(e) => {
                            (e.target as HTMLVideoElement).style.display =
                                "none";
                        }}
                    />
                ) : thumbnailUrl ? (
                    <img
                        src={thumbnailUrl}
                        alt={newName}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                            (e.target as HTMLImageElement).style.display =
                                "none";
                        }}
                    />
                ) : (
                    <div className="w-full h-full bg-muted animate-pulse" />
                )}
                {!hoverPlaybackEnabled && (
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
                            <Play className="h-6 w-6 text-white fill-white" />
                        </div>
                    </div>
                )}
                <div
                    className="absolute right-2 top-2 bg-primary-foreground p-0.5 rounded-sm"
                    onClick={(e) => e.stopPropagation()}
                >
                    <Dropdown
                        trigger={<MoreVertical />}
                        items={dropdownItems}
                        classname="w-fit"
                    />
                    <Dialog
                        trigger={<span className="hidden" />}
                        dialogLabel="Переименовать клип"
                        onActionLabel="Переименовать"
                        children={
                            <Input
                                disabled={loading}
                                value={newName}
                                onKeyDown={async (e) => {
                                    if (e.key === "Enter") {
                                        handleRename();
                                    }
                                }}
                                onChange={(e) => setNewName(e.target.value)}
                            />
                        }
                        onAction={() => handleRename()}
                        open={editing}
                        onOpenChange={(open) => {
                            if (!open) setNewName(clip.name);
                            setEditing(open);
                        }}
                        isLoading={loading}
                    />
                </div>
            </div>
            {/* Инфо */}
            <div className="p-3 space-y-1.5 flex flex-col flex-1 justify-between">
                <p className="text-sm font-medium leading-tight line-clamp-2 text-foreground">
                    {newName}
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

export default React.memo(VideoCard);
