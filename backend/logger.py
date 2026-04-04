from loguru import logger
import sys
from paths import get_logs_folder
from settings import settings


def setup_logger():
    logger.remove()

    logger.add(
        sys.stderr,
        format="{time:DD.MM.YYYY HH:mm:ss} | {level} | {file}:{line} | {message}",
        level="DEBUG",
        colorize=True,
    )
    log_level = "DEBUG" if settings.data.get("debug", False) else "INFO"
    logger.add(
        get_logs_folder() / "log.log",
        format="{time:DD.MM.YYYY HH:mm:ss} | {level} | {file}:{line} | {message}",
        level=log_level,
        rotation="00:00",
        retention="7 days",
        enqueue=True,
    )

    if log_level == "DEBUG":
        logger.info("Приложение запущено в режиме отладки")
