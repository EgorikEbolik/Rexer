from contextlib import asynccontextmanager
import sys
import threading
from typing import Any
from loguru import logger
import win32gui
from win32com.shell import shell, shellcon
import asyncio
from pathlib import Path
from fastapi import FastAPI, HTTPException, Response, WebSocket, status
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from clipEditor import trim_video
from fileProcessor import notify_new_clip, notify_updated_clip, rename_simple
from thumbnailsManager import (
    delete_video_cache,
    generate_thumbnail,
    generate_tileset,
    get_thumbnail_path,
    get_tileset_path,
    get_vtt_path,
    rename_video_cache,
    update_vtt,
)
from utils import VIDEO_EXTENSIONS, delete_file
from paths import get_static_dir
from settings import settings, Settings
from state import manager
from monitor import video_monitor


EXTENSIONS = [extension.replace("*", "") for extension in VIDEO_EXTENSIONS]


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
    yield


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
            hwnd, None, "Выберите папку", shellcon.BIF_RETURNONLYFSDIRS
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
            clips.append(
                {
                    "name": file.stem,
                    "filename": file.name,
                    "path": str(file),
                    "size_mb": round(file.stat().st_size / (1024 * 1024), 2),
                    "created_at": file.stat().st_mtime,
                    "game": (
                        file.parent.name
                        if settings.data["sort_mode"] == "game"
                        else None
                    ),
                }
            )
    return clips


@app.api_route("/clips/stream", methods=["GET", "HEAD"])
def stream_clip(path: str, t: float = None):
    file = Path(path)
    if not file.exists():
        return {"error": "Файл не найден"}
    return FileResponse(path)


@app.get("/clips/thumbnail")
def get_thumbnail(path: str):
    thumb_path = get_thumbnail_path(path)
    if not thumb_path.exists():
        threading.Thread(
            target=generate_thumbnail, args=(Path(path),), daemon=True
        ).start()
        return Response(status_code=status.HTTP_202_ACCEPTED)
    if not get_tileset_path(path).exists():
        threading.Thread(target=generate_tileset, args=(path,), daemon=True).start()
    return FileResponse(str(thumb_path))


@app.get("/clips/tileset")
def get_tileset(path: str):
    tileset = get_tileset_path(path)
    if not tileset.exists():
        return {"error": "Тайлсет не найден"}
    return FileResponse(str(tileset))


@app.get("/clips/tileset/vtt")
def get_tileset_vtt(path: str):
    vtt = get_vtt_path(path)
    if not vtt.exists():
        return {"error": "VTT не найден"}
    return FileResponse(str(vtt))


@app.post("/settings")
def update_settings(new_settings: dict[str, Any]):
    old_settings = settings.data
    diff = dict(set(new_settings.items()) - set(old_settings.items()))

    settings.data.update(diff)
    settings.save()
    if "watch_folder" in diff:
        logger.debug(diff["watch_folder"])
        video_monitor.update_args(folder_to_watch=diff["watch_folder"])
        logger.debug(video_monitor.folder_to_watch)
    return {"ok": True}


@app.post("/clips/trim")
def trim_clip(
    path: str,
    start_time: float,
    end_time: float,
):
    new_path = trim_video(path, start_time, end_time)
    if not new_path:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Не удалось обрезать файл",
        )
    threading.Thread(target=generate_thumbnail, args=(new_path,), daemon=True).start()
    threading.Thread(target=generate_tileset, args=(new_path,), daemon=True).start()

    clip = {
        "name": new_path.stem,
        "filename": new_path.name,
        "path": str(new_path),
        "size_mb": round(new_path.stat().st_size / (1024 * 1024), 2),
        "created_at": new_path.stat().st_mtime,
        "game": (
            new_path.parent.name if settings.data["sort_mode"] == "game" else None
        ),
    }

    if settings.data.get("rewrite_trim") is False:
        notify_new_clip(clip)
    else:
        notify_updated_clip(clip)
    return clip


@app.delete("/clips")
def delete_clip(path: str):
    success = delete_file(path)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Не удалось удалить файл",
        )
    delete_video_cache(path)
    return {"ok": True}


@app.patch("/clips/rename")
def rename_clip(path: str, name: str):
    new_path = rename_simple(path, name)
    if new_path is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Не удалось переименовать файл",
        )
    rename_video_cache(path, new_path)
    threading.Thread(target=update_vtt, args=(path, new_path), daemon=True).start()
    return {"ok": True, "path": str(new_path)}


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
if getattr(sys, "frozen", False):
    logger.info(f"MEIPASS: {sys._MEIPASS}")
    print(f"MEIPASS: {sys._MEIPASS}")
if static_dir.exists():
    app.mount("/", StaticFiles(directory=str(static_dir), html=True), name="static")
