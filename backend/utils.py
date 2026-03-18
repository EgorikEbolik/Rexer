from pathlib import Path
from loguru import logger


def create_folder(folder_path:Path | str):
  path = Path(folder_path)
  try:
    if path.exists():
          return False
    
    path.mkdir(parents=True)
    logger.info(f"Создана папка {folder_path} ")
    return True
  except Exception:
     logger.error(f"Ошибка при создании папки {folder_path}")
     return False