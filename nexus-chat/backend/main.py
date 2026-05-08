"""
NEXUS CHAT - Backend Server
FastAPI + WebSocket + SQLite + AI Integration
"""
 
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import asyncio
import json
import uuid
import os
import shutil
from datetime import datetime
from pathlib import Path
 
from database import init_db, get_db
from models import *
from auth import create_token, verify_token, hash_password, verify_password
from connection_manager import ConnectionManager
from ai_service import summarize_chat, ai_reply
from sos_handler import SOSHandler
 
# ── Startup ──────────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    Path("uploads").mkdir(exist_ok=True)
    yield
 
app = FastAPI(title="Nexus Chat API", version="1.0.0", lifespan=lifespan)
 
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
 
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
 
manager = ConnectionManager()
sos_handler = SOSHandler()
 
# ── Auth Routes ───────────────────────────────────────────────────────────────
@app.post("/api/auth/register")
async def register(payload: RegisterPayload, db=Depends(get_db)):
    existing = await db.fetchone("SELECT id FROM users WHERE username=? OR email=?",
                                  (payload.username, payload.email))
    if existing:
        raise HTTPException(400, "Username or email already exists")
    uid = str(uuid.uuid4())
    avatar_color = f"#{hash(payload.username) % 0xFFFFFF:06x}"
    await db.execute(
        "INSERT INTO users(id,username,email,password_hash,avatar_color,created_at) VALUES(?,?,?,?,?,?)",
        (uid, payload.username, payload.email, hash_password(payload.password),
         avatar_color, datetime.utcnow().isoformat()))
    token = create_token(uid)
    return {"token": token, "user": {"id": uid, "username": payload.username,
                                      "email": payload.email, "avatar_color": avatar_color}}
 
@app.post("/api/auth/login")
async def login(payload: LoginPayload, db=Depends(get_db)):
    user = await db.fetchone("SELECT * FROM users WHERE username=? OR email=?",
                              (payload.identifier, payload.identifier))
    if not user or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(401, "Invalid credentials")
    await db.execute("UPDATE users SET last_seen=?, is_online=1 WHERE id=?",
                     (datetime.utcnow().isoformat(), user["id"]))
    token = create_token(user["id"])
    return {"token": token, "user": {
        "id": user["id"], "username": user["username"],
        "email": user["email"], "avatar_color": user["avatar_color"],
        "avatar_url": user["avatar_url"]
    }}
 
@app.get("/api/auth/me")
async def get_me(user_id: str = Depends(verify_token), db=Depends(get_db)):
    user = await db.fetchone("SELECT id,username,email,avatar_color,avatar_url,bio FROM users WHERE id=?", (user_id,))
    if not user:
        raise HTTPException(404, "User not found")
    return dict(user)
 
# ── Users ─────────────────────────────────────────────────────────────────────
@app.get("/api/users/search")
async def search_users(q: str, user_id: str = Depends(verify_token), db=Depends(get_db)):
    users = await db.fetchall(
        "SELECT id,username,avatar_color,avatar_url,is_online FROM users WHERE username LIKE ? AND id!=? LIMIT 20",
        (f"%{q}%", user_id))
    return [dict(u) for u in users]
 
@app.get("/api/users")
async def get_users(user_id: str = Depends(verify_token), db=Depends(get_db)):
    users = await db.fetchall(
        "SELECT id,username,avatar_color,avatar_url,is_online,last_seen FROM users WHERE id!=?", (user_id,))
    return [dict(u) for u in users]
 
