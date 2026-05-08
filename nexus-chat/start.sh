#!/bin/bash
# ────────────────────────────────────────────────────────────────
#  Nexus Chat — Local Development Startup Script
#  Run this from the project root: bash start.sh
# ────────────────────────────────────────────────────────────────

set -e

echo ""
echo "  ███╗   ██╗███████╗██╗  ██╗██╗   ██╗███████╗"
echo "  ████╗  ██║██╔════╝╚██╗██╔╝██║   ██║██╔════╝"
echo "  ██╔██╗ ██║█████╗   ╚███╔╝ ██║   ██║███████╗"
echo "  ██║╚██╗██║██╔══╝   ██╔██╗ ██║   ██║╚════██║"
echo "  ██║ ╚████║███████╗██╔╝ ██╗╚██████╔╝███████║"
echo "  ╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝"
echo "         CHAT — Full Stack Startup"
echo ""

# ── Backend ──────────────────────────────────────────────────────
echo "🔧 Installing backend dependencies..."
cd backend
pip install -r requirements.txt -q

echo "🚀 Starting backend on http://localhost:8000 ..."
uvicorn main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!

# ── Frontend ─────────────────────────────────────────────────────
echo "📦 Installing frontend dependencies..."
cd ../frontend
npm install --silent

echo "⚡ Starting frontend on http://localhost:3000 ..."
npm run dev &
FRONTEND_PID=$!

# ── Cleanup on exit ───────────────────────────────────────────────
trap "echo '🛑 Stopping...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null" EXIT INT TERM

echo ""
echo "✅ Nexus Chat is running!"
echo "   Frontend → http://localhost:3000"
echo "   Backend  → http://localhost:8000"
echo "   API Docs → http://localhost:8000/docs"
echo ""
echo "   Press Ctrl+C to stop"
echo ""

wait
