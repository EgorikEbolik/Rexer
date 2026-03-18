from paths import get_config_path

import json
from pathlib import Path

class Settings:

  DEFAULTS = {
        "watch_folder": f"{Path.home() / "Videos/Recordings"}",
        "dest_folder": f"{Path.home() / "Videos/Clips"}",
        "sort_by_game": False,
        "sound_enabled": True,
    }

  def __init__(self) -> None:
    self.data: dict = self.DEFAULTS.copy()
    self.load()

  def save(self):
    config_path = get_config_path()
    config_path.parent.mkdir(parents=True, exist_ok=True)
    with open(config_path, 'w') as file:
        json.dump(self.data, file, indent=2)


  def load(self):
    config_path: Path = get_config_path()
    if Path.exists(config_path):
      with open(config_path) as file:
        config: dict= json.load(file)
      self.data = {**self.DEFAULTS, **config}
    else:
      self.data = self.DEFAULTS.copy()
      self.save()

settings = Settings()
