#!/bin/bash

# KRR Project Setup Script
# This script installs all dependencies for both frontend and backend

set -e  # Exit on error

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║         🚀 KRR Project Setup Script                            ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}📋 Checking prerequisites...${NC}"
echo ""

# Check Python
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Python 3 is not installed${NC}"
    exit 1
fi
PYTHON_VERSION=$(python3 --version 2>&1 | awk '{print $2}')
echo -e "${GREEN}✅ Python 3${NC} ($PYTHON_VERSION) found"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    exit 1
fi
NODE_VERSION=$(node --version)
echo -e "${GREEN}✅ Node.js${NC} ($NODE_VERSION) found"

# Check npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed${NC}"
    exit 1
fi
NPM_VERSION=$(npm --version)
echo -e "${GREEN}✅ npm${NC} ($NPM_VERSION) found"

echo ""
echo -e "${BLUE}📦 Installing Backend Dependencies...${NC}"
echo ""

# Install Python dependencies from root
cd "$SCRIPT_DIR"
if [ -f "requirements.txt" ]; then
    echo "Installing Python packages..."
    pip install -q -r requirements.txt
    echo -e "${GREEN}✅ Backend dependencies installed${NC}"
else
    echo -e "${YELLOW}⚠️  requirements.txt not found${NC}"
fi

echo ""
echo -e "${BLUE}📦 Installing Frontend Dependencies...${NC}"
echo ""

# Install Node dependencies
cd "$SCRIPT_DIR/frontend"
if [ -f "package.json" ]; then
    echo "Installing npm packages..."
    npm install --force --quiet
    echo -e "${GREEN}✅ Frontend dependencies installed${NC}"
else
    echo -e "${YELLOW}⚠️  package.json not found${NC}"
fi

echo ""
echo -e "${BLUE}⚙️  Checking Configuration...${NC}"
echo ""

# Check .env file
cd "$SCRIPT_DIR"
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  .env file not found${NC}"
    echo "Creating .env from .env.example..."
    if [ -f ".env.example" ]; then
        cp ".env.example" ".env"
        echo -e "${GREEN}✅ .env file created${NC}"
        echo ""
        echo -e "${YELLOW}⚠️  IMPORTANT: Edit .env and add your GROQ_API_KEY!${NC}"
        echo "   Get a free key at: https://console.groq.com/keys"
        echo ""
    else
        echo -e "${YELLOW}⚠️  .env.example not found${NC}"
    fi
else
    echo -e "${GREEN}✅ .env file found${NC}"
fi

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║         ✅ Setup Complete!                                      ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}Next steps:${NC}"
echo "1. Edit .env and add your GROQ_API_KEY"
echo "2. Run: ${BLUE}./start.sh${NC}"
echo ""
echo "Or start manually:"
echo "  Terminal 1: ${BLUE}cd backend && ./run.sh${NC}"
echo "  Terminal 2: ${BLUE}cd frontend && npm run dev${NC}"
echo ""
