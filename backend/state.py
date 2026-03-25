import threading
from typing import List

from fastapi import WebSocket
from loguru import logger


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
