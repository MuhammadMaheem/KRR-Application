#!/bin/bash

# KRR Project Start Script (Enterprise v2.0)
# Starts both backend and frontend servers in parallel

set -e

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║         🚀 KRR Project Startup Script (v2.0)                   ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

LAN_IP=""
if command -v hostname >/dev/null 2>&1; then
    LAN_IP=$(hostname -I 2>/dev/null | awk '{print $1}')
fi

# ── Check .env ────────────────────────────────────────────────

if [ ! -f ".env" ]; then
    echo -e "${RED}❌ ERROR: .env file not found!${NC}"
    exit 1
fi

# ── Check ports ─────────────────────────────────────────────────

if lsof -i :8000 > /dev/null 2>&1; then
    echo -e "${RED}❌ Port 8000 is already in use${NC}"
    exit 1
fi

if lsof -i :5173 > /dev/null 2>&1; then
    echo -e "${RED}❌ Port 5173 is already in use${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Ports 8000 and 5173 available${NC}"
echo ""

# ── Export env vars ────────────────────────────────────────────

export $(cat .env | grep -v '^#' | xargs)

# ── Create logs dir ───────────────────────────────────────────

LOGS_DIR="$SCRIPT_DIR/logs"
mkdir -p "$LOGS_DIR"

# ── Cleanup handler ──────────────────────────────────────────

cleanup() {
    echo ""
    echo -e "${YELLOW}Shutting down servers...${NC}"
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    echo -e "${GREEN}✅ Servers stopped${NC}"
    exit 0
}

trap cleanup INT TERM

# ── Start Backend ───────────────────────────────────────────

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║         🎬 Starting Backend (Port 8000)...                  ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

cd "$SCRIPT_DIR/backend"
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload > "$LOGS_DIR/backend.log" 2>&1 &
BACKEND_PID=$!
echo -e "${GREEN}✅ Backend started (PID: $BACKEND_PID)${NC}"

sleep 3

# ── Start Frontend ────────────────────────────────────────────

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║         🎬 Starting Frontend (Port 5173)...                 ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

cd "$SCRIPT_DIR/frontend"
chmod +x node_modules/.bin/* 2>/dev/null || true
node_modules/.bin/vite --host 0.0.0.0 > "$LOGS_DIR/frontend.log" 2>&1 &
FRONTEND_PID=$!
echo -e "${GREEN}✅ Frontend started (PID: $FRONTEND_PID)${NC}"

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║         ✅ Both Servers Running!                            ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo -e "${BLUE}📍 Access URLs:${NC}"
echo "   Frontend (localhost): ${CYAN}http://localhost:5173"
echo "   Frontend (loopback):  ${CYAN}http://127.0.0.1:5173"
echo "   Backend (localhost):  ${CYAN}http://localhost:8000"
echo "   Backend (loopback):   ${CYAN}http://127.0.0.1:8000"
echo "   Backend API docs:     ${CYAN}http://localhost:8000/docs"
if [ -n "$LAN_IP" ]; then
    echo "   Frontend (LAN):       ${CYAN}http://$LAN_IP:5173${NC}"
    echo "   Backend (LAN):        ${CYAN}http://$LAN_IP:8000${NC}"
fi
echo ""
echo -e "${BLUE}📊 Process IDs:${NC}"
echo "   Backend:  $BACKEND_PID"
echo "   Frontend: $FRONTEND_PID"
echo ""
echo -e "${BLUE}📝 Log Files:${NC}"
echo "   Backend:  $LOGS_DIR/backend.log"
echo "   Frontend: $LOGS_DIR/frontend.log"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop both servers${NC}"
echo ""

wait $BACKEND_PID $FRONTEND_PID
