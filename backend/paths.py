from pathlib import Path

def get_app_dir() -> Path:
  basedir: Path = Path(__file__).parent
  return basedir

def get_config_path() -> Path:
  root_path: Path = get_app_dir()
  config_path: Path = Path.joinpath(root_path, "config.json")
  return config_path

def get_logs_folder() -> Path:
  root_path: Path = get_app_dir()
  logs_folder_path: Path = Path.joinpath(root_path, "logs")
  return logs_folder_path

print(get_logs_folder())