# ── Conversations ─────────────────────────────────────────────────────────────
@app.get("/api/conversations")
async def get_conversations(user_id: str = Depends(verify_token), db=Depends(get_db)):
    convs = await db.fetchall("""
        SELECT c.*, 
               (SELECT content FROM messages WHERE conversation_id=c.id ORDER BY created_at DESC LIMIT 1) as last_message,
               (SELECT created_at FROM messages WHERE conversation_id=c.id ORDER BY created_at DESC LIMIT 1) as last_message_time,
               (SELECT COUNT(*) FROM messages WHERE conversation_id=c.id AND is_read=0 AND sender_id!=?) as unread_count
        FROM conversations c
        JOIN conversation_members cm ON c.id=cm.conversation_id
        WHERE cm.user_id=?
        ORDER BY last_message_time DESC NULLS LAST
    """, (user_id, user_id))
    result = []
    for conv in convs:
        d = dict(conv)
        members = await db.fetchall("""
            SELECT u.id,u.username,u.avatar_color,u.avatar_url,u.is_online
            FROM users u JOIN conversation_members cm ON u.id=cm.user_id
            WHERE cm.conversation_id=?
        """, (conv["id"],))
        d["members"] = [dict(m) for m in members]
        result.append(d)
    return result
 
@app.post("/api/conversations")
async def create_conversation(payload: CreateConversationPayload,
                               user_id: str = Depends(verify_token), db=Depends(get_db)):
    cid = str(uuid.uuid4())
    await db.execute(
        "INSERT INTO conversations(id,name,type,avatar_color,created_by,created_at) VALUES(?,?,?,?,?,?)",
        (cid, payload.name, payload.type,
         f"#{hash(payload.name or cid) % 0xFFFFFF:06x}",
         user_id, datetime.utcnow().isoformat()))
    member_ids = list(set([user_id] + payload.member_ids))
    for mid in member_ids:
        await db.execute("INSERT INTO conversation_members(conversation_id,user_id,role) VALUES(?,?,?)",
                         (cid, mid, "admin" if mid == user_id else "member"))
    return {"id": cid, "name": payload.name, "type": payload.type, "members": member_ids}
 
# ── Messages ──────────────────────────────────────────────────────────────────
@app.get("/api/conversations/{conv_id}/messages")
async def get_messages(conv_id: str, limit: int = 50, offset: int = 0,
                        user_id: str = Depends(verify_token), db=Depends(get_db)):
    msgs = await db.fetchall("""
        SELECT m.*, u.username as sender_name, u.avatar_color as sender_avatar_color, u.avatar_url as sender_avatar_url
        FROM messages m JOIN users u ON m.sender_id=u.id
        WHERE m.conversation_id=?
        ORDER BY m.created_at DESC LIMIT ? OFFSET ?
    """, (conv_id, limit, offset))
    await db.execute("UPDATE messages SET is_read=1 WHERE conversation_id=? AND sender_id!=?",
                     (conv_id, user_id))
    return [dict(m) for m in reversed(msgs)]
 
@app.post("/api/conversations/{conv_id}/summarize")
async def summarize_conversation(conv_id: str, user_id: str = Depends(verify_token), db=Depends(get_db)):
    msgs = await db.fetchall("""
        SELECT m.content, u.username FROM messages m JOIN users u ON m.sender_id=u.id
        WHERE m.conversation_id=? AND m.type='text' ORDER BY m.created_at DESC LIMIT 50
    """, (conv_id,))
    if not msgs:
        return {"summary": "No messages to summarize."}
    chat_text = "\n".join([f"{m['username']}: {m['content']}" for m in reversed(msgs)])
    summary = await summarize_chat(chat_text)
    return {"summary": summary}
 
@app.post("/api/conversations/{conv_id}/ai-reply")
async def get_ai_reply(conv_id: str, payload: AIReplyPayload,
                        user_id: str = Depends(verify_token), db=Depends(get_db)):
    msgs = await db.fetchall("""
        SELECT m.content, u.username FROM messages m JOIN users u ON m.sender_id=u.id
        WHERE m.conversation_id=? AND m.type='text' ORDER BY m.created_at DESC LIMIT 20
    """, (conv_id,))
    context = "\n".join([f"{m['username']}: {m['content']}" for m in reversed(msgs)])
    reply = await ai_reply(context, payload.prompt)
    return {"reply": reply}
 
