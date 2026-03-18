from pathlib import Path
import winreg
import sys
import sounddevice as sd
import soundfile as sf
from loguru import logger

from settings import settings

APP_NAME = "Rexer"

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
  

def play_sound(sound_file, volume: float = None):
  if volume is None:
     volume =  settings.data["sound_volume"] 
  data, samplerate = sf.read(sound_file)
  sd.play(data * volume, samplerate)

def set_autostart(enabled: bool):
  key = winreg.OpenKey(
      winreg.HKEY_CURRENT_USER,
      r"Software\Microsoft\Windows\CurrentVersion\Run",
      0, winreg.KEY_SET_VALUE
  )
  if enabled:
    exe = sys.executable
    winreg.SetValueEx(key, APP_NAME, 0, winreg.REG_SZ, exe)
    logger.info("Автозапуск включен")
  else:
    try:
      winreg.DeleteValue(key, APP_NAME)      
    except Exception as e:
      logger.error("Не удалось удалить программу из автозапуска")  

def get_autostart() -> bool:
  try:
      key = winreg.OpenKey(
          winreg.HKEY_CURRENT_USER,
          r"Software\Microsoft\Windows\CurrentVersion\Run",
          0, winreg.KEY_READ 
      )
      winreg.QueryValueEx(key, APP_NAME) 
      return True
  except FileNotFoundError:
      logger.info("Ключ автостарта не найден")
      return False
