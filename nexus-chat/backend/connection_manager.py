"""
WebSocket Connection Manager
Handles rooms, broadcasting, presence, SOS alerts
"""
from fastapi import WebSocket
from typing import Dict, Set
import json
import asyncio

class ConnectionManager:
    def __init__(self):
        # user_id -> WebSocket
        self.active: Dict[str, WebSocket] = {}
        # conversation_id -> set of user_ids
        self.rooms: Dict[str, Set[str]] = {}

    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        self.active[user_id] = websocket

    def disconnect(self, user_id: str):
        self.active.pop(user_id, None)
        for room in self.rooms.values():
            room.discard(user_id)

    def join_room(self, conversation_id: str, user_id: str):
        if conversation_id not in self.rooms:
            self.rooms[conversation_id] = set()
        self.rooms[conversation_id].add(user_id)

    async def send_personal(self, user_id: str, message: str):
        ws = self.active.get(user_id)
        if ws:
            try:
                await ws.send_text(message)
            except:
                self.disconnect(user_id)

    async def broadcast_to_conversation(self, conversation_id: str, message: str, exclude: str = None):
        """Broadcast to all members of a conversation"""
        import aiosqlite
        from database import DB_PATH
        async with aiosqlite.connect(DB_PATH) as db:
            async with db.execute(
                "SELECT user_id FROM conversation_members WHERE conversation_id=?",
                (conversation_id,)
            ) as cur:
                rows = await cur.fetchall()
        tasks = []
        for (user_id,) in rows:
            if user_id != exclude and user_id in self.active:
                tasks.append(self.send_personal(user_id, message))
        if tasks:
            await asyncio.gather(*tasks, return_exceptions=True)

    async def broadcast_presence(self, user_id: str, is_online: bool):
        """Notify all connected users about presence change"""
        msg = json.dumps({"type": "presence", "user_id": user_id, "is_online": is_online})
        tasks = [self.send_personal(uid, msg) for uid in self.active if uid != user_id]
        if tasks:
            await asyncio.gather(*tasks, return_exceptions=True)

    async def broadcast_sos(self, message: str):
        """Broadcast SOS to ALL connected users"""
        tasks = [ws.send_text(message) for ws in self.active.values()]
        if tasks:
            await asyncio.gather(*tasks, return_exceptions=True)

    def get_peer_count(self) -> int:
        return len(self.active)