# ── File Upload ───────────────────────────────────────────────────────────────
@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...), user_id: str = Depends(verify_token)):
    ext = Path(file.filename).suffix.lower()
    allowed = {".jpg", ".jpeg", ".png", ".gif", ".webp", ".mp4", ".pdf", ".doc", ".docx",
               ".txt", ".zip", ".mp3", ".wav", ".ogg"}
    if ext not in allowed:
        raise HTTPException(400, f"File type {ext} not allowed")
    file_id = str(uuid.uuid4())
    filename = f"{file_id}{ext}"
    filepath = Path("uploads") / filename
    with open(filepath, "wb") as f:
        shutil.copyfileobj(file.file, f)
    file_type = "image" if ext in {".jpg",".jpeg",".png",".gif",".webp"} else \
                "video" if ext == ".mp4" else \
                "audio" if ext in {".mp3",".wav",".ogg"} else "file"
    return {"url": f"/uploads/{filename}", "type": file_type,
            "name": file.filename, "size": filepath.stat().st_size}
 
# ── SOS ───────────────────────────────────────────────────────────────────────
@app.post("/api/sos/broadcast")
async def broadcast_sos(payload: SOSPayload, user_id: str = Depends(verify_token), db=Depends(get_db)):
    user = await db.fetchone("SELECT username FROM users WHERE id=?", (user_id,))
    sos_msg = {
        "type": "sos_alert",
        "sender_id": user_id,
        "sender_name": user["username"] if user else "Unknown",
        "message": payload.message,
        "location": payload.location,
        "timestamp": datetime.utcnow().isoformat()
    }
    await manager.broadcast_sos(json.dumps(sos_msg))
    await db.execute(
        "INSERT INTO sos_logs(id,sender_id,message,location,created_at) VALUES(?,?,?,?,?)",
        (str(uuid.uuid4()), user_id, payload.message,
         json.dumps(payload.location) if payload.location else None,
         datetime.utcnow().isoformat()))
    return {"status": "SOS broadcast sent", "timestamp": sos_msg["timestamp"]}
 
# ── Games ─────────────────────────────────────────────────────────────────────
@app.post("/api/games/start")
async def start_game(payload: GameStartPayload, user_id: str = Depends(verify_token), db=Depends(get_db)):
    game_id = str(uuid.uuid4())
    await db.execute(
        "INSERT INTO games(id,type,conversation_id,state,created_by,created_at) VALUES(?,?,?,?,?,?)",
        (game_id, payload.game_type, payload.conversation_id,
         json.dumps({"status": "waiting", "players": [user_id]}),
         user_id, datetime.utcnow().isoformat()))
    return {"game_id": game_id, "type": payload.game_type}
 
@app.post("/api/games/{game_id}/move")
async def make_move(game_id: str, payload: GameMovePayload,
                     user_id: str = Depends(verify_token), db=Depends(get_db)):
    game = await db.fetchone("SELECT * FROM games WHERE id=?", (game_id,))
    if not game:
        raise HTTPException(404, "Game not found")
    state = json.loads(game["state"])
    state["last_move"] = {"player": user_id, "move": payload.move, "timestamp": datetime.utcnow().isoformat()}
    await db.execute("UPDATE games SET state=? WHERE id=?", (json.dumps(state), game_id))
    await manager.broadcast_to_conversation(
        game["conversation_id"],
        json.dumps({"type": "game_move", "game_id": game_id, "move": payload.move, "player": user_id}))
    return {"status": "ok", "state": state}
 
# ── Network Status ────────────────────────────────────────────────────────────
@app.get("/api/network/status")
async def network_status():
    return {"online": True, "mode": "internet", "peers": manager.get_peer_count()}
 
