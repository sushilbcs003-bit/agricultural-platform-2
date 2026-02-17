#!/bin/bash

# ==========================================================
# Deploy with OpenTelemetry + Jaeger Tracing
# ==========================================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔍 Deploying with OpenTelemetry + Jaeger Tracing...${NC}"
echo ""

cd /Users/bravo/working_code/jan-26/agricultural-platform

# Check Docker
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker Desktop first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker is running${NC}"

# Install backend dependencies
echo ""
echo -e "${YELLOW}📦 Installing backend dependencies...${NC}"
cd backend
npm install 2>&1 | tail -10
cd ..

# Install frontend dependencies
echo ""
echo -e "${YELLOW}📦 Installing frontend dependencies...${NC}"
cd frontend
npm install 2>&1 | tail -10
cd ..

# Stop existing containers
echo ""
echo -e "${YELLOW}🛑 Stopping existing containers...${NC}"
docker compose down 2>/dev/null || true
sleep 2

# Start Jaeger first
echo ""
echo -e "${YELLOW}🔍 Starting Jaeger...${NC}"
docker compose up -d jaeger
sleep 5

# Start PostgreSQL
echo ""
echo -e "${YELLOW}📦 Starting PostgreSQL...${NC}"
docker compose up -d postgres
echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 10

# Rebuild backend
echo ""
echo -e "${YELLOW}🔨 Rebuilding backend with tracing...${NC}"
docker compose build backend 2>&1 | tail -15

# Rebuild frontend
echo ""
echo -e "${YELLOW}🔨 Rebuilding frontend with tracing...${NC}"
docker compose build frontend 2>&1 | tail -15

# Start all services
echo ""
echo -e "${YELLOW}🚀 Starting all services...${NC}"
docker compose up -d

echo ""
echo "⏳ Waiting for services to be ready..."
sleep 15

# Check service status
echo ""
echo -e "${YELLOW}🔍 Checking service status...${NC}"

# Check Jaeger
if curl -s http://localhost:16686 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Jaeger: Running on http://localhost:16686${NC}"
else
    echo -e "${YELLOW}⚠️  Jaeger: Starting (may take a moment)${NC}"
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

echo ""
echo -e "${GREEN}✅✅✅ Deployment with Tracing Complete! ✅✅✅${NC}"
echo ""
echo -e "${BLUE}📋 Service URLs:${NC}"
echo -e "${GREEN}Frontend:${NC}  http://localhost:3002"
echo -e "${GREEN}Backend:${NC}   http://localhost:3001"
echo -e "${GREEN}Jaeger UI:${NC} http://localhost:16686"
echo ""
echo -e "${BLUE}🔍 View Traces:${NC}"
echo "   1. Open http://localhost:16686"
echo "   2. Select service: 'agricultural-frontend' or 'agricultural-backend'"
echo "   3. Click 'Find Traces'"
echo "   4. See complete request flow from Frontend → Backend → Database"
echo ""
echo -e "${YELLOW}📝 View logs:${NC}"
echo "   docker compose logs -f"
echo "   docker compose logs -f backend"
echo "   docker compose logs -f frontend"
echo "   docker compose logs -f jaeger"
echo ""
