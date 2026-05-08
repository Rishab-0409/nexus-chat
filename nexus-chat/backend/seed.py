"""
Seed script — creates demo users and a sample group chat
Run: python seed.py
"""
import asyncio
import uuid
from database import init_db, get_db
from auth import hash_password
from datetime import datetime

USERS = [
    ('demo',    'demo@nexus.chat',    'demo123'),
    ('alice',   'alice@nexus.chat',   'alice123'),
    ('bob',     'bob@nexus.chat',     'bob123'),
    ('charlie', 'charlie@nexus.chat', 'charlie123'),
]

COLORS = ['#3d5eff', '#a78bfa', '#10b981', '#f97316']

async def seed():
    await init_db()
    db = await get_db()

    user_ids = []
    print("Creating users...")
    for i, (username, email, password) in enumerate(USERS):
        existing = await db.fetchone("SELECT id FROM users WHERE username=?", (username,))
        if existing:
            print(f"  ⚠ User '{username}' already exists, skipping")
            user_ids.append(existing['id'])
            continue
        uid = str(uuid.uuid4())
        await db.execute(
            "INSERT INTO users(id,username,email,password_hash,avatar_color,is_online,created_at) VALUES(?,?,?,?,?,0,?)",
            (uid, username, email, hash_password(password), COLORS[i], datetime.utcnow().isoformat())
        )
        user_ids.append(uid)
        print(f"  ✓ Created user: {username} / {password}")

    # Create a group chat
    print("\nCreating sample group chat...")
    gid = str(uuid.uuid4())
    existing_group = await db.fetchone("SELECT id FROM conversations WHERE name='Nexus Team'")
    if not existing_group:
        await db.execute(
            "INSERT INTO conversations(id,name,type,avatar_color,created_by,created_at) VALUES(?,?,?,?,?,?)",
            (gid, 'Nexus Team', 'group', '#3d5eff', user_ids[0], datetime.utcnow().isoformat())
        )
        for uid in user_ids:
            await db.execute(
                "INSERT OR IGNORE INTO conversation_members(conversation_id,user_id,role) VALUES(?,?,?)",
                (gid, uid, 'admin' if uid == user_ids[0] else 'member')
            )

        # Seed some messages
        sample_messages = [
            (user_ids[0], "Hey team! Welcome to Nexus Chat 🎉"),
            (user_ids[1], "This is amazing! The Bluetooth offline feature is incredible."),
            (user_ids[2], "Agreed! I tested the SOS button — works perfectly."),
            (user_ids[3], "The AI summarization is super useful for catching up on long chats."),
            (user_ids[0], "Let's test the games too! Go to the 🎮 button in the header."),
        ]
        for sender, content in sample_messages:
            await db.execute(
                "INSERT INTO messages(id,conversation_id,sender_id,content,type,is_read,created_at) VALUES(?,?,?,?,?,1,?)",
                (str(uuid.uuid4()), gid, sender, content, 'text', datetime.utcnow().isoformat())
            )
        print("  ✓ Created group: 'Nexus Team' with sample messages")
    else:
        print("  ⚠ Group already exists")

    print("\n🎉 Seed complete!")
    print("\nLogin credentials:")
    for username, email, password in USERS:
        print(f"  {username:10} | {password}")

asyncio.run(seed())
