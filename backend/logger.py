from loguru import logger
import sys
from paths import get_logs_folder

def setup_logger():
  logger.remove()

  logger.add(
    sys.stderr,
    format="{time:DD.MM.YYYY HH:mm:ss} | {level} | {message}",
    level="DEBUG"
  )

  logger.add(
    get_logs_folder() / "log.log",
    format="{time:DD.MM.YYYY HH:mm:ss} | {level} | {message}",
    level="INFO",
    rotation="00:00",
    retention="7 days"
  )