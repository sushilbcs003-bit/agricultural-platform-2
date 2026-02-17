#!/bin/bash

echo "🛑 Stopping Agricultural Platform..."
echo "⚠️  Note: Database data will be PRESERVED (using named volumes)"
docker compose down

echo "✅ All services stopped"
echo ""
echo "💾 Database data is SAFE - stored in persistent Docker volumes"
echo ""
echo "🗑️  To remove all data (careful!):"
echo "docker compose down -v"
