#!/bin/bash
set -e

DB_CONTAINER="agricultural_postgres"
DB_NAME="agricultural_platform"
DB_USER="postgres"
TRUNCATE_FILE="./database/truncate-tables.sql"

echo "🔄 Truncating all tables in $DB_CONTAINER/$DB_NAME"

# Check if the container is running
if ! docker ps --filter "name=$DB_CONTAINER" --format "{{.Names}}" | grep -q "$DB_CONTAINER"; then
  echo "❌ Error: Database container '$DB_CONTAINER' is not running."
  echo "   Please ensure your Docker Compose services are up (e.g., docker compose up -d postgres)."
  exit 1
fi

# Execute the truncate SQL file inside the PostgreSQL container
docker exec -i "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" < "$TRUNCATE_FILE"

echo "✅ All tables truncated successfully."
