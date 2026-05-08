"""
Database layer — aiosqlite with async helpers
"""
import aiosqlite
import asyncio
from pathlib import Path

DB_PATH = "nexus_chat.db"

class AsyncDB:
    def __init__(self, conn):
        self.conn = conn

    async def execute(self, sql, params=()):
        await self.conn.execute(sql, params)
        await self.conn.commit()

    async def fetchone(self, sql, params=()):
        async with self.conn.execute(sql, params) as cur:
            row = await cur.fetchone()
            if row is None:
                return None
            cols = [d[0] for d in cur.description]
            return dict(zip(cols, row))

    async def fetchall(self, sql, params=()):
        async with self.conn.execute(sql, params) as cur:
            rows = await cur.fetchall()
            if not rows:
                return []
            cols = [d[0] for d in cur.description]
            return [dict(zip(cols, r)) for r in rows]

_conn = None

async def init_db():
    global _conn
    _conn = await aiosqlite.connect(DB_PATH)
    await _conn.execute("PRAGMA journal_mode=WAL")
    await _conn.execute("PRAGMA foreign_keys=ON")
    await _create_tables()

async def get_db():
    return AsyncDB(_conn)

async def _create_tables():
    tables = [
        """CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            avatar_color TEXT DEFAULT '#6366f1',
            avatar_url TEXT,
            bio TEXT,
            is_online INTEGER DEFAULT 0,
            last_seen TEXT,
            created_at TEXT NOT NULL
        )""",
        """CREATE TABLE IF NOT EXISTS conversations (
            id TEXT PRIMARY KEY,
            name TEXT,
            type TEXT DEFAULT 'direct',
            avatar_color TEXT,
            avatar_url TEXT,
            description TEXT,
            created_by TEXT,
            created_at TEXT NOT NULL
        )""",
        """CREATE TABLE IF NOT EXISTS conversation_members (
            conversation_id TEXT,
            user_id TEXT,
            role TEXT DEFAULT 'member',
            joined_at TEXT DEFAULT (datetime('now')),
            PRIMARY KEY(conversation_id, user_id),
            FOREIGN KEY(conversation_id) REFERENCES conversations(id),
            FOREIGN KEY(user_id) REFERENCES users(id)
        )""",
        """CREATE TABLE IF NOT EXISTS messages (
            id TEXT PRIMARY KEY,
            conversation_id TEXT NOT NULL,
            sender_id TEXT NOT NULL,
            content TEXT,
            type TEXT DEFAULT 'text',
            file_url TEXT,
            file_name TEXT,
            file_size INTEGER,
            reply_to TEXT,
            is_read INTEGER DEFAULT 0,
            is_deleted INTEGER DEFAULT 0,
            created_at TEXT NOT NULL,
            FOREIGN KEY(conversation_id) REFERENCES conversations(id),
            FOREIGN KEY(sender_id) REFERENCES users(id)
        )""",
        """CREATE TABLE IF NOT EXISTS reactions (
            id TEXT PRIMARY KEY,
            message_id TEXT NOT NULL,
            user_id TEXT NOT NULL,
            emoji TEXT NOT NULL,
            created_at TEXT NOT NULL,
            UNIQUE(message_id, user_id, emoji)
        )""",
        """CREATE TABLE IF NOT EXISTS games (
            id TEXT PRIMARY KEY,
            type TEXT NOT NULL,
            conversation_id TEXT,
            state TEXT,
            created_by TEXT,
            created_at TEXT NOT NULL
        )""",
        """CREATE TABLE IF NOT EXISTS sos_logs (
            id TEXT PRIMARY KEY,
            sender_id TEXT,
            message TEXT,
            location TEXT,
            created_at TEXT NOT NULL
        )""",
    ]
    for t in tables:
        await _conn.execute(t)
    await _conn.commit()
