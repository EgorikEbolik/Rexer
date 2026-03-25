import subprocess
import sys
import shutil
import zipfile
from pathlib import Path

import ffmpeg
from loguru import logger

from utils import download_file
from paths import get_bin_dir


FFMPEG_EXE = "ffmpeg.exe" if sys.platform == "win32" else "ffmpeg"
FFPROBE_EXE = "ffprobe.exe" if sys.platform == "win32" else "ffprobe"
FFMPEG_URL = "https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip"


def get_ffmpeg_path() -> Path | None:
    """Возвращает путь к ffmpeg, если найден локально или в PATH."""
    local_ffmpeg = get_bin_dir() / FFMPEG_EXE
    if local_ffmpeg.exists():
        return local_ffmpeg

    ffmpeg_in_path = shutil.which(FFMPEG_EXE)
    if ffmpeg_in_path:
        return Path(ffmpeg_in_path)

    return None


def get_ffprobe_path() -> Path | None:
    local_ffprobe = get_bin_dir() / FFPROBE_EXE
    if local_ffprobe.exists():
        return local_ffprobe

    ffprobe_in_path = shutil.which(FFPROBE_EXE)
    if ffprobe_in_path:
        return Path(ffprobe_in_path)

    return None


def ensure_ffmpeg(broadcast_fn=None) -> bool:
    """Скачивает и распаковывает ffmpeg, если его нет"""

    def on_progress(pct):
        if broadcast_fn:
            broadcast_fn(
                {"type": "ffmpeg_progress", "stage": "downloading", "percent": pct}
            )

    if get_ffmpeg_path():
        return True

    logger.info("ffmpeg не найден, начинаем загрузку")

    bin_dir = get_bin_dir()
    bin_dir.mkdir(parents=True, exist_ok=True)
    zip_path = bin_dir / "ffmpeg.zip"

    try:
        download_file(FFMPEG_URL, zip_path, on_progress=on_progress)

        if broadcast_fn:
            broadcast_fn(
                {"type": "ffmpeg_progress", "stage": "extracting", "percent": 0}
            )
        extract_ffmpeg(zip_path, bin_dir)

        if broadcast_fn:
            broadcast_fn({"type": "ffmpeg_ready"})

        logger.info("ffmpeg успешно загружен и готов к работе")
        return True

    except Exception as e:
        logger.exception("Ошибка загрузки ffmpeg")
        if broadcast_fn:
            broadcast_fn({"type": "ffmpeg_error", "message": str(e)})
        return False

    finally:
        if zip_path.exists():
            zip_path.unlink(missing_ok=True)


def get_ffmpeg_bin() -> str:
    """
    Возвращает путь к исполняемому файлу ffmpeg
    При отсутствии - пытается скачать автоматически
    Выбрасывает RuntimeError, если ffmpeg недоступен
    """
    path = get_ffmpeg_path()

    if not path:
        logger.info("ffmpeg не найден, попытка автозагрузки...")
        if ensure_ffmpeg():
            path = get_ffmpeg_path()

    if not path:
        logger.error("ffmpeg недоступен после попытки загрузки")
        raise RuntimeError(
            f"ffmpeg не найден. Скачайте его по ссылке '{FFMPEG_URL}' "
            f"и поместите '{FFMPEG_EXE}' в папку 'bin' рядом с приложением."
        )

    return str(path)


def get_ffprobe_bin() -> str:
    path = get_ffprobe_path()

    if not path:
        logger.info("ffprobe не найден, попытка автозагрузки...")
        if ensure_ffmpeg():
            path = get_ffprobe_path()

    if not path:
        logger.error("ffprobe недоступен после попытки загрузки")
        raise RuntimeError(
            f"ffprobe не найден. Скачайте его по ссылке '{FFPROBE_EXE}' "
            f"и поместите '{FFPROBE_EXE}' в папку 'bin' рядом с приложением."
        )

    return str(path)


def extract_ffmpeg(zip_path: Path, bin_dir: Path) -> None:
    """Извлекает ffmpeg.exe из архива в bin_dir и удаляет временные папки"""
    logger.info("Распаковка архива...")

    before = set(bin_dir.iterdir())

    with zipfile.ZipFile(zip_path, "r") as zf:
        zf.extractall(bin_dir)

    new_dirs = [
        p
        for p in bin_dir.iterdir()
        if p.is_dir() and p not in before and p.name.startswith("ffmpeg")
    ]

    if not new_dirs:
        raise FileNotFoundError("Не найдена папка ffmpeg после распаковки архива")

    ffmpeg_dir = new_dirs[0]
    source_dir = ffmpeg_dir / "bin"

    if not source_dir.exists():
        raise FileNotFoundError(f"'Папка bin не найдена внутри архива)")

    for file in source_dir.iterdir():
        if file.is_file():
            dest = bin_dir / file.name
            shutil.move(str(file), str(dest))

    shutil.rmtree(ffmpeg_dir)
    logger.info(f"ffmpeg установлен: {bin_dir}")


# ffmpeg при стандартном выполнении открывает окно консоли на милисекунду,
# поэтому запускаем задачу в подпроцессе, в котором можно контроллировать появление консоли
# (пока только на windows)
def run_ffmpeg(ffmpeg_action, is_debug: bool = False) -> bool:
    try:
        args = ffmpeg.compile(ffmpeg_action, cmd=get_ffmpeg_bin())
        run_kwargs = {"stdin": subprocess.DEVNULL}

        if not is_debug and sys.platform == "win32":
            run_kwargs["creationflags"] = subprocess.CREATE_NO_WINDOW

        result = subprocess.run(args, capture_output=True, text=True, **run_kwargs)

        if result.returncode != 0:
            logger.error(f"ffmpeg ошибка: {result.stderr}")
            return False
        return True
    except Exception as e:
        logger.exception(f"Ошибка выполнения ffmpeg: {e}")
        return False


def get_video_info(video_path: Path | str, is_exact: bool = False) -> dict:
    try:
        video_path = Path(video_path)
        ffprobe_path = get_ffprobe_path()
        probe = ffmpeg.probe(video_path, cmd=str(ffprobe_path))
        video_stream = next(
            (stream for stream in probe["streams"] if stream["codec_type"] == "video"),
            None,
        )

        video_info: dict = {}
        if not video_stream:
            logger.error(f"В файле {video_path.name} не найден видео поток")
            return None

        codec = video_stream["codec_name"]
        resolution = [
            int(video_stream["width"]),
            int(video_stream["height"]),
        ]
        duration = (
            float(probe["format"]["duration"])
            if is_exact
            else round(float(probe["format"]["duration"]))
        )
        bitrate = int(video_stream["bit_rate"])
        # video_stream["avg_frame_rate"] дает строку вида "120/4" или 24000/1001
        # для получения кадров в секнду делим первое число на второе
        num, den = video_stream["avg_frame_rate"].split("/")
        fps = float(num) / float(den)

        video_info.update(
            {
                "codec": codec,
                "resolution": resolution,
                "duration": duration,
                "bitrate": bitrate,
                "fps": fps,
            }
        )
        logger.debug(f"Успешно получена информация о видео {video_path}")
        return video_info
    except Exception as e:
        logger.exception(
            f"При получении информации о видео {video_path} произошла ошибка:\n{e}"
        )
        return None
