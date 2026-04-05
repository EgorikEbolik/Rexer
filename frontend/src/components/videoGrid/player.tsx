import {
    Calendar,
    Film,
    HardDrive,
    X,
    Trash2,
    Edit3,
    Check,
    Loader2,
    Timer,
    ArrowLeftToLine,
    Pause,
    Play,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "../ui/button";
import type { Clip } from "./videoCard";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";

import {
    MediaPlayer,
    MediaProvider,
    useMediaRemote,
    useMediaStore,
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
import ScrissorsCutIcon from "../icons/ScrissorsCutIcon";
import * as SliderPrimitive from "@radix-ui/react-slider";
import CustomTooltip from "../Tooltip";

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

    const { renameClip, deleteClip, trimClip } = useClipActions();

    const [trimming, setTrimming] = useState<boolean>(false);
    const [duration, setDuration] = useState<number>(0);
    const [trimValue, setTrimValue] = useState<number[]>([0, duration]);
    const [currentTime, setCurrentTime] = useState<number>(0);

    const isSeeking = useRef(false);
    const [clipInfo, setClipInfo] = useState({
        size_mb: clip.size_mb,
        created_at: clip.created_at,
    });

    const [editing, setEditing] = useState<boolean>(false);
    const [currentPath, setCurrentPath] = useState<string>(clip.path);
    const [newName, setNewName] = useState<string>(clip.name);
    const [streamUrl, setStreamUrl] = useState<string>(
        `${api}/clips/stream?path=${encodeURIComponent(currentPath)}${clip._t ? `&t=${clip._t}` : ""}`,
    );
    const playerRef = useRef<MediaPlayerInstance>(null);
    const [vttUrl, setVttUrl] = useState<string>(
        `${api}/clips/tileset/vtt?path=${encodeURIComponent(currentPath)}${clip._t ? `&t=${clip._t}` : ""}`,
    );
    const [loading, setLoading] = useState<boolean>(false);

    const { paused } = useMediaStore(playerRef);
    const mediaRemote = useMediaRemote(playerRef);

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
                const cacheBuster = Date.now();
                setCurrentPath(newPath);
                setStreamUrl(
                    `${api}/clips/stream?path=${encodeURIComponent(newPath)}&t=${cacheBuster}`,
                );
                setVttUrl(
                    `${api}/clips/tileset/vtt?path=${encodeURIComponent(newPath)}&t=${cacheBuster}`,
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

    const handleTimeUpdate = (detail: { currentTime: number }) => {
        const time = detail.currentTime;
        setCurrentTime(time);
        if (!trimming || duration <= 0) return;
        const minLength = 0.1;
        if (trimValue[1] - trimValue[0] < minLength) return;

        if (isSeeking.current) {
            if (time >= trimValue[0] && time < trimValue[1]) {
                isSeeking.current = false;
            }
            return;
        }

        if (time >= trimValue[1]) {
            if (
                playerRef.current &&
                Math.abs(playerRef.current.currentTime - trimValue[0]) > 0.05
            ) {
                playerRef.current.currentTime = trimValue[0];
            }
        }
    };

    const formatTime = (seconds: number) => {
        const totalSec = Math.floor(seconds);
        const mins = Math.floor(totalSec / 60);
        const secs = totalSec % 60;
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };
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
                        onDurationChange={(d) => {
                            setDuration(d);
                            setTrimValue([0, d]);
                        }}
                        onTimeUpdate={handleTimeUpdate}
                        volume={volume}
                        keyTarget="document"
                        playsInline
                        className={
                            trimming ? "[&_.vds-time-slider]:invisible" : ""
                        }
                    >
                        <MediaProvider />
                        <DefaultVideoLayout
                            translations={RUSSIAN}
                            thumbnails={vttUrl}
                            icons={defaultLayoutIcons}
                            disableTimeSlider={trimming}
                        >
                            {trimming && duration > 0 && (
                                <div className="absolute bottom-12 left-0 right-0 z-30 px-3">
                                    <div className="relative flex items-center h-7">
                                        {/* слайдер перемотки */}
                                        <SliderPrimitive.Root
                                            value={[currentTime]}
                                            onValueChange={([newTime]) => {
                                                if (!playerRef.current) return;
                                                isSeeking.current = true;
                                                playerRef.current.currentTime =
                                                    newTime;
                                                setCurrentTime(newTime);
                                            }}
                                            min={0}
                                            max={duration}
                                            step={0.1}
                                            className="absolute h-full w-full z-20"
                                        >
                                            <SliderPrimitive.Track className="relative bg-white/30 w-full h-4 rounded-md flex items-center" />
                                            {/* вертикальная палка (индиикатор где щас играется видео) */}
                                            <SliderPrimitive.Thumb
                                                className="block -mt-2.5 w-1 h-7 bg-white rounded-full focus:outline-none z-40"
                                                style={{
                                                    top: "50%",
                                                    transform:
                                                        "translateY(-50%)",
                                                }}
                                            />
                                        </SliderPrimitive.Root>

                                        {/* Визуальный индикатор отрезка */}
                                        <div
                                            className="absolute bottom-3 h-6 bg-yellow-300 rounded-md pointer-events-none "
                                            style={{
                                                left: `${(trimValue[0] / duration) * 100}%`,
                                                width: `${((trimValue[1] - trimValue[0]) / duration) * 100}%`,
                                            }}
                                        />

                                        {/* левая ручка */}
                                        <SliderPrimitive.Root
                                            value={[trimValue[0]]}
                                            onValueChange={([val]) => {
                                                const newVal = Math.min(
                                                    val,
                                                    trimValue[1] - 0.1,
                                                );
                                                setTrimValue([
                                                    newVal,
                                                    trimValue[1],
                                                ]);
                                            }}
                                            min={0}
                                            max={duration}
                                            step={0.1}
                                            className="absolute w-full h-4 z-40"
                                            style={{ pointerEvents: "none" }}
                                        >
                                            <SliderPrimitive.Track className="hidden" />
                                            <SliderPrimitive.Range className="hidden" />
                                            <SliderPrimitive.Thumb
                                                className="block w-3 h-10 bg-yellow-400 rounded-bl-md cursor-ew-resize pointer-events-auto"
                                                style={{
                                                    position: "absolute",
                                                    left: `${(trimValue[0] / duration) * 100}%`,
                                                    transform:
                                                        "translateX(-50%)",
                                                    bottom: -10,
                                                }}
                                            />
                                        </SliderPrimitive.Root>

                                        {/* правая ручка */}
                                        <SliderPrimitive.Root
                                            value={[trimValue[1]]}
                                            onValueChange={([val]) => {
                                                const newVal = Math.max(
                                                    val,
                                                    trimValue[0] + 0.1,
                                                );
                                                setTrimValue([
                                                    trimValue[0],
                                                    newVal,
                                                ]);
                                            }}
                                            min={0}
                                            max={duration}
                                            step={0.1}
                                            className="absolute w-full h-4 z-40"
                                            style={{ pointerEvents: "none" }}
                                        >
                                            <SliderPrimitive.Track className="hidden" />
                                            <SliderPrimitive.Range className="hidden" />
                                            <SliderPrimitive.Thumb
                                                className=" w-3 h-10 bg-yellow-400 rounded-br-md cursor-ew-resize pointer-events-auto"
                                                style={{
                                                    position: "absolute",
                                                    left: `${(trimValue[1] / duration) * 100}%`,
                                                    transform:
                                                        "translateX(-50%)",
                                                    bottom: -10,
                                                }}
                                            />
                                        </SliderPrimitive.Root>

                                        {/*  время над ручками */}
                                        <div
                                            className="absolute bottom-12 -translate-x-1/2 rounded px-2 py-1 text-xs text-primary-foreground z-50 pointer-events-none bg-yellow-400 rounded-b-3xl"
                                            style={{
                                                left: `${(trimValue[0] / duration) * 100}%`,
                                            }}
                                        >
                                            <ScrissorsCutIcon
                                                size={40}
                                                className="text-primary-foreground"
                                            />
                                            {formatTime(trimValue[0])}
                                        </div>
                                        <div
                                            className="absolute bottom-12 -translate-x-1/2 rounded bg-yellow-400 px-2 py-1 text-xs text-primary-foreground z-50 pointer-events-none rounded-b-3xl"
                                            style={{
                                                left: `${(trimValue[1] / duration) * 100}%`,
                                            }}
                                        >
                                            <ScrissorsCutIcon
                                                size={40}
                                                className="text-primary-foreground rotate-180"
                                            />
                                            {formatTime(trimValue[1])}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </DefaultVideoLayout>
                    </MediaPlayer>
                </div>

                <div className="flex items-center justify-between">
                    {/* Инфо */}
                    <div className="px-4 py-3 flex items-center gap-4 text-xs text-muted-foreground">
                        <CustomTooltip
                            trigger={
                                <span className="flex items-center gap-1">
                                    <HardDrive className="h-3 w-3" />
                                    {formatSize(clipInfo.size_mb)}
                                </span>
                            }
                            content={<p>Вес файла</p>}
                            side="bottom"
                        />
                        <CustomTooltip
                            trigger={
                                <span className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {formatDate(clipInfo.created_at)}
                                </span>
                            }
                            content={<p>Дата создания</p>}
                            side="bottom"
                        />

                        {clip.game && (
                            <Badge variant="secondary" className="text-xs">
                                {clip.game}
                            </Badge>
                        )}

                        {trimming && (
                            <CustomTooltip
                                trigger={
                                    <span className="flex items-center gap-1">
                                        <Timer className="h-3 w-3" />
                                        {formatTime(
                                            trimValue[1] - trimValue[0],
                                        )}
                                    </span>
                                }
                                content={<p>Длительность фрагмента</p>}
                                side="bottom"
                            />
                        )}
                    </div>

                    {/* Кнопки */}

                    {/* Кнопки управления обрезкой */}
                    {trimming && (
                        <div className="px-4 py-3 flex items-center gap-4 text-xs text-muted-foreground">
                            <CustomTooltip
                                trigger={
                                    <Button
                                        size={"icon"}
                                        disabled={loading}
                                        onMouseDown={(e) => e.preventDefault()}
                                        onClick={() => {
                                            if (!playerRef.current) return;
                                            playerRef.current.currentTime =
                                                trimValue[0];
                                            setCurrentTime(trimValue[0]);
                                            playerRef.current.pause();
                                        }}
                                    >
                                        <ArrowLeftToLine />
                                    </Button>
                                }
                                content={<p>Перемотать в начало фрагмента</p>}
                                side="bottom"
                            />
                            <CustomTooltip
                                trigger={
                                    <Button
                                        size={"icon"}
                                        disabled={loading}
                                        onMouseDown={(e) => e.preventDefault()}
                                        onClick={() => {
                                            setTrimValue([
                                                currentTime,
                                                trimValue[1],
                                            ]);
                                        }}
                                    >
                                        <ScrissorsCutIcon className="size-5" />
                                    </Button>
                                }
                                content={<p>Установить начало фрагмента</p>}
                                side="bottom"
                            />
                            <CustomTooltip
                                trigger={
                                    <Button
                                        size={"icon"}
                                        disabled={loading}
                                        onMouseDown={(e) => e.preventDefault()}
                                        onClick={() => {
                                            mediaRemote.togglePaused();
                                        }}
                                    >
                                        {paused ? <Play /> : <Pause />}
                                    </Button>
                                }
                                content={
                                    <p>
                                        {paused ? "Воспроизведение" : "Пауза"}
                                    </p>
                                }
                                side="bottom"
                            />
                            <CustomTooltip
                                trigger={
                                    <Button
                                        size={"icon"}
                                        disabled={loading}
                                        onMouseDown={(e) => e.preventDefault()}
                                        onClick={() => {
                                            setTrimValue([
                                                trimValue[0],
                                                currentTime,
                                            ]);
                                        }}
                                    >
                                        <ScrissorsCutIcon className="size-5 rotate-180" />
                                    </Button>
                                }
                                content={<p>Установить конец фрагмента</p>}
                                side="bottom"
                            />
                            <CustomTooltip
                                trigger={
                                    <Button
                                        size={"icon"}
                                        disabled={loading}
                                        onMouseDown={(e) => e.preventDefault()}
                                        onClick={() => {
                                            if (!playerRef.current) return;
                                            isSeeking.current = true;
                                            playerRef.current.currentTime =
                                                trimValue[1];
                                            setCurrentTime(trimValue[1]);
                                            playerRef.current.pause();
                                        }}
                                    >
                                        <ArrowLeftToLine className="rotate-180" />
                                    </Button>
                                }
                                content={<p>Перемотать в конец фрагмента</p>}
                                side="bottom"
                            />
                        </div>
                    )}

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
                        ) : trimming ? (
                            <>
                                <Button
                                    className="w-36"
                                    onMouseDown={(e) => e.preventDefault()}
                                    disabled={loading}
                                    onClick={() => setTrimming(false)}
                                >
                                    <span>Отменить</span>
                                </Button>
                                <Button
                                    className="w-36"
                                    onMouseDown={(e) => e.preventDefault()}
                                    disabled={loading}
                                    onClick={async () => {
                                        setLoading(true);
                                        await trimClip(
                                            currentPath,
                                            trimValue[0],
                                            trimValue[1],
                                            (newClip) => {
                                                const cacheBuster = Date.now();
                                                setStreamUrl(
                                                    `${api}/clips/stream?path=${encodeURIComponent(newClip.path)}&t=${cacheBuster}`,
                                                );
                                                setCurrentPath(newClip.path);
                                                setVttUrl(
                                                    `${api}/clips/tileset/vtt?path=${encodeURIComponent(newClip.path)}&t=${cacheBuster}`,
                                                );
                                                setNewName(newClip.name);
                                                setClipInfo({
                                                    size_mb: newClip.size_mb,
                                                    created_at:
                                                        newClip.created_at,
                                                });
                                                setCurrentTime(0);
                                            },
                                        );
                                        setTrimming(false);
                                        setLoading(false);
                                        setTrimValue([0, duration]);
                                    }}
                                >
                                    <span>Подтвердить</span>
                                </Button>
                            </>
                        ) : (
                            <>
                                <Button
                                    className="w-36"
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => setTrimming(true)}
                                >
                                    <ScrissorsCutIcon />
                                    <span>Обрезать</span>
                                </Button>
                                <Button
                                    className="w-36"
                                    onMouseDown={(e) => e.preventDefault()}
                                    disabled={loading}
                                    onClick={() => setEditing(true)}
                                >
                                    <Edit3 />
                                    <span>Переименовать</span>
                                </Button>
                                <Dialog
                                    dialogLabel="Уверены что хотите удалить файл?"
                                    description="Если удалите - восстановить его не получится!"
                                    size="sm"
                                    isCritical={true}
                                    trigger={
                                        <Button
                                            variant="destructive"
                                            onMouseDown={(e) =>
                                                e.preventDefault()
                                            }
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
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PlayerModal;
