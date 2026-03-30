import threading
import ctypes
import time

import requests
from loguru import logger
import uvicorn
from tendo import singleton

from thumbnailsManager import check_cache, clean_cache
from webviewManager import run_webview
from logger import setup_logger
from settings import settings
from tray import create_tray
from utils import get_autostart
from api import app, make_broadcast_fn
from ffmpegManager import ensure_ffmpeg
from monitor import video_monitor
from state import manager


def wait_for_server(url: str = "http://127.0.0.1:8765", timeout: float = 15.0):
    deadline = time.time() + timeout
    while time.time() < deadline:
        try:
            requests.get(url, timeout=1)
            return True
        except Exception:
            time.sleep(0.1)
    logger.warning("Сервер не ответил за отведённое время")
    return False


def start_api():
    uvicorn.run(app, host="127.0.0.1", port=8765, log_level="warning")


def background_init():
    # ждём пока FastAPI lifespan установит loop в менеджере
    deadline = time.time() + 10
    while manager.loop is None and time.time() < deadline:
        time.sleep(0.05)

    broadcast_fn = make_broadcast_fn(manager.loop, manager) if manager.loop else None
    ensure_ffmpeg(broadcast_fn)
    check_cache()
    clean_cache()


try:
    ctypes.windll.shcore.SetProcessDpiAwareness(2)
    setup_logger()

    logger.info("Приложение запущено")
    settings.data["autostart"] = get_autostart()

    me = singleton.SingleInstance()

    monitor_thread = threading.Thread(target=video_monitor.start_monitor, daemon=True)
    monitor_thread.start()

    api_thread = threading.Thread(target=start_api, daemon=True)
    api_thread.start()

    wait_for_server()

    tray_icon = create_tray()
    tray_thread = threading.Thread(target=tray_icon.run, daemon=False)
    tray_thread.start()

    bg_thread = threading.Thread(target=background_init, daemon=True)
    bg_thread.start()

    run_webview()

    logger.info("Приложение завершено")
except singleton.SingleInstanceException:
    logger.info("Попытка повторного запуска, открыто текущее окно")
except Exception as e:
    logger.exception(f"Неизвестная ошибка приложения {e}")
