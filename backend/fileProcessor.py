from pathlib import Path
from time import sleep
from loguru import logger
from datetime import datetime
  
from tray import update_last_clip
from utils import play_sound
from settings import settings

TOKENS = {
    "window":  "название окна",
    "year":  "2026",
    "month": "03",
    "day":   "19",
    "hour":  "15",
    "min":   "30",
    "sec":   "22",
}

def apply_template(window: str, dt: datetime, template: str = None) -> str:
    if template is None:
      template = settings.data["filename_template"]
    
    tokens = {
        "window":  window,
        "year":  dt.strftime("%Y"),
        "month": dt.strftime("%m"),
        "day":   dt.strftime("%d"),
        "hour":  dt.strftime("%H"),
        "min":   dt.strftime("%M"),
        "sec":   dt.strftime("%S"),
    }
    try:
        return template.format_map(tokens)
    except KeyError as e:
        logger.warning(f"Неизвестный токен: {e}")
        return template

def wait_until_available(file_path):
    stable_count = 0
    last_size = -1
    
    while stable_count < 3: 
        if last_size != -1:sleep(0.5)
        current_size = Path(file_path).stat().st_size
        
        if current_size == last_size:
            stable_count += 1
        else:
            stable_count = 0 
        
        last_size = current_size
    logger.debug(f"файл доступен {file_path}")

def rename_file(file_path, window):
  try:
    dt = datetime.fromtimestamp(Path(file_path).stat().st_mtime)
    wait_until_available(file_path)

    file = Path(file_path)
    new_name = f"{apply_template(window, dt)}{file.suffix}"
    renamed = file.with_name(new_name)
    file.replace(renamed)
    logger.info(f"Переименован: {file.name} -> {new_name}")
    move_file(renamed, window)
    play_sound(settings.data["sound_file"])
  except FileNotFoundError:
    logger.error(f"Файл не найден: {file_path}")
  except PermissionError:
    logger.error(f"Нет доступа к файлу: {file_path}")
  except Exception as e:
    logger.error(f"Неизвестная ошибка при обработке {file_path}: {e}")


def move_file(source_file_path, window):
  file_path = Path(source_file_path)
  file = file_path.name
  destination = Path(settings.data["dest_folder"])
  sort_mode = settings.data["sort_mode"]


  if sort_mode == "game":
    subfolder = window
  elif sort_mode == "date":
    dt = datetime.fromtimestamp(file_path.stat().st_mtime)
    subfolder = apply_template(window, dt, settings.data["sort_date_format"])
  else:
    subfolder = ""

  destination = destination / subfolder
  destination.mkdir(parents=True, exist_ok=True)
  new_file = Path.joinpath(destination, file)

  file_path.replace(new_file)
  update_last_clip(new_file.name, new_file)

  logger.info(f"файл {source_file_path} перемещен в {new_file}")



if __name__ == "__main__":
  #----ТЕСТ WAIT_UNTIL_AVAILABLE----  
  # import threading
  
  # test_file = Path("test_video.mp4")
  
  # def write_file():
  #     with open(test_file, 'wb') as f:
  #         for i in range(5):
  #             f.write(b"0" * 1024 * 1024)  # пишем 1МБ
  #             logger.debug(f"Записано {i+1} МБ")
  #             sleep(1)
  #     logger.debug("Запись завершена")
  
  # # Запускаем запись в фоне
  # thread = threading.Thread(target=write_file)
  # thread.start()
  
  # sleep(0.3)  
  
  # wait_until_available(test_file)
  
  # thread.join()
  # test_file.unlink()  # удалить тестовый файл
  
  #--------

  #----ТЕСТ APPLY_TEMPLATE----
  # dt = datetime.now()  
  print(apply_template("", dt))
  #------

  #----ТЕСТ move_file----

  # move_file("C:\\Users\\Egor\\Documents\\Projects\\Rexer\\test.txt")