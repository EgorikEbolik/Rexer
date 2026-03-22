from contextlib import asynccontextmanager
import sys
from typing import Any, List
from loguru import logger
import win32gui
from win32com.shell import shell, shellcon
import asyncio
from pathlib import Path
from fastapi import FastAPI, WebSocket
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from ffmpegManager import ensure_ffmpeg
from utils import VIDEO_EXTENSIONS
from paths import get_static_dir
from settings import settings, Settings

EXTENSIONS = [extension.replace("*","") for extension in VIDEO_EXTENSIONS]

class ConnectionManager:
    def __init__(self):
        self.active: List[WebSocket] = []
        self.loop = None  

    def set_loop(self, loop):
        self.loop = loop
        logger.debug(f"loop установлен в менеджере: {loop}")

    async def connect(self, ws: WebSocket):
        await ws.accept()
        self.active.append(ws)
        logger.debug(f"WebSocket подключен: {ws.client}")

    def disconnect(self, ws: WebSocket):
        self.active.remove(ws)
        logger.debug("WebSocket отключен")

    async def broadcast(self, data: dict):
        for ws in self.active:
            await ws.send_json(data)


manager = ConnectionManager()


async def _set_loop():
    loop = asyncio.get_running_loop()
    manager.set_loop(loop)
    logger.debug(f"loop установлен: {loop}")

def make_broadcast_fn(loop, manager):
    def broadcast_fn(data: dict):
        asyncio.run_coroutine_threadsafe(manager.broadcast(data), loop)
    return broadcast_fn

@asynccontextmanager
async def lifespan(app: FastAPI):
    await _set_loop()
    asyncio.create_task(delayed_ffmpeg_check())
    yield

async def delayed_ffmpeg_check():
    await asyncio.sleep(3)
    loop = asyncio.get_running_loop()
    broadcast_fn = make_broadcast_fn(loop, manager)
    await asyncio.to_thread(ensure_ffmpeg, broadcast_fn)


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

def open_folder_dialog() -> str:
    try:
        hwnd = win32gui.GetForegroundWindow()
        pidl, display_name, _ = shell.SHBrowseForFolder(
            hwnd,
            None,
            "Выберите папку",
            shellcon.BIF_RETURNONLYFSDIRS
        )
        if pidl:
            return shell.SHGetPathFromIDList(pidl)
    except Exception:
        pass
    return ""

def open_file_dialog() -> str:
    try:
        path, _, _ = win32gui.GetOpenFileNameW(
            Filter="Audio files\0*.wav;*.ogg;*.flac\0All files\0*.*\0",
            Title="Выберите аудио файл",
            hwndOwner=win32gui.GetForegroundWindow(),
        )
        return path
    except Exception:
        pass
    return ""



@app.get("/browse/folder")
def browse_folder():
    path = open_folder_dialog()
    return {"path": path or ""}

@app.get("/browse/file")
def browse_file():
    path = open_file_dialog()
    return {"path": path or ""}

@app.get("/settings")
def get_settings():
    return settings.data 

@app.get("/settings/defaults")
def get_defaults():
    return Settings.DEFAULTS

@app.get("/clips")
def get_clips():
    dest_folder = Path(settings.data["dest_folder"])
    clips = []
    
    for ext in EXTENSIONS:
        for file in dest_folder.rglob(f"*{ext}"):
            clips.append({
                "name": file.stem,
                "filename": file.name,
                "path": str(file),
                "size_mb": round(file.stat().st_size / (1024 * 1024), 2),
                "created_at": file.stat().st_mtime,
                "game": file.parent.name if settings.data["sort_mode"] == "game" else None
            })
    return clips

@app.get("/clips/stream")
def stream_clip(path: str):
    file = Path(path)
    if not file.exists():
        return {"error": "Файл не найден"}
    return FileResponse(path)

@app.post("/settings")
def update_settings(new_settings: dict[str, Any]):
    settings.data.update(new_settings)
    settings.save()
    return {"ok": True}


@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    logger.info(f"WebSocket подключен: {ws.client}")
    await manager.connect(ws)
    try:
        while True:
            await ws.receive_text()
    except Exception as e:
        logger.error(f"Ошибка WebSocket : {e}")
        manager.disconnect(ws)    

static_dir = get_static_dir() 
logger.info(f"Static dir: {static_dir} существет: {static_dir.exists()}")
print(f"Static dir: {static_dir} существет: {static_dir.exists()}")
if getattr(sys, 'frozen', False):
    logger.info(f"MEIPASS: {sys._MEIPASS}")
    print(f"MEIPASS: {sys._MEIPASS}")
if static_dir.exists():
    app.mount("/", StaticFiles(directory=str(static_dir), html=True), name="static")