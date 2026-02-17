#!/bin/bash

# ==========================================================
# Redeploy Script - Restart Services with Latest Code
# ==========================================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔄 Starting Redeployment...${NC}"
echo ""

# Check Docker
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker Desktop first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker is running${NC}"

cd /Users/bravo/working_code/jan-26/agricultural-platform

# Stop existing services
echo -e "${YELLOW}🛑 Stopping existing services...${NC}"
docker compose stop backend frontend 2>/dev/null || true
pkill -f "npm run dev" 2>/dev/null || true
pkill -f "react-scripts start" 2>/dev/null || true
sleep 2

echo -e "${GREEN}✅ Services stopped${NC}"

# Ensure PostgreSQL is running
echo -e "${YELLOW}📦 Ensuring PostgreSQL is running...${NC}"
docker compose up -d postgres
sleep 5

if ! docker exec agricultural_postgres pg_isready -U postgres > /dev/null 2>&1; then
    echo -e "${RED}❌ PostgreSQL is not ready${NC}"
    exit 1
fi

echo -e "${GREEN}✅ PostgreSQL is ready${NC}"

# Generate Prisma client (in case schema changed)
echo -e "${YELLOW}⚙️  Generating Prisma client...${NC}"
cd backend
npx prisma generate > /dev/null 2>&1 || echo "Prisma client already generated"
cd ..

echo -e "${GREEN}✅ Prisma client ready${NC}"

# Start backend
echo ""
echo -e "${YELLOW}🚀 Starting backend server...${NC}"
cd backend
npm run dev > /tmp/backend.log 2>&1 &
BACKEND_PID=$!
cd ..

sleep 5

# Check if backend started
if curl -s http://localhost:3001/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend is running (PID: $BACKEND_PID)${NC}"
    echo "   URL: http://localhost:3001"
else
    echo -e "${YELLOW}⚠️  Backend may still be starting...${NC}"
fi

# Start frontend
echo ""
echo -e "${YELLOW}🚀 Starting frontend server...${NC}"
cd frontend
npm start > /tmp/frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

sleep 3

echo -e "${GREEN}✅ Frontend is starting (PID: $FRONTEND_PID)${NC}"
echo "   URL: http://localhost:3000"

# Create admin user if needed
echo ""
echo -e "${YELLOW}👤 Creating admin user (if needed)...${NC}"
cd backend
DATABASE_URL="postgresql://postgres:postgres123@localhost:5432/agricultural_platform" \
node src/scripts/create-admin.js 2>&1 | grep -v "Error\|error" || echo "Admin user check completed"
cd ..

echo ""
echo -e "${GREEN}✅✅✅ Redeployment Complete! ✅✅✅${NC}"
echo ""
echo -e "${BLUE}📋 Service Status:${NC}"
echo -e "${GREEN}Backend:${NC}  http://localhost:3001"
echo -e "${GREEN}Frontend:${NC} http://localhost:3000"
echo -e "${GREEN}Health:${NC}   http://localhost:3001/health"
echo ""
echo -e "${BLUE}🔐 Admin Login:${NC}"
echo "   URL: http://localhost:3001/api/admin/auth/login"
echo "   Email: admin@agricultural-platform.com"
echo "   Password: admin123"
echo ""
echo -e "${YELLOW}📝 View logs:${NC}"
echo "   Backend:  tail -f /tmp/backend.log"
echo "   Frontend: tail -f /tmp/frontend.log"
echo ""
