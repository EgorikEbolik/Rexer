import watchdog.events
import watchdog.observers
import time
from loguru import logger
from fileProcessor import rename_file
from windowHandler import get_active_window
from settings import settings

from utils import create_folder

class Monitor(watchdog.events.PatternMatchingEventHandler):
    
    video_extensions : list =  [
      '*.mp4', '*.avi', '*.mov', '*.mkv', '*.wmv', '*.flv', '*.webm',
      '*.m4v', '*.mpg', '*.mpeg', '*.3gp', '*.ogv', '*.vob', '*.ts',
      '*.m2ts', '*.mts', '*.rm', '*.rmvb', '*.divx', '*.xvid'
    ]

    def __init__(self):
      super().__init__(patterns=self.video_extensions,
                          ignore_directories=True, case_sensitive=False)

    def on_created(self, event):
      try:
        window = get_active_window()
        logger.info(f"Появился новый файл {event.src_path}")
        rename_file(event.src_path, window)
        
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