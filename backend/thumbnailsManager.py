import subprocess
import sys

from utils import VIDEO_EXTENSIONS
from paths import get_cache_dir
from ffmpegManager import get_ffmpeg_bin, get_video_info, run_ffmpeg
from settings import settings

from hashlib import md5
from pathlib import Path
from shutil import rmtree
import ffmpeg
from loguru import logger


def create_hash(to_hash) -> str:
    return md5(str(to_hash).encode()).hexdigest()


def get_thumbnail_path(clip_path: Path | str) -> Path:
    hash = create_hash(Path(clip_path))
    thumbnail_path = get_cache_dir() / hash / "thumbnail.jpg"
    return thumbnail_path


def get_tileset_path(clip_path: Path | str) -> Path:
    hash = create_hash(Path(clip_path))
    return get_cache_dir() / hash / "tilest.jpg"


def generate_tiles(
    clip_path: Path | str,
    tile_item_width: int = 320,
    tile_x_count: int = 10,
    interval_sec: int = 1,
) -> Path | None:
    try:
        clip_path = Path(clip_path)
        tileset_path = get_tileset_path(clip_path)

        if tileset_path.exists():
            logger.debug(f"тайлсет для видео {clip_path.stem} уже существует")
            return tileset_path

        video_info = get_video_info(clip_path)
        fps = video_info["fps"]
        duration = video_info["duration"]
        total_frames = int(duration * fps)

        if total_frames == 0:
            logger.error(f"Видео {clip_path.name} не содержит кадров")
            return None
        frame_interval = round(fps * interval_sec)
        selected_frames = total_frames // frame_interval

        # для коротких видео 1 кадр
        if selected_frames == 0:
            selected_frames = 1
            frame_interval = total_frames

        tile_y_count = (selected_frames + tile_x_count - 1) // tile_x_count

        tileset_path.parent.mkdir(parents=True, exist_ok=True)
        ffmpeg_command = (
            ffmpeg.input(str(Path(clip_path)))
            .filter("select", f"not(mod(n,{frame_interval}))")
            .filter("scale", tile_item_width, -1)
            .filter("tile", f"{tile_x_count}x{tile_y_count}")
            .output(str(tileset_path), vframes=1, fps_mode="vfr")
        )
        if not run_ffmpeg(ffmpeg_command, is_debug=True):
            logger.error(
                f"Не удалось выполнить команду ffmpeg при генерации тайлсета для видео: {clip_path.name}"
            )
            return None

        logger.debug(
            f"Создан тайлсет для видео {clip_path.name}, по пути: {tileset_path}"
        )
        return tileset_path
    except Exception as e:
        logger.exception(
            f"Ошибка при создании тайлсета для видео {clip_path.name}, {e}"
        )


def generate_thumbnail(clip_path: Path, thumbnail_width: int = 450) -> Path:
    clip_path = Path(clip_path)

    run_kwargs = {"cmd": get_ffmpeg_bin(), "quiet": True}
    if sys.platform == "win32":
        run_kwargs["creationflags"] = subprocess.CREATE_NO_WINDOW

    try:
        thumbnail_path = get_thumbnail_path(clip_path)
        if thumbnail_path.exists():
            logger.debug(f"Обложка для видео {clip_path.stem} уже существует")
            return thumbnail_path

        thumbnail_path.parent.mkdir(parents=True, exist_ok=True)
        stream = (
            ffmpeg.input(str(clip_path))
            .filter("scale", thumbnail_width, -1)
            .output(str(thumbnail_path), vframes=1)
        )

        run_ffmpeg(stream)
        logger.debug(f"Создана обложка {thumbnail_path} для видео {clip_path.stem}")
        return thumbnail_path
    except Exception as e:
        logger.error(f"Не удалось создать обложку для видео {clip_path}, ошибка: \n{e}")
        return None


def clean_thumbnails():
    dest_folder = settings.data["dest_folder"]
    get_cache_dir().mkdir(parents=True, exist_ok=True)
    hash_set = set()
    deleted_set = set()

    for extension in VIDEO_EXTENSIONS:
        for file_path in Path(dest_folder).rglob(extension):
            hash_set.add(get_thumbnail_path(file_path).parent.name)

    for dir in get_cache_dir().iterdir():
        if dir.name not in hash_set:
            rmtree(dir)
            deleted_set.add(dir)

    logger.debug(
        f"Очищен кэш от {len(deleted_set)} удаленных видео, список удаленного: {deleted_set}"
    )
    return deleted_set


print(
    generate_tiles(
        "C:\\Users\\Egor\\Videos\\Clips\\2025-01\\Операционная система Microsoft® Windows® 23-01-2025 21-47-44.mp4"
    )
)
