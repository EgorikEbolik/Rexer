import sys
import shutil
import zipfile
from pathlib import Path

from loguru import logger

from utils import download_file
from paths import get_bin_dir


FFMPEG_EXE = "ffmpeg.exe" if sys.platform == "win32" else "ffmpeg"
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


def ensure_ffmpeg(broadcast_fn=None) -> bool:
    """Скачивает и распаковывает ffmpeg, если его нет"""
    
    def on_progress(pct):
        if broadcast_fn:
            broadcast_fn({"type": "ffmpeg_progress", "stage": "downloading", "percent": pct})
   
    if get_ffmpeg_path():
        return True

    logger.info("ffmpeg не найден, начинаем загрузку")

    bin_dir = get_bin_dir()
    bin_dir.mkdir(parents=True, exist_ok=True)
    zip_path = bin_dir / "ffmpeg.zip"

    try:
        download_file(FFMPEG_URL, zip_path, on_progress=on_progress)
        
        if broadcast_fn:
            broadcast_fn({"type": "ffmpeg_progress", "stage": "extracting", "percent": 0})
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

def extract_ffmpeg(zip_path: Path, bin_dir: Path) -> None:
    """Извлекает ffmpeg.exe из архива в bin_dir и удаляет временные папки"""
    logger.info("Распаковка архива...")

    before = set(bin_dir.iterdir())

    with zipfile.ZipFile(zip_path, "r") as zf:
        zf.extractall(bin_dir)

    new_dirs = [
        p for p in bin_dir.iterdir()
        if p.is_dir() and p not in before and p.name.startswith("ffmpeg")
    ]

    if not new_dirs:
        raise FileNotFoundError("Не найдена папка ffmpeg после распаковки архива")

    ffmpeg_dir = new_dirs[0]
    source = ffmpeg_dir / "bin" / FFMPEG_EXE

    if not source.exists():
        raise FileNotFoundError(f"'{FFMPEG_EXE}' не найден внутри архива (ожидался по пути: {source})")

    dest = bin_dir / FFMPEG_EXE
    shutil.move(str(source), str(dest))
    shutil.rmtree(ffmpeg_dir)
    logger.info(f"ffmpeg установлен: {dest}")