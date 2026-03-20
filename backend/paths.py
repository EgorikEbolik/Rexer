from pathlib import Path
import sys

def get_app_dir() -> Path:
    if getattr(sys, 'frozen', False):
        return Path(sys.executable).parent
    else:
        return Path(__file__).parent

def get_static_dir() -> Path:
    if getattr(sys, 'frozen', False):
        return Path(sys._MEIPASS) / "static"
    else:
        return get_app_dir() / "static"

def get_config_path() -> Path:
  root_path: Path = get_app_dir()
  config_path: Path = Path.joinpath(root_path, "config.json")
  return config_path

def get_logs_folder() -> Path:
  root_path: Path = get_app_dir()
  logs_folder_path: Path = Path.joinpath(root_path, "logs")
  return logs_folder_path

def get_resources_folder() -> Path:
    if getattr(sys, 'frozen', False):
        return Path(sys.executable).parent / "resources"
    else:
        return get_app_dir().parent / "resources"

def get_bundled_resources_folder() -> Path:
    """внутри .exe"""
    if getattr(sys, 'frozen', False):
        return Path(sys._MEIPASS) / "resources"
    else:
        return get_app_dir().parent / "resources"

print(get_app_dir())