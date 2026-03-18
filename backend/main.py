from loguru import logger
import threading

from logger import setup_logger
from settings import settings
from monitor import start_monitor
from tray import create_tray
from utils import get_autostart
setup_logger()
logger.info("Приложение запущено")

settings.data["autostart"] = get_autostart()

monitor_thread = threading.Thread(target=start_monitor, daemon=True)
monitor_thread.start()
icon = create_tray()
icon.run()
logger.info("Приложение завершено")