import subprocess
import sys

from utils import VIDEO_EXTENSIONS, format_time_millisec
from paths import get_cache_dir
from ffmpegManager import get_ffmpeg_bin, get_video_info, run_ffmpeg
from settings import settings

from hashlib import md5
from urllib.parse import quote
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


def get_vtt_path(clip_path: Path | str) -> Path:
    hash = create_hash(Path(clip_path))
    return get_cache_dir() / hash / "tilest.vtt"


def generate_tileset(
    clip_path: Path | str,
    tile_item_width: int = 150,
    tile_x_count: int = 10,
    interval_sec: int = 1,
    quallity: int = 10,
) -> Path | None:
    try:
        clip_path = Path(clip_path)
        tileset_path = get_tileset_path(clip_path)

        if tileset_path.exists():
            logger.debug(f"тайлсет для видео {clip_path.stem} уже существует")
            return tileset_path

        video_info = get_video_info(clip_path)
        if not video_info:
            logger.error(f"Не удалось получить информацию о видео {clip_path.name}")
            return None

        fps = video_info["fps"]
        duration = video_info["duration"]
        width = video_info["resolution"][0]
        height = video_info["resolution"][1]

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
        # последний ряд может быть неполным
        tile_y_count = (selected_frames + tile_x_count - 1) // tile_x_count
        tile_height = round(height * (tile_item_width / width))

        tileset_path.parent.mkdir(parents=True, exist_ok=True)

        input_kwargs = {"threads": 0, "hwaccel": "auto", "skip_frame": "nokey"}

        ffmpeg_command = (
            ffmpeg.input(str(clip_path), **input_kwargs)
            .filter("fps", fps=f"1/{interval_sec}")
            .filter("scale", tile_item_width, -1)
            .filter("tile", f"{tile_x_count}x{tile_y_count}")
            .output(str(tileset_path), vframes=1, **{"q:v": quallity})
        )
        logger.debug(f"video info: {video_info}")
        if not run_ffmpeg(ffmpeg_command):
            logger.error(
                f"Не удалось выполнить команду ffmpeg при генерации тайлсета для видео: {clip_path.name}"
            )
            return None
        generate_vtt_for_tileset(
            clip_path,
            tileset_path,
            duration,
            selected_frames,
            interval_sec,
            tile_item_width,
            tile_height,
            tile_x_count,
        )
        logger.debug(
            f"Создан тайлсет для видео {clip_path.name}, по пути: {tileset_path}"
        )
        return tileset_path
    except Exception as e:
        logger.exception(
            f"Ошибка при создании тайлсета для видео {clip_path.name}, {e}"
        )
        return None


def generate_vtt_for_tileset(
    clip_path: Path,
    tileset_path: Path,
    duration: float,
    selected_frames: int,
    interval_sec: int,
    tile_item_width: int,
    tile_height: int,
    tile_x_count: int,
) -> Path | None:
    vtt_content = ["WEBVTT", ""]
    base_url = f"/clips/tileset?path={quote(str(clip_path))}"
    for idx in range(selected_frames):
        start_time = idx * interval_sec
        end_time = (idx + 1) * interval_sec
        if idx == selected_frames - 1:
            end_time = duration

        start_str = format_time_millisec(start_time)
        end_str = format_time_millisec(end_time)

        row = idx // tile_x_count
        col = idx % tile_x_count
        x = col * tile_item_width
        y = row * tile_height

        vtt_content.append(f"{start_str} --> {end_str}")
        vtt_content.append(f"{base_url}#xywh={x},{y},{tile_item_width},{tile_height}")
        vtt_content.append("")

    vtt_path = tileset_path.with_suffix(".vtt")
    try:
        with open(vtt_path, "w", encoding="utf-8") as f:
            f.write("\n".join(vtt_content))
        logger.debug(f"Создан VTT для тайлсета: {vtt_path}")
        return vtt_path
    except Exception as e:
        logger.exception(f"Ошибка при сохранении VTT файла: {e}")
        return None


def generate_thumbnail(clip_path: Path, thumbnail_width: int = 450) -> Path:
    try:
        clip_path = Path(clip_path)
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


def clean_video_cache():
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
