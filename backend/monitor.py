import threading

import watchdog.events
import watchdog.observers
from loguru import logger

from thumbnailsManager import generate_thumbnail, generate_tileset
from windowHandler import get_active_window
from fileProcessor import process_clip
from settings import settings
from utils import VIDEO_EXTENSIONS, create_folder


class FileMonitor(watchdog.events.PatternMatchingEventHandler):

    def __init__(
        self,
        folder_to_watch: str,
        monitor_name: str,
        extensions: list[str],
        is_recursive: bool = False,
    ):
        self.folder_to_watch = folder_to_watch
        self.is_recursive = is_recursive
        self.monitor_name = monitor_name
        self.extensions = extensions
        self.observer = None

        super().__init__(
            patterns=self.extensions, ignore_directories=True, case_sensitive=False
        )

    def on_created(self, event):
        try:
            window = get_active_window()
            logger.info(f"Появился новый файл {event.src_path}")
            new_file = process_clip(event.src_path, window)
            if new_file:
                generate_thumbnail(new_file)
                threading.Thread(
                    target=generate_tileset, args=(new_file,), daemon=True
                ).start()
        except Exception as e:
            logger.error(f"Ошибка при обработке файла {event.src_path}: {e}")

    def start_monitor(self):
        create_folder(self.folder_to_watch)
        if self.observer is not None:
            logger.warning("Observer уже запущен - останавливаем")
            self.stop_monitor()
        self.observer = watchdog.observers.Observer()
        event_handler = self
        self.observer.schedule(
            event_handler, path=self.folder_to_watch, recursive=self.is_recursive
        )
        self.observer.start()
        logger.debug(f"Монитор {self.monitor_name} запущен")

    def stop_monitor(self):
        if self.observer is not None and self.observer.is_alive():
            self.observer.stop()
            self.observer.join()
            self.observer = None
            logger.debug(f"Монитор {self.monitor_name} остановлен")

    def update_args(
        self,
        folder_to_watch: str = None,
        monitor_name: str = None,
        extensions: list[str] = None,
        is_recursive: bool = False,
    ):
        if folder_to_watch:
            self.stop_monitor()
            self.folder_to_watch = folder_to_watch
            self.start_monitor()
        if monitor_name:
            self.monitor_name = monitor_name
        if extensions:
            self.extensions = extensions
        if is_recursive:
            self.is_recursive = is_recursive


video_monitor = FileMonitor(
    settings.data["watch_folder"], "новые видео", VIDEO_EXTENSIONS
)
