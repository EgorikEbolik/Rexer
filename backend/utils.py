from pathlib import Path
import winreg
import sys
import requests
import sounddevice as sd
import soundfile as sf
from loguru import logger
import os

from settings import settings

APP_NAME = "Rexer"
VIDEO_EXTENSIONS: list = ["*.mp4", "*.mov", "*.mkv", "*.webm", "*.m4v"]


def create_folder(folder_path: Path | str) -> bool:
    """Создаёт папку, если её нет. Возвращает True при успехе или если папка уже существует."""
    try:
        path = Path(folder_path)
        if path.exists():
            return path.is_dir()
        path.mkdir(parents=True, exist_ok=True)
        logger.info(f"Создана папка: {folder_path}")
        return True
    except Exception as e:
        logger.exception(f"Ошибка при создании папки {folder_path}: {e}")
        return False


def play_sound(sound_file: str | Path, volume: float = None) -> bool:
    """Воспроизводит звуковой файл с заданной громкостью. Возвращает True при успехе."""
    try:
        sound_path = Path(sound_file)
        if not sound_path.exists():
            logger.error(f"Звуковой файл не найден: {sound_file}")
            return False
        if volume is None:
            volume = settings.data.get("notification_volume", 0.5)
        volume = max(0.0, min(1.0, volume))
        data, samplerate = sf.read(str(sound_path))
        sd.play(data * volume, samplerate)
        logger.debug(f"Воспроизведён звук: {sound_file}, громкость: {volume:.0%}")
        return True
    except Exception as e:
        logger.exception(f"Ошибка воспроизведения звука {sound_file}: {e}")
        return False


def set_autostart(enabled: bool) -> bool:
    """Включает/отключает автозапуск в реестре Windows. Возвращает True при успехе."""
    try:
        key = winreg.OpenKey(
            winreg.HKEY_CURRENT_USER,
            r"Software\Microsoft\Windows\CurrentVersion\Run",
            0,
            winreg.KEY_SET_VALUE,
        )
        if enabled:
            exe_path = sys.executable
            if not os.path.exists(exe_path):
                logger.error(f"Исполняемый файл не найден: {exe_path}")
                return False
            winreg.SetValueEx(key, APP_NAME, 0, winreg.REG_SZ, exe_path)
            logger.info(f"Автозапуск включён")
        else:
            try:
                winreg.DeleteValue(key, APP_NAME)
                logger.info("Автозапуск отключён")
            except FileNotFoundError:
                pass
        winreg.CloseKey(key)
        return True
    except Exception as e:
        logger.exception(f"Ошибка изменения автозапуска: {e}")
        return False


def get_autostart() -> bool:
    """Проверяет, включён ли автозапуск. Возвращает True, если запись существует и файл доступен."""
    try:
        key = winreg.OpenKey(
            winreg.HKEY_CURRENT_USER,
            r"Software\Microsoft\Windows\CurrentVersion\Run",
            0,
            winreg.KEY_READ,
        )
        try:
            value, _ = winreg.QueryValueEx(key, APP_NAME)
            winreg.CloseKey(key)
            return os.path.exists(value)
        except FileNotFoundError:
            winreg.CloseKey(key)
            return False
    except FileNotFoundError:
        return False
    except Exception as e:
        logger.exception(f"Ошибка проверки автозапуска: {e}")
        return False


def download_file(url: str, dest: Path, timeout=60, on_progress=None) -> None:
    """Скачивает файл по url"""
    logger.info(f"Загрузка: {url}")
    response = requests.get(url, stream=True, timeout=timeout)
    response.raise_for_status()

    total = int(response.headers.get("content-length", 0))
    downloaded = 0
    last_progress = -1

    with open(dest, "wb") as f:
        for chunk in response.iter_content(chunk_size=65536):
            f.write(chunk)
            downloaded += len(chunk)
            if total:
                progress = downloaded * 100 // total
                if progress != last_progress:
                    logger.debug(
                        f"Загружено: {progress}%  ({downloaded // 1024 // 1024} МБ / {total // 1024 // 1024} МБ)"
                    )
                    last_progress = progress
                if on_progress:
                    on_progress(progress)
    logger.info(f"Файл сохранён: {dest}")


# возвращает время в формате HH.MM.SS.mmm (00:00:05.000)
def format_time_millisec(seconds: float) -> str:
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = seconds % 60
    return f"{hours:02d}:{minutes:02d}:{secs:06.3f}"
