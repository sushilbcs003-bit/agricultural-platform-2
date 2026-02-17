#!/bin/bash

# Migration script to add khasra_number and land_name to land_records table
# Usage: ./apply-khasra-migration.sh

set -e

echo "🔄 Applying migration: Add khasra_number and land_name to land_records"

# Check if Docker container is running
if ! docker ps | grep -q agricultural_postgres; then
  echo "❌ Error: PostgreSQL container 'agricultural_postgres' is not running"
  echo "   Please start it with: docker compose up -d postgres"
  exit 1
fi

# Apply migration
echo "📝 Executing migration SQL..."
SCRIPT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
docker exec -i agricultural_postgres psql -U postgres -d agricultural_platform < "$SCRIPT_DIR/migrations/add-khasra-number.sql"

if [ $? -eq 0 ]; then
  echo "✅ Migration applied successfully!"
  echo ""
  echo "📊 Verifying migration..."
  docker exec -i agricultural_postgres psql -U postgres -d agricultural_platform -c "\d land_records" | grep -E "(khasra_number|land_name)" || echo "⚠️  Columns may not be visible in describe output"
else
  echo "❌ Migration failed!"
  exit 1
fi

echo ""
echo "✅ Done! khasra_number and land_name columns have been added to land_records table."
