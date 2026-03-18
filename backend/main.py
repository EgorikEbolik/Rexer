from logger import setup_logger
from loguru import logger
from monitor import start_monitor
setup_logger()
logger.debug("Приложение запущено")

start_monitor()