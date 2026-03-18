from pathlib import Path

from win32gui import GetForegroundWindow
from win32process import GetWindowThreadProcessId
from win32api import GetFileVersionInfo
import psutil
from loguru import logger

def get_product_name(exe_path:str):
  try:
    languages = GetFileVersionInfo(str(exe_path), "\\VarFileInfo\\Translation")
    codepage = "{:04X}{:04X}".format(languages[0][0], languages[0][1])
        
    product_name = GetFileVersionInfo(exe_path, f"\\StringFileInfo\\{codepage}\\ProductName")
    if product_name:
      return str(product_name)
            
    file_description = GetFileVersionInfo(exe_path, f"\\StringFileInfo\\{codepage}\\FileDescription")
    if file_description:
      return str(file_description)
            
  except Exception as e:
    logger.warning(f"Не удалось получить метаданные {exe_path}: {e}")
  return None

def get_active_window():
  exclude_paths = ["C:\\Windows\\System32\\", "C:\\Windows\\SysWOW64\\"]
  
  hwnd = GetForegroundWindow()
  _, proces_id = GetWindowThreadProcessId(hwnd)
  
  try:
    process = psutil.Process(proces_id)
    exe_path = process.exe()
  except (psutil.AccessDenied, psutil.NoSuchProcess) as e:
    logger.warning(f"Нет доступа к процессу {proces_id}: {e}")
    return "Unknown"
  
  if any(path in exe_path for path in exclude_paths):
    return "Unknown"
  
  product_name = get_product_name(exe_path)
  if not product_name:
    product_name = Path(exe_path).stem 
  
  logger.debug(f"HWIND: {hwnd}, procesID: {proces_id}, process: {process}, name: {product_name}")
  logger.info(f"Текущее окно: {product_name}, процесс: {process}")
  return product_name



if __name__ == "__main__":
    import time
    try:
      while True:
        get_active_window()
        time.sleep(2)
    except KeyboardInterrupt as keyboard:
      logger.debug("Пользователь остановил определение окна")