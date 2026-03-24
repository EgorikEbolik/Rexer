import threading

import watchdog.events
import watchdog.observers
import time
from loguru import logger
from thumbnailsManager import generate_thumbnail, generate_tileset
from fileProcessor import rename_file
from windowHandler import get_active_window
from settings import settings

from utils import VIDEO_EXTENSIONS, create_folder


class Monitor(watchdog.events.PatternMatchingEventHandler):

    def __init__(self):
        super().__init__(
            patterns=VIDEO_EXTENSIONS, ignore_directories=True, case_sensitive=False
        )

    def on_created(self, event):
        try:
            window = get_active_window()
            logger.info(f"Появился новый файл {event.src_path}")
            new_file = rename_file(event.src_path, window)
            generate_thumbnail(new_file)
            threading.Thread(
                target=generate_tileset, args=(new_file,), daemon=True
            ).start()
        except Exception as e:
            logger.error(f"Ошибка при обработке файла {event.src_path}: {e}")


def start_monitor():
    folder_to_watch = settings.data["watch_folder"]
    create_folder(folder_to_watch)
    event_handler = Monitor()
    observer = watchdog.observers.Observer()
    observer.schedule(event_handler, path=folder_to_watch, recursive=False)
    observer.start()
    time.sleep(1)
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        observer.stop()
    finally:
        logger.info("Работа монитора завершена")
    observer.join()
