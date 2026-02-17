#!/bin/bash

# ==========================================================
# Complete Deployment Script
# Resets database, updates Prisma, and starts services
# ==========================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting Complete Deployment...${NC}"
echo ""

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Step 1: Reset Database
echo -e "${YELLOW}📦 Step 1: Resetting Database...${NC}"
if [ -f "database/reset-and-deploy.sh" ]; then
    bash database/reset-and-deploy.sh
else
    echo -e "${RED}❌ Database reset script not found${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}🔧 Step 2: Updating Prisma Schema...${NC}"

# Step 2: Update Prisma Schema
cd backend

if [ -f "prisma/schema-3nf.prisma" ]; then
    # Backup current schema if it exists
    if [ -f "prisma/schema.prisma" ]; then
        cp prisma/schema.prisma prisma/schema.prisma.backup.$(date +%Y%m%d_%H%M%S)
        echo -e "${GREEN}✅ Backed up existing schema${NC}"
    fi
    
    # Copy new schema
    cp prisma/schema-3nf.prisma prisma/schema.prisma
    echo -e "${GREEN}✅ Updated Prisma schema${NC}"
else
    echo -e "${RED}❌ Prisma schema-3nf.prisma not found${NC}"
    exit 1
fi

# Step 3: Generate Prisma Client
echo ""
echo -e "${YELLOW}⚙️  Step 3: Generating Prisma Client...${NC}"

if command -v npx &> /dev/null; then
    npx prisma generate
    echo -e "${GREEN}✅ Prisma client generated${NC}"
else
    echo -e "${RED}❌ npx not found. Please install Node.js and npm${NC}"
    exit 1
fi

# Step 4: Install dependencies (if needed)
echo ""
echo -e "${YELLOW}📦 Step 4: Checking dependencies...${NC}"

if [ ! -d "node_modules" ]; then
    echo "Installing backend dependencies..."
    npm install
    echo -e "${GREEN}✅ Backend dependencies installed${NC}"
else
    echo -e "${GREEN}✅ Backend dependencies already installed${NC}"
fi

# Step 5: Check frontend dependencies
cd ../frontend

if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
    echo -e "${GREEN}✅ Frontend dependencies installed${NC}"
else
    echo -e "${GREEN}✅ Frontend dependencies already installed${NC}"
fi

cd ..

echo ""
echo -e "${GREEN}✅ Deployment preparation complete!${NC}"
echo ""
echo -e "${BLUE}📋 To start the services:${NC}"
echo ""
echo -e "${YELLOW}Backend:${NC}"
echo "  cd backend"
echo "  npm run dev"
echo ""
echo -e "${YELLOW}Frontend (in a new terminal):${NC}"
echo "  cd frontend"
echo "  npm start"
echo ""
echo -e "${BLUE}Or use Docker Compose:${NC}"
echo "  docker compose up"
echo ""
