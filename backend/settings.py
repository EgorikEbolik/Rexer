from paths import get_config_path, get_bundled_resources_folder
from loguru import logger

import json
from pathlib import Path

class Settings:

  DEFAULTS = {
        "watch_folder": f"{Path.home() / 'Videos/Recordings'}",
        "dest_folder": f"{Path.home() / 'Videos/Clips'}",
        "sort_by_game": False,
        "sound_file": str(get_bundled_resources_folder() / 'done.wav'),
        "sound_enabled": True,
        "sound_volume": 0.5,
        "filename_template": "{window} {day}-{month}-{year} {hour}-{min}-{sec}",
        "sort_date_format": "{year}-{month}",  
        "sort_mode": "date",  # "game", "date", "none"
        "autostart": False

    }

  def __init__(self) -> None:
    self.data: dict = self.DEFAULTS.copy()
    self.load()

  def save(self):
    try:
      config_path = get_config_path()
      config_path.parent.mkdir(parents=True, exist_ok=True)
      with open(config_path, 'w') as file:
        json.dump(self.data, file, indent=2)
      logger.info(f"Настройки сохранены!")
    except (PermissionError, IOError) as e:
      logger.error(f"Нет доступа к файлу настроек {config_path}: {e}")
    except Exception as e:
      logger.error(f"Неизвестная ошибка при сохранении настроек: {e}")



  def load(self):
    config_path: Path = get_config_path()
    if Path.exists(config_path):
      with open(config_path) as file:
        config: dict= json.load(file)
      self.data = {**self.DEFAULTS, **config}
      logger.info("Загружены пользовательские настройки")
    else:
      self.data = self.DEFAULTS.copy()
      self.save()
      logger.info("Пользовательские настройки отсутствуют, загружены стандартные")

settings = Settings()
