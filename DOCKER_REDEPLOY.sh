#!/bin/bash

# ==========================================================
# Docker Redeployment Script
# Rebuilds and redeploys all services on Docker
# ==========================================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🐳 Starting Docker Redeployment...${NC}"
echo ""

# Check Docker
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker Desktop first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker is running${NC}"

cd /Users/bravo/working_code/jan-26/agricultural-platform

# Stop existing containers
echo -e "${YELLOW}🛑 Stopping existing containers...${NC}"
docker compose down 2>/dev/null || true
sleep 2

echo -e "${GREEN}✅ Containers stopped${NC}"

# Ensure PostgreSQL is running first
echo -e "${YELLOW}📦 Starting PostgreSQL...${NC}"
docker compose up -d postgres
echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 10

# Verify PostgreSQL is ready
if ! docker exec agricultural_postgres pg_isready -U postgres > /dev/null 2>&1; then
    echo -e "${RED}❌ PostgreSQL is not ready. Please wait and try again.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ PostgreSQL is ready${NC}"

# Rebuild backend (to include new admin routes)
echo ""
echo -e "${YELLOW}🔨 Rebuilding backend container...${NC}"
docker compose build backend 2>&1 | tail -10

echo -e "${GREEN}✅ Backend rebuilt${NC}"

# Rebuild frontend
echo ""
echo -e "${YELLOW}🔨 Rebuilding frontend container...${NC}"
docker compose build frontend 2>&1 | tail -10

echo -e "${GREEN}✅ Frontend rebuilt${NC}"

# Start all services
echo ""
echo -e "${YELLOW}🚀 Starting all services...${NC}"
docker compose up -d

echo ""
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check service status
echo ""
echo -e "${YELLOW}🔍 Checking service status...${NC}"

# Check PostgreSQL
if docker exec agricultural_postgres pg_isready -U postgres > /dev/null 2>&1; then
    echo -e "${GREEN}✅ PostgreSQL: Running${NC}"
else
    echo -e "${RED}❌ PostgreSQL: Not ready${NC}"
fi

# Check Backend
sleep 5
if curl -s http://localhost:3001/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend: Running on http://localhost:3001${NC}"
else
    echo -e "${YELLOW}⚠️  Backend: Starting (may take a moment)${NC}"
fi

# Check Frontend
if curl -s http://localhost:3002 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Frontend: Running on http://localhost:3002${NC}"
else
    echo -e "${YELLOW}⚠️  Frontend: Starting (may take a moment)${NC}"
fi

# Create admin user
echo ""
echo -e "${YELLOW}👤 Creating admin user (if needed)...${NC}"
docker exec agricultural_backend node src/scripts/create-admin.js 2>&1 | grep -E "(✅|created|exists|Email|Password)" || echo "Admin user check completed"

echo ""
echo -e "${GREEN}✅✅✅ Docker Redeployment Complete! ✅✅✅${NC}"
echo ""
echo -e "${BLUE}📋 Service URLs:${NC}"
echo -e "${GREEN}Frontend:${NC}  http://localhost:3002"
echo -e "${GREEN}Backend:${NC}   http://localhost:3001"
echo -e "${GREEN}Health:${NC}    http://localhost:3001/health"
echo ""
echo -e "${BLUE}🔐 Admin Login:${NC}"
echo "   URL: http://localhost:3001/api/admin/auth/login"
echo "   Email: admin@agricultural-platform.com"
echo "   Password: admin123"
echo ""
echo -e "${YELLOW}📝 View logs:${NC}"
echo "   docker compose logs -f"
echo "   docker compose logs -f backend"
echo "   docker compose logs -f frontend"
echo ""
