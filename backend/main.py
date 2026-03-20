from loguru import logger
import threading
import uvicorn
import ctypes

from logger import setup_logger
from settings import settings
from monitor import start_monitor
from tray import create_tray
from utils import get_autostart
from api import app

def start_api():
    uvicorn.run(app, host="127.0.0.1", port=8765, log_level="warning")

ctypes.windll.shcore.SetProcessDpiAwareness(2)
setup_logger()

logger.info("Приложение запущено")
settings.data["autostart"] = get_autostart()

monitor_thread = threading.Thread(target=start_monitor, daemon=True)
monitor_thread.start()
api_thread = threading.Thread(target=start_api, daemon=True)
api_thread.start()
icon = create_tray()
icon.run()

logger.info("Приложение завершено")