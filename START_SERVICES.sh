#!/bin/bash

# ==========================================================
# Start Services Script
# Starts backend and frontend in development mode
# ==========================================================

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo -e "${BLUE}🚀 Starting Agricultural Platform Services...${NC}"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Docker is not running. Starting PostgreSQL manually...${NC}"
    echo "Please start Docker Desktop and run: docker compose up -d postgres"
else
    # Start PostgreSQL if not running
    if ! docker ps | grep -q "agricultural_postgres"; then
        echo -e "${YELLOW}📦 Starting PostgreSQL...${NC}"
        docker compose up -d postgres
        sleep 5
    fi
    echo -e "${GREEN}✅ PostgreSQL is running${NC}"
fi

echo ""
echo -e "${BLUE}Starting Backend...${NC}"
cd backend

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing backend dependencies..."
    npm install
fi

# Start backend in background
npm run dev &
BACKEND_PID=$!

echo -e "${GREEN}✅ Backend started (PID: $BACKEND_PID)${NC}"
echo "   URL: http://localhost:3001"

# Wait a bit for backend to start
sleep 3

echo ""
echo -e "${BLUE}Starting Frontend...${NC}"
cd ../frontend

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
fi

# Start frontend
echo -e "${GREEN}✅ Frontend starting...${NC}"
echo "   URL: http://localhost:3000"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"
echo ""

npm start

# Cleanup on exit
trap "kill $BACKEND_PID 2>/dev/null" EXIT
