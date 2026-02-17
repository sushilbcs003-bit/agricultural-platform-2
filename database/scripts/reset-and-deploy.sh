#!/bin/bash

# ==========================================================
# Database Reset and Deployment Script
# Clears all tables and applies the new 3NF+ schema
# ==========================================================

set -e  # Exit on error

echo "🚀 Starting Database Reset and Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker and try again.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker is running${NC}"

# Check if PostgreSQL container is running
CONTAINER_NAME="agricultural_postgres"
if ! docker ps | grep -q "$CONTAINER_NAME"; then
    echo -e "${YELLOW}⚠️  PostgreSQL container not running. Starting it...${NC}"
    docker compose up -d postgres
    echo "⏳ Waiting for PostgreSQL to be ready..."
    sleep 5
fi

echo -e "${GREEN}✅ PostgreSQL container is running${NC}"

# Database connection details
DB_NAME="agricultural_platform"
DB_USER="postgres"
DB_HOST="localhost"
DB_PORT="5432"

echo ""
echo "🗑️  Step 1: Dropping all existing tables..."

# Drop all tables (this will clear everything)
docker exec -i "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" <<EOF
-- Disable foreign key checks temporarily
SET session_replication_role = 'replica';

-- Drop all tables
DO \$\$ 
DECLARE 
    r RECORD;
BEGIN
    -- Drop all tables
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') 
    LOOP
        EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
    END LOOP;
    
    -- Drop all types
    FOR r IN (SELECT typname FROM pg_type WHERE typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public') AND typtype = 'e')
    LOOP
        EXECUTE 'DROP TYPE IF EXISTS ' || quote_ident(r.typname) || ' CASCADE';
    END LOOP;
END \$\$;

-- Re-enable foreign key checks
SET session_replication_role = 'origin';
EOF

echo -e "${GREEN}✅ All tables dropped${NC}"

echo ""
echo "📦 Step 2: Applying new 3NF+ schema..."

# Apply the new schema
if [ -f "database/schema-3nf.sql" ]; then
    docker exec -i "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" < database/schema-3nf.sql
    echo -e "${GREEN}✅ Schema applied successfully${NC}"
else
    echo -e "${RED}❌ Schema file not found: database/schema-3nf.sql${NC}"
    exit 1
fi

echo ""
echo "🔍 Step 3: Verifying schema..."

# Quick verification
TABLE_COUNT=$(docker exec -i "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" | tr -d ' ')

echo -e "${GREEN}✅ Found $TABLE_COUNT tables in database${NC}"

echo ""
echo "✅ Database reset and schema deployment complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Update Prisma schema: cd backend && cp prisma/schema-3nf.prisma prisma/schema.prisma"
echo "   2. Generate Prisma client: npx prisma generate"
echo "   3. Start backend: npm run dev"
echo "   4. Start frontend: cd ../frontend && npm start"
