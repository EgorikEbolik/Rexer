from loguru import logger
import pystray
from PIL import Image
import subprocess
import os


from settings import settings
from webviewManager import show_window, close_window
from paths import get_resources_folder, get_bundled_resources_folder

last_clip = ""
last_clip_path = ""
tray_icon = None


def open_ui():
    show_window()

def open_clips_folder():
  folder = settings.data["dest_folder"]
  subprocess.Popen(["explorer", folder])

def open_last_clip():
  os.startfile(last_clip_path)

def get_last_clip_title(item):
    return f"Последний клип: {last_clip or 'нет'}"

def update_last_clip(clip_name: str, clip_path):
    global last_clip, last_clip_path, tray_icon
    last_clip = clip_name
    last_clip_path = clip_path
    if tray_icon:
        tray_icon.menu = build_menu()
        tray_icon.update_menu()

def build_menu():
    return pystray.Menu(
        pystray.MenuItem("Открыть", lambda: open_ui()),
        pystray.MenuItem("Открыть папку с клипами", lambda: open_clips_folder()),
        pystray.MenuItem(f"Последний клип: {last_clip or 'нет'}", lambda: open_last_clip()),
        pystray.Menu.SEPARATOR,
        pystray.MenuItem("Выход", on_exit),
    )

def on_exit(icon):
    close_window()
    icon.stop()
    logger.info("Выход из приложения")
    os._exit(0)


def create_tray():
    global tray_icon
    icon_image = Image.open(get_bundled_resources_folder() / "icon.ico")
    tray_icon = pystray.Icon("Rexer", icon_image, "Rexer", build_menu())
    return tray_icon
