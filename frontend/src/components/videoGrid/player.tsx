import {
    Calendar,
    Film,
    HardDrive,
    X,
    Trash2,
    Edit3,
    Check,
    Loader2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "../ui/button";
import type { Clip } from "./videoCard";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import {
    MediaPlayer,
    MediaProvider,
    type MediaPlayerInstance,
} from "@vidstack/react";
import {
    defaultLayoutIcons,
    DefaultVideoLayout,
    type DefaultLayoutTranslations,
} from "@vidstack/react/player/layouts/default";
import "@vidstack/react/player/styles/default/theme.css";
import "@vidstack/react/player/styles/default/layouts/video.css";
import { useSettings } from "@/hooks/useSettings";
import Dialog from "../AlertDialog";
import useClipActions from "@/hooks/useClipActions";

const RUSSIAN: DefaultLayoutTranslations = {
    "Caption Styles": "Стили субтитров",
    "Captions look like this": "Субтитры выглядят так",
    "Closed-Captions Off": "Скрытые субтитры выкл",
    "Closed-Captions On": "Скрытые субтитры вкл",
    "Display Background": "Фон экрана",
    "Enter Fullscreen": "На весь экран",
    "Enter PiP": "Режим PiP",
    "Exit Fullscreen": "Выйти из полноэкранного режима",
    "Exit PiP": "Выйти из PiP",
    "Google Cast": "Google Cast",
    "Keyboard Animations": "Анимации клавиатуры",
    "Seek Backward": "Перемотка назад",
    "Seek Forward": "Перемотка вперёд",
    "Skip To Live": "Перейти к прямому эфиру",
    "Text Background": "Фон текста",
    Accessibility: "Спец. возможности",
    AirPlay: "AirPlay",
    Announcements: "Объявления",
    Audio: "Аудио",
    Auto: "Авто",
    Boost: "Усиление",
    Captions: "Субтитры",
    Chapters: "Главы",
    Color: "Цвет",
    Connected: "Подключено",
    Connecting: "Подключение",
    Continue: "Продолжить",
    Default: "По умолчанию",
    Disabled: "Отключено",
    Disconnected: "Отключено",
    Download: "Скачать",
    Family: "Семейство",
    Font: "Шрифт",
    Fullscreen: "Полный экран",
    LIVE: "ПРЯМОЙ ЭФИР",
    Loop: "Зациклить",
    Mute: "Выключить звук",
    Normal: "Обычный",
    Off: "Выкл",
    Opacity: "Прозрачность",
    Pause: "Пауза",
    PiP: "PiP",
    Play: "Воспроизвести",
    Playback: "Воспроизведение",
    Quality: "Качество",
    Replay: "Повтор",
    Reset: "Сбросить",
    Seek: "Перемотка",
    Settings: "Настройки",
    Shadow: "Тень",
    Size: "Размер",
    Speed: "Скорость",
    Text: "Текст",
    Track: "Трек",
    Unmute: "Включить звук",
    Volume: "Громкость",
};

const PlayerModal: React.FC<{
    clip: Clip;
    api: string;
    onClose: () => void;
    onDelete: () => void;
    onRename: (newPath: string, newName: string) => void;
}> = ({ clip, api, onClose, onDelete, onRename }) => {
    const { settings } = useSettings();

    const { renameClip, deleteClip } = useClipActions();

    const [editing, setEditing] = useState<boolean>(false);
    const [currentPath, setCurrentPath] = useState<string>(clip.path);
    const [newName, setNewName] = useState<string>(clip.name);
    const [streamUrl, setStreamUrl] = useState<string>(
        `${api}/clips/stream?path=${encodeURIComponent(currentPath)}`,
    );
    const playerRef = useRef<MediaPlayerInstance>(null);
    const [vttUrl, setVttUrl] = useState<string>(
        `${api}/clips/tileset/vtt?path=${encodeURIComponent(currentPath)}`,
    );
    const [loading, setLoading] = useState<boolean>(false);

    const volume = settings?.player_default_volume ?? 0.35;

    const handleRename = async () => {
        const oldStreamUrl = streamUrl;
        playerRef.current?.pause();

        setLoading(true);
        setStreamUrl("");
        await renameClip(
            currentPath,
            newName,
            (newPath) => {
                setCurrentPath(newPath);
                setStreamUrl(
                    `${api}/clips/stream?path=${encodeURIComponent(newPath)}`,
                );
                setVttUrl(
                    `${api}/clips/tileset/vtt?path=${encodeURIComponent(newPath)}`,
                );
                onRename(newPath, newName);
            },
            () => {
                setStreamUrl(oldStreamUrl);
                setNewName(clip.name);
            },
        );
        setEditing(false);
        setLoading(false);
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
                className="bg-card rounded-xl overflow-hidden w-full max-w-6xl shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Шапка */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                        <Film className="h-4 w-4 text-muted-foreground shrink-0" />
                        {editing ? (
                            <Input
                                autoFocus
                                className="text-sm font-medium w-full!"
                                disabled={loading}
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                onKeyDown={async (e) => {
                                    if (e.key === "Enter") {
                                        handleRename();
                                    }
                                    if (e.key === "Escape") {
                                        e.stopPropagation();
                                        setNewName(clip.name);
                                        setEditing(false);
                                    }
                                }}
                            ></Input>
                        ) : (
                            <p
                                className="text-sm font-medium truncate"
                                onClick={() => setEditing(true)}
                            >
                                {newName}
                            </p>
                        )}
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        className="shrink-0"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                {/* Плеер */}
                <div className="relative aspect-video bg-black">
                    <MediaPlayer
                        src={streamUrl}
                        ref={playerRef}
                        autoPlay={!loading}
                        volume={volume}
                        playsInline
                        keyTarget="document"
                    >
                        <MediaProvider />
                        <DefaultVideoLayout
                            translations={RUSSIAN}
                            thumbnails={vttUrl}
                            icons={defaultLayoutIcons}
                        />
                    </MediaPlayer>
                </div>

                <div className="flex items-center justify-between">
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
                    {/* Кнопки */}
                    <div className="px-4 py-3 flex items-center gap-4 text-xs text-muted-foreground">
                        {editing ? (
                            <Button
                                className="w-36"
                                disabled={loading}
                                onClick={handleRename}
                            >
                                {loading ? (
                                    <Loader2 className="animate-spin" />
                                ) : (
                                    <Check />
                                )}
                                <span>
                                    {loading ? "Сохранение..." : "Подтвердить"}
                                </span>
                            </Button>
                        ) : (
                            <Button
                                className="w-36"
                                disabled={loading}
                                onClick={() => setEditing(true)}
                            >
                                <Edit3 />
                                <span>Переименовать</span>
                            </Button>
                        )}
                        <Dialog
                            dialogLabel="Уверены что хотите удалить файл?"
                            description="Если удалите - восстановить его не получится!"
                            size="sm"
                            isCritical={true}
                            trigger={
                                <Button
                                    variant="destructive"
                                    disabled={loading}
                                >
                                    <Trash2 />
                                    <span>Удалить</span>
                                </Button>
                            }
                            onActionLabel="Удалить"
                            onAction={async () => {
                                setLoading(true);
                                await deleteClip(currentPath, () => {
                                    onDelete();
                                    onClose();
                                });
                                setLoading(false);
                            }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PlayerModal;
