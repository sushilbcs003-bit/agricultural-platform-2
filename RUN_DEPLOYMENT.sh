#!/bin/bash

# ==========================================================
# Complete Deployment Script - Run After Docker Starts
# ==========================================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚀 Starting Complete Deployment...${NC}"
echo ""

# Check Docker
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker Desktop first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker is running${NC}"

# Start PostgreSQL
echo -e "${YELLOW}📦 Starting PostgreSQL...${NC}"
cd /Users/bravo/working_code/jan-26/agricultural-platform
docker compose up -d postgres
echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 10

# Verify PostgreSQL is ready
if ! docker exec agricultural_postgres pg_isready -U postgres > /dev/null 2>&1; then
    echo -e "${RED}❌ PostgreSQL is not ready. Please wait and try again.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ PostgreSQL is ready${NC}"

# Clear all tables
echo ""
echo -e "${YELLOW}🗑️  Clearing all tables...${NC}"
docker exec -i agricultural_postgres psql -U postgres -d agricultural_platform <<'EOF'
DO $$ 
DECLARE r RECORD;
BEGIN
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') 
    LOOP 
        EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE'; 
    END LOOP;
    FOR r IN (SELECT typname FROM pg_type WHERE typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public') AND typtype = 'e')
    LOOP 
        EXECUTE 'DROP TYPE IF EXISTS ' || quote_ident(r.typname) || ' CASCADE'; 
    END LOOP;
END $$;
SELECT 'All tables and types dropped' as status;
EOF

echo -e "${GREEN}✅ Tables cleared${NC}"

# Apply new schema
echo ""
echo -e "${YELLOW}📦 Applying new 3NF+ schema...${NC}"
docker exec -i agricultural_postgres psql -U postgres -d agricultural_platform < database/schema-3nf.sql

echo -e "${GREEN}✅ Schema applied${NC}"

# Verify tables
TABLE_COUNT=$(docker exec -i agricultural_postgres psql -U postgres -d agricultural_platform -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" | tr -d ' ')
echo -e "${GREEN}✅ Found $TABLE_COUNT tables in database${NC}"

# Generate Prisma client
echo ""
echo -e "${YELLOW}⚙️  Generating Prisma client...${NC}"
cd backend
npx prisma generate

echo -e "${GREEN}✅ Prisma client generated${NC}"

echo ""
echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo -e "${BLUE}📋 Next steps:${NC}"
echo -e "${YELLOW}1. Start backend:${NC}"
echo "   cd backend"
echo "   npm run dev"
echo ""
echo -e "${YELLOW}2. Start frontend (in new terminal):${NC}"
echo "   cd frontend"
echo "   npm start"
echo ""
