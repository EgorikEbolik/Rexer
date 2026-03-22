from pathlib import Path
import shutil
from time import sleep
from loguru import logger
from datetime import datetime
import asyncio

from tray import update_last_clip
from utils import play_sound
from settings import settings
from api import manager

MAX_WAIT_TIME = 30
STABLE_COUNT_REQUIRED = 3
CHECK_INTERVAL = 0.5

def notify_new_clip(clip_data: dict):
    """Отправляет уведомление о новом клипе через WebSocket."""
    logger.debug(f"notify_new_clip: active={len(manager.active)}, loop={manager.loop}")
    if not manager.active or manager.loop is None:
        logger.warning("Нет активных сокетов или loop не инициализирован")
        return
    try:
        asyncio.run_coroutine_threadsafe(
            manager.broadcast({"type": "new_clip", "clip": clip_data}),
            manager.loop
        )
    except RuntimeError as e:
        logger.error(f"Не удалось отправить уведомление: {e} (возможно, цикл событий закрыт)")
    except Exception as e:
        logger.exception(f"Неизвестная ошибка при отправке уведомления: {e}")

def apply_template(window: str, dt: datetime, template: str = None) -> str:
    """Применяет шаблон, заменяя токены на значения. При ошибке возвращает шаблон как есть."""
    if template is None:
        template = settings.data["filename_template"]
    tokens = {
        "window": window,
        "year": dt.strftime("%Y"),
        "month": dt.strftime("%m"),
        "day": dt.strftime("%d"),
        "hour": dt.strftime("%H"),
        "min": dt.strftime("%M"),
        "sec": dt.strftime("%S"),
    }
    try:
        return template.format_map(tokens)
    except KeyError as e:
        logger.warning(f"Неизвестный токен: {e}")
        return template
    except Exception as e:
        logger.warning(f"Ошибка при применении шаблона: {e}")
        return template

def wait_until_available(file_path: str | Path, timeout: int = MAX_WAIT_TIME) -> bool:
    """Ожидает, пока файл перестанет изменяться, не дольше timeout секунд. Возвращает True, если готов."""
    file_path = Path(file_path)
    if not file_path.exists():
        logger.error(f"Файл не существует: {file_path}")
        return False

    stable_count = 0
    last_size = -1
    elapsed = 0

    while stable_count < STABLE_COUNT_REQUIRED and elapsed < timeout:
        if last_size != -1:
            sleep(CHECK_INTERVAL)
            elapsed += CHECK_INTERVAL
        try:
            current_size = file_path.stat().st_size
        except (FileNotFoundError, PermissionError) as e:
            logger.debug(f"Файл временно недоступен: {e}")
            continue
        if current_size == last_size:
            stable_count += 1
        else:
            stable_count = 0
        last_size = current_size

    if elapsed >= timeout:
        logger.error(f"Таймаут ожидания файла {file_path}")
        return False
    logger.debug(f"Файл доступен: {file_path}")
    return True

def rename_file(file_path, window):
    """Переименовывает файл по шаблону и перемещает его."""
    try:
        dt = datetime.fromtimestamp(Path(file_path).stat().st_mtime)
        if not wait_until_available(file_path):
            logger.warning(f"Файл не готов, но пробуем обработать: {file_path}")

        file = Path(file_path)
        new_name = f"{apply_template(window, dt)}{file.suffix}"
        renamed = file.with_name(new_name)
        if renamed.exists():
            logger.warning(f"Файл {new_name} уже существует, будет перезаписан")
        file.replace(renamed)
        logger.info(f"Переименован: {file.name} -> {new_name}")

        new_file = move_file(renamed, window)
        if new_file is None:
            logger.error("Не удалось переместить файл")
            return

        notify_new_clip({
            "name": new_file.stem,
            "filename": new_file.name,
            "path": str(new_file),
            "size_mb": round(new_file.stat().st_size / (1024 * 1024), 2),
            "created_at": new_file.stat().st_mtime,
            "game": window if settings.data["sort_mode"] == "game" else None
        })

        if settings.data["sound_enabled"]:
            play_sound(settings.data["sound_file"])
    except FileNotFoundError:
        logger.error(f"Файл не найден: {file_path}")
    except PermissionError:
        logger.error(f"Нет доступа к файлу: {file_path}")
    except Exception as e:
        logger.exception(f"Неизвестная ошибка при обработке {file_path}: {e}")

def move_file(source_file_path, window):
    """Перемещает файл в папку назначения с учётом сортировки. Возвращает Path нового файла или None."""
    file_path = Path(source_file_path)
    if not file_path.exists():
        logger.error(f"Файл для перемещения не найден: {source_file_path}")
        return None

    file_name = file_path.name
    destination = Path(settings.data["dest_folder"])
    sort_mode = settings.data["sort_mode"]

    if sort_mode == "game":
        subfolder = window
    elif sort_mode == "date":
        dt = datetime.fromtimestamp(file_path.stat().st_mtime)
        subfolder = apply_template(window, dt, settings.data["sort_date_format"])
    else:
        subfolder = ""

    destination = destination / subfolder if subfolder else destination
    try:
        destination.mkdir(parents=True, exist_ok=True)
    except Exception as e:
        logger.error(f"Не удалось создать папку {destination}: {e}")
        return None

    new_file = destination / file_name
    if new_file.exists():
        logger.warning(f"Файл {new_file} уже существует, будет перезаписан")

    try:
        shutil.move(str(file_path), str(new_file))
        logger.info(f"Файл {source_file_path} перемещён в {new_file}")
    except Exception as e:
        logger.error(f"Ошибка при перемещении файла: {e}")
        return None

    update_last_clip(new_file.name, new_file)
    return new_file