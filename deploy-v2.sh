#!/bin/bash

# Agricultural Platform v2 Deployment Script
# This script builds and deploys all services with v2 tags

set -e

echo "🚀 Agricultural Platform v2 Deployment"
echo "========================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker Desktop.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker is running${NC}"
echo ""

# Stop existing containers
echo -e "${YELLOW}📦 Stopping existing containers...${NC}"
docker compose down 2>/dev/null || true

# Build images with v2 tags
echo -e "${YELLOW}🔨 Building Docker images (v2)...${NC}"
docker compose build --no-cache

# Start services
echo -e "${YELLOW}🚀 Starting services...${NC}"
docker compose up -d

# Wait for services to be healthy
echo -e "${YELLOW}⏳ Waiting for services to be healthy...${NC}"
sleep 10

# Check service status
echo ""
echo -e "${GREEN}📊 Service Status:${NC}"
docker compose ps

echo ""
echo -e "${GREEN}✅ Deployment Complete!${NC}"
echo ""
echo "Service URLs:"
echo "  - Frontend:    http://localhost:3002"
echo "  - Backend API: http://localhost:3001"
echo "  - AI Service:  http://localhost:5000"
echo "  - Jaeger UI:   http://localhost:16686"
echo ""
echo "View logs: docker compose logs -f"
echo "Stop services: docker compose down"
echo ""
