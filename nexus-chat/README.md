# 💬 Nexus Chat — Full Stack Chat Application
> Final Year Major Project | Real-time Chat + AI + Bluetooth Offline Mesh + SOS Emergency

---

## 📋 Table of Contents
1. [Project Overview](#overview)
2. [Features](#features)
3. [Tech Stack](#tech-stack)
4. [Architecture](#architecture)
5. [How to Run](#how-to-run)
6. [Project Structure](#structure)
7. [Feature Deep-Dive](#features-deep-dive)
8. [Deployment](#deployment)
9. [Future Scope](#future-scope)

---

## 🏆 Project Overview <a name="overview"></a>

Nexus Chat is a **full-stack, production-grade messaging application** inspired by WhatsApp. It operates in two modes:

| Mode | Technology | When it activates |
|------|-----------|-------------------|
| **Online** | WebSocket over Internet | Normal operation |
| **Offline Mesh** | Web Bluetooth API + BroadcastChannel | When internet drops |
| **SOS Emergency** | Both channels simultaneously | Emergency broadcasts |

---

## ✨ Features <a name="features"></a>

### Core Chat
- ✅ Real-time messaging via WebSockets
- ✅ Direct messages (1-on-1)
- ✅ Group chats with multiple members
- ✅ Message reactions (emoji)
- ✅ Reply to messages (threaded)
- ✅ Read receipts (✓ / ✓✓)
- ✅ Typing indicators
- ✅ Online presence indicators
- ✅ Message history with date separators

### File Transfer
- ✅ Images, videos, audio files
- ✅ PDFs, documents, ZIP files
- ✅ Drag-and-drop file upload
- ✅ Voice messages (in-app recording)
- ✅ File size display and download links
- 📦 Max file size: 50 MB per file

### AI Features
- ✅ **Chat Summarization** — Claude AI summarizes the last 50 messages
- ✅ **AI Reply Suggestions** — 3 contextual reply options
- ✅ Powered by Anthropic Claude API (degrades gracefully without API key)

### Bluetooth Offline Mode
- ✅ Auto-detects internet loss and switches to Bluetooth
- ✅ Uses **Web Bluetooth API** for real BLE communication
- ✅ **BroadcastChannel API** as fallback for same-device/local testing
- ✅ Peer discovery ("Find Peers" button)
- ✅ Messages relay through BT even without internet
- ✅ Network mode badge: Online / Bluetooth / Offline

### SOS Emergency System
- ✅ One-tap emergency SOS button (red pulsing button)
- ✅ 3-second countdown so accidental taps can be cancelled
- ✅ Broadcasts to **ALL users** simultaneously
- ✅ GPS location attachment (optional)
- ✅ Quick-select emergency messages
- ✅ Works via internet AND Bluetooth simultaneously
- ✅ Alert modal pops up for all recipients
- ✅ SOS log stored in database

### Mini Games (In-Chat)
- ✅ **Tic Tac Toe** — 2-player in-chat game
- ✅ **Trivia Quiz** — 8 CS/general knowledge questions
- ✅ **Word Guess** — Wordle-style 5-letter word game
- ✅ Games are accessible from the chat header

### User Experience
- ✅ Dark theme with gradient accents
- ✅ Smooth animations and transitions
- ✅ Emoji picker
- ✅ User profile with custom avatar color
- ✅ Search conversations and users
- ✅ Unread message count badges
- ✅ Responsive design

---

## 🛠️ Tech Stack <a name="tech-stack"></a>

### Backend
| Technology | Purpose |
|------------|---------|
| **Python 3.11** | Core language |
| **FastAPI** | REST API + WebSocket server |
| **uvicorn** | ASGI server |
| **aiosqlite** | Async SQLite database |
| **JWT (PyJWT)** | Authentication tokens |
| **bcrypt** | Password hashing |
| **httpx** | Async HTTP client (for Anthropic API) |

### Frontend
| Technology | Purpose |
|------------|---------|
| **React 18** | UI framework |
| **Vite** | Build tool / dev server |
| **Zustand** | Global state management |
| **React Router** | Client-side routing |
| **Tailwind CSS** | Utility-first styling |
| **axios** | HTTP requests |
| **Web Bluetooth API** | BLE device communication |
| **BroadcastChannel API** | Local tab/device mesh |
| **MediaRecorder API** | Voice message recording |
| **Geolocation API** | SOS location tagging |

### External Services
| Service | Purpose |
|---------|---------|
| **Anthropic Claude API** | Chat summarization + AI replies |

---

## 🏗️ Architecture <a name="architecture"></a>

```
┌─────────────────────────────────────────────────────┐
│                   CLIENT (Browser)                   │
│  ┌──────────┐  ┌──────────┐  ┌───────────────────┐  │
│  │  React   │  │ Zustand  │  │  Web APIs         │  │
│  │  Router  │  │  Store   │  │  - Bluetooth      │  │
│  └──────────┘  └──────────┘  │  - Geolocation    │  │
│                               │  - MediaRecorder  │  │
│  HTTP/REST ◄───────────────►  │  - BroadcastChan  │  │
│  WebSocket ◄───────────────►  └───────────────────┘  │
└─────────────────────────────────────────────────────┘
         │ REST API + WebSocket
         ▼
┌─────────────────────────────────────────────────────┐
│              BACKEND (FastAPI + Python)              │
│  ┌──────────────┐  ┌──────────────────────────────┐ │
│  │  REST Routes │  │   WebSocket Manager          │ │
│  │  /api/auth   │  │   - Connection pool          │ │
│  │  /api/conv   │  │   - Room management          │ │
│  │  /api/msg    │  │   - Presence broadcasting    │ │
│  │  /api/sos    │  │   - SOS fanout               │ │
│  │  /api/upload │  └──────────────────────────────┘ │
│  └──────────────┘                                   │
│  ┌──────────────┐  ┌──────────────────────────────┐ │
│  │  AI Service  │  │   SQLite (aiosqlite)          │ │
│  │  (Anthropic) │  │   users, conversations,       │ │
│  └──────────────┘  │   messages, reactions,        │ │
│                    │   games, sos_logs             │ │
│                    └──────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
         │ INTERNET DOWN
         ▼
┌─────────────────────────────────────────────────────┐
│           BLUETOOTH MESH (P2P Offline)               │
│   Web Bluetooth API ←──── BLE ────→ Other Devices    │
│   BroadcastChannel ←── Local Tab ──→ Same Device     │
│   SOS Alert ←──── BT Fanout ──────→ All Nearby      │
└─────────────────────────────────────────────────────┘
```

### Database Schema
```sql
users             → id, username, email, password_hash, avatar_color, is_online
conversations     → id, name, type (direct/group), created_by
conversation_members → conversation_id, user_id, role
messages          → id, conversation_id, sender_id, content, type, file_url, reply_to
reactions         → id, message_id, user_id, emoji
games             → id, type, conversation_id, state (JSON)
sos_logs          → id, sender_id, message, location, created_at
```

---

## 🚀 How to Run <a name="how-to-run"></a>

### Option 1 — One-command startup (Recommended)
```bash
git clone <your-repo>
cd nexus-chat

# (Optional) Add your Anthropic API key for real AI features
export ANTHROPIC_API_KEY=sk-ant-...

bash start.sh
```

Open http://localhost:3000

### Option 2 — Manual startup
```bash
# Terminal 1 — Backend
cd backend
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# Terminal 2 — Frontend
cd frontend
npm install
npm run dev
```

### Option 3 — Docker (production-like)
```bash
cp .env.example .env
# Edit .env to add ANTHROPIC_API_KEY

docker-compose up --build
```
Frontend: http://localhost:3000
Backend API Docs: http://localhost:8000/docs

---

## 📁 Project Structure <a name="structure"></a>

```
nexus-chat/
├── backend/
│   ├── main.py              # FastAPI app, all routes, WebSocket handler
│   ├── database.py          # SQLite async DB layer, table creation
│   ├── models.py            # Pydantic request/response models
│   ├── auth.py              # JWT auth, bcrypt password hashing
│   ├── connection_manager.py # WebSocket room/presence management
│   ├── ai_service.py        # Anthropic API integration
│   ├── sos_handler.py       # Emergency alert management
│   ├── requirements.txt     # Python dependencies
│   └── Dockerfile
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx          # Root component, routing
│   │   ├── main.jsx         # ReactDOM entry point
│   │   ├── pages/
│   │   │   ├── Login.jsx    # Login page
│   │   │   ├── Register.jsx # Registration page
│   │   │   └── ChatLayout.jsx # Main app shell
│   │   ├── components/
│   │   │   ├── Sidebar.jsx         # Conversation list, people tab
│   │   │   ├── ChatPanel.jsx       # Message list, date grouping
│   │   │   ├── ChatHeader.jsx      # Chat header, AI + games buttons
│   │   │   ├── MessageBubble.jsx   # Individual message (text/file/audio)
│   │   │   ├── MessageInput.jsx    # Text input, file upload, voice, emoji
│   │   │   ├── Avatar.jsx          # Reusable avatar component
│   │   │   ├── NetworkBadge.jsx    # Online/BT/Offline status badge
│   │   │   ├── SOSButton.jsx       # Emergency SOS trigger
│   │   │   ├── SOSAlert.jsx        # Incoming SOS display modal
│   │   │   ├── AISummaryModal.jsx  # AI chat summary display
│   │   │   ├── GameModal.jsx       # Mini games (TTT, Trivia, Word)
│   │   │   ├── NewConversationModal.jsx # Create DM or group
│   │   │   └── UserSettingsModal.jsx    # Profile editing
│   │   ├── store/
│   │   │   └── index.js     # Zustand global state + all actions
│   │   ├── utils/
│   │   │   ├── api.js        # Axios instance with auth headers
│   │   │   ├── websocket.js  # WS connection + auto-reconnect
│   │   │   └── bluetooth.js  # BLE + BroadcastChannel manager
│   │   └── styles/
│   │       └── global.css    # Tailwind + custom animations
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
│
├── docker-compose.yml
├── start.sh                  # Dev startup script
└── README.md
```

---

## 🔍 Feature Deep-Dive <a name="features-deep-dive"></a>

### WebSocket Flow
1. User logs in → JWT token issued
2. Frontend connects: `ws://host/ws/{token}`
3. Server validates token, adds to connection pool
4. Messages fan out to all conversation members via `ConnectionManager`
5. Presence (online/offline) broadcast to all connected users
6. SOS alerts broadcast to **every** connected socket

### Bluetooth Offline Mode
When `navigator.onLine` becomes `false` OR `/api/network/status` fails:
1. `networkMode` switches to `'bluetooth'`
2. `NetworkBadge` shows blue BT indicator
3. "Find Peers" button appears
4. Click → calls `navigator.bluetooth.requestDevice()` (Chrome/Edge only)
5. Once paired, messages are encoded to UTF-8, chunked to 512 bytes, sent via BLE TX characteristic
6. **Fallback**: `BroadcastChannel('nexus-chat-bt')` lets multiple tabs on same device communicate without real BT
7. When internet comes back, auto-reconnects to WebSocket

### SOS System
1. User presses red SOS button
2. Optionally attaches GPS coordinates
3. 3-second countdown (allows accidental-tap cancellation)
4. Sends to `/api/sos/broadcast` → `ConnectionManager.broadcast_sos()` → all WS clients
5. **Simultaneously**: `btManager.sendSOS()` sends over Bluetooth/BroadcastChannel
6. All recipients see a modal with sender info + "View on Maps" link
7. SOS is logged in `sos_logs` database table

### AI Integration
- **Summarize**: Fetches last 50 messages, sends to Claude with a system prompt requesting 2-4 sentence summary
- **Reply Suggestions**: Sends chat context + prompt to Claude, returns 3 suggestions user can click-to-insert
- **Graceful degradation**: If `ANTHROPIC_API_KEY` is not set, returns informative mock responses

---

## 🌐 Deployment <a name="deployment"></a>

### Free Tier Deployment Options

| Platform | Suitability | Notes |
|----------|-------------|-------|
| **Railway** | ✅ Best for this stack | Supports WebSockets, persistent storage |
| **Render** | ✅ Good | Free tier sleeps after inactivity |
| **Fly.io** | ✅ Great | Has persistent volumes |
| **Heroku** | ⚠️ OK | No free tier anymore |
| **VPS (DigitalOcean)** | ✅ Production | Full control |

### Deploying to Railway
```bash
npm install -g @railway/cli
railway login
railway new
railway up
railway domain  # Get your public URL
```

### Environment Variables
```
ANTHROPIC_API_KEY=sk-ant-...    # For AI features (optional)
```

---

## 🔮 Future Scope <a name="future-scope"></a>

| Feature | Implementation |
|---------|---------------|
| **End-to-end Encryption** | Signal Protocol / libsodium |
| **Push Notifications** | Firebase FCM + Service Worker |
| **Video/Voice Calls** | WebRTC PeerConnection |
| **Message Scheduling** | Background task queue (Celery) |
| **Story/Status** | S3 file storage + 24h expiry |
| **Screen Sharing** | WebRTC getDisplayMedia |
| **Multi-device sync** | CRDT / event sourcing |
| **Mobile App** | React Native with same backend |
| **LoRa Radio fallback** | For truly remote areas |

---

## 👨‍💻 Project By
Built as a Final Year Major Project demonstrating:
- Full-stack web development (Python + React)
- Real-time communication (WebSockets)
- Distributed systems (Bluetooth mesh P2P)
- AI integration (Anthropic Claude)
- Emergency communication systems
- Progressive offline-first architecture

---

*Nexus Chat — Connect anywhere, always.*