# ── WebSocket ─────────────────────────────────────────────────────────────────
@app.websocket("/ws/{token}")
async def websocket_endpoint(websocket: WebSocket, token: str, db=Depends(get_db)):
    try:
        import jwt as pyjwt
        from auth import SECRET_KEY, ALGORITHM
        payload = pyjwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload["sub"]
    except Exception as e:
        await websocket.close(code=4001)
        return
 
    user = await db.fetchone("SELECT username,avatar_color,avatar_url FROM users WHERE id=?", (user_id,))
    if not user:
        await websocket.close(code=4004)
        return
 
    await manager.connect(websocket, user_id)
    await db.execute("UPDATE users SET is_online=1,last_seen=? WHERE id=?",
                     (datetime.utcnow().isoformat(), user_id))
    await manager.broadcast_presence(user_id, True)
 
    try:
        while True:
            data = await websocket.receive_text()
            msg_data = json.loads(data)
            msg_type = msg_data.get("type")
 
            if msg_type == "message":
                msg_id = str(uuid.uuid4())
                now = datetime.utcnow().isoformat()
                await db.execute(
                    "INSERT INTO messages(id,conversation_id,sender_id,content,type,file_url,file_name,file_size,reply_to,created_at) VALUES(?,?,?,?,?,?,?,?,?,?)",
                    (msg_id, msg_data["conversation_id"], user_id,
                     msg_data.get("content",""), msg_data.get("msg_type","text"),
                     msg_data.get("file_url"), msg_data.get("file_name"),
                     msg_data.get("file_size"), msg_data.get("reply_to"), now))
                broadcast = {
                    "type": "message",
                    "id": msg_id,
                    "conversation_id": msg_data["conversation_id"],
                    "sender_id": user_id,
                    "sender_name": user["username"],
                    "sender_avatar_color": user["avatar_color"],
                    "sender_avatar_url": user["avatar_url"],
                    "content": msg_data.get("content",""),
                    "msg_type": msg_data.get("msg_type","text"),
                    "file_url": msg_data.get("file_url"),
                    "file_name": msg_data.get("file_name"),
                    "file_size": msg_data.get("file_size"),
                    "reply_to": msg_data.get("reply_to"),
                    "created_at": now,
                    "is_read": False
                }
                await manager.broadcast_to_conversation(
                    msg_data["conversation_id"], json.dumps(broadcast))
 
            elif msg_type == "typing":
                await manager.broadcast_to_conversation(
                    msg_data["conversation_id"],
                    json.dumps({"type":"typing","user_id":user_id,
                                "username":user["username"],"is_typing":msg_data.get("is_typing",False)}),
                    exclude=user_id)
 
            elif msg_type == "reaction":
                msg_id = msg_data["message_id"]
                emoji = msg_data["emoji"]
                existing = await db.fetchone(
                    "SELECT id FROM reactions WHERE message_id=? AND user_id=? AND emoji=?",
                    (msg_id, user_id, emoji))
                if existing:
                    await db.execute("DELETE FROM reactions WHERE id=?", (existing["id"],))
                else:
                    await db.execute(
                        "INSERT INTO reactions(id,message_id,user_id,emoji,created_at) VALUES(?,?,?,?,?)",
                        (str(uuid.uuid4()), msg_id, user_id, emoji, datetime.utcnow().isoformat()))
                reactions = await db.fetchall(
                    "SELECT emoji, COUNT(*) as count, GROUP_CONCAT(user_id) as users FROM reactions WHERE message_id=? GROUP BY emoji",
                    (msg_id,))
                await manager.broadcast_to_conversation(
                    msg_data["conversation_id"],
                    json.dumps({"type":"reaction_update","message_id":msg_id,
                                "reactions":[dict(r) for r in reactions]}))
 
            elif msg_type == "read_receipt":
                await db.execute(
                    "UPDATE messages SET is_read=1 WHERE conversation_id=? AND sender_id!=?",
                    (msg_data["conversation_id"], user_id))
 
            elif msg_type == "bluetooth_message":
                # Offline Bluetooth relay
                await manager.broadcast_to_conversation(
                    msg_data["conversation_id"],
                    json.dumps({**msg_data, "offline_delivered": True}))
 
            elif msg_type == "ping":
                await websocket.send_text(json.dumps({"type":"pong"}))
 
    except WebSocketDisconnect:
        pass
    finally:
        manager.disconnect(user_id)
        await db.execute("UPDATE users SET is_online=0,last_seen=? WHERE id=?",
                         (datetime.utcnow().isoformat(), user_id))
        await manager.broadcast_presence(user_id, False)
 