from loguru import logger
import threading
import uvicorn
import ctypes
from tendo import singleton

from thumbnailsManager import clean_thumbnails
from webviewManager import run_webview
from logger import setup_logger
from settings import settings
from monitor import start_monitor
from tray import create_tray
from utils import get_autostart
from api import app

def start_api():
    uvicorn.run(app, host="127.0.0.1", port=8765, log_level="warning")

try:
    ctypes.windll.shcore.SetProcessDpiAwareness(2)
    setup_logger()

    logger.info("Приложение запущено")
    settings.data["autostart"] = get_autostart()

    me = singleton.SingleInstance()

    clean_thumbnails()

    monitor_thread = threading.Thread(target=start_monitor, daemon=True)
    monitor_thread.start()
    api_thread = threading.Thread(target=start_api, daemon=True)
    api_thread.start()

    tray_icon = create_tray()
    tray_thread = threading.Thread(target=tray_icon.run, daemon=False)
    tray_thread.start()
    run_webview()

    logger.info("Приложение завершено")
except singleton.SingleInstanceException:
    logger.info("Попытка повторного запуска, открыто текущее окно ")
except Exception as e:
    logger.error(f"Неизвестная ошибка приложения {e}")