#!/bin/bash

# ==========================================================
# Apply 3NF+ Database Schema Script
# Agricultural Trading Platform
# ==========================================================

set -e

echo "🌱 Applying 3NF+ Database Schema..."
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker first.${NC}"
    exit 1
fi

# Check if PostgreSQL container is running
if ! docker ps | grep -q agricultural_postgres; then
    echo -e "${YELLOW}⚠️  PostgreSQL container is not running. Starting it...${NC}"
    cd "$(dirname "$0")/.."
    docker compose up -d postgres
    echo "⏳ Waiting for PostgreSQL to be ready..."
    sleep 10
fi

# Get the database directory (parent of scripts/)
SCRIPT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SCHEMA_FILE="$SCRIPT_DIR/schema-3nf.sql"

# Check if schema file exists
if [ ! -f "$SCHEMA_FILE" ]; then
    echo -e "${RED}❌ Schema file not found: $SCHEMA_FILE${NC}"
    exit 1
fi

echo -e "${GREEN}📄 Found schema file: $SCHEMA_FILE${NC}"
echo ""

# Apply schema
echo "📥 Applying schema to database..."
if docker exec -i agricultural_postgres psql -U postgres -d agricultural_platform < "$SCHEMA_FILE"; then
    # Run post-schema init scripts (e.g. enum extensions, user columns)
    for z in "$SCRIPT_DIR"/z_*.sql; do
        [ -f "$z" ] && echo "  Applying $(basename "$z")" && docker exec -i agricultural_postgres psql -U postgres -d agricultural_platform < "$z" 2>/dev/null || true
    done
    # Run migrations (schema extensions)
    MIGRATIONS_DIR="$SCRIPT_DIR/migrations"
    if [ -d "$MIGRATIONS_DIR" ]; then
        for m in "$MIGRATIONS_DIR"/*.sql; do
            if [ -f "$m" ]; then
                echo "  Applying migration: $(basename "$m")"
                docker exec -i agricultural_postgres psql -U postgres -d agricultural_platform < "$m" 2>/dev/null || true
            fi
        done
    fi
    echo ""
    echo -e "${GREEN}✅ Schema applied successfully!${NC}"
    echo ""
    
    # Verify tables were created
    echo "🔍 Verifying tables..."
    TABLE_COUNT=$(docker exec agricultural_postgres psql -U postgres -d agricultural_platform -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" | tr -d ' ')
    
    if [ "$TABLE_COUNT" -gt "0" ]; then
        echo -e "${GREEN}✅ Found $TABLE_COUNT tables in database${NC}"
    else
        echo -e "${YELLOW}⚠️  No tables found. Please check the schema file.${NC}"
    fi
    
    # Check seed data
    echo ""
    echo "🔍 Verifying seed data..."
    
    COUNTRIES=$(docker exec agricultural_postgres psql -U postgres -d agricultural_platform -t -c "SELECT COUNT(*) FROM countries;" | tr -d ' ')
    MACH_CATS=$(docker exec agricultural_postgres psql -U postgres -d agricultural_platform -t -c "SELECT COUNT(*) FROM machinery_category_master;" | tr -d ' ')
    MACH_TYPES=$(docker exec agricultural_postgres psql -U postgres -d agricultural_platform -t -c "SELECT COUNT(*) FROM machinery_type_master;" | tr -d ' ')
    SUPPLIER_TYPES=$(docker exec agricultural_postgres psql -U postgres -d agricultural_platform -t -c "SELECT COUNT(*) FROM supplier_type_master;" | tr -d ' ')
    
    echo "  Countries: $COUNTRIES"
    echo "  Machinery Categories: $MACH_CATS"
    echo "  Machinery Types: $MACH_TYPES"
    echo "  Supplier Types: $SUPPLIER_TYPES"
    
    echo ""
    echo -e "${GREEN}🎉 Database schema setup complete!${NC}"
    echo ""
    echo "📋 Next steps:"
    echo "  1. Update Prisma schema if using Prisma ORM"
    echo "  2. Update backend models to match new schema"
    echo "  3. Test API endpoints"
    echo ""
    
else
    echo ""
    echo -e "${RED}❌ Failed to apply schema. Please check the error messages above.${NC}"
    exit 1
fi
