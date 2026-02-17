#!/bin/bash

echo "🌱 Starting Agricultural Platform in Development Mode..."

# Start database and redis first
echo "📊 Starting database and cache services..."
docker compose up -d postgres redis

# Wait for services to be healthy
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check if services are running
if docker compose ps postgres | grep -q "Up"; then
    echo "✅ PostgreSQL is running"
else
    echo "❌ PostgreSQL failed to start"
    exit 1
fi

if docker compose ps redis | grep -q "Up"; then
    echo "✅ Redis is running"
else
    echo "❌ Redis failed to start"
    exit 1
fi

echo ""
echo "🎉 Development environment is ready!"
echo ""
echo "📋 Next steps:"
echo "1. Add your application code to backend/ and frontend/ directories"
echo "2. Create Dockerfiles for backend and frontend"
echo "3. Uncomment backend and frontend services in docker-compose.yml"
echo "4. Run: docker compose up -d"
echo ""
echo "🔍 Current services:"
echo "• PostgreSQL: localhost:5432"
echo "• Redis: localhost:6379"
echo ""
echo "🧪 Test connections:"
echo "• psql -h localhost -U postgres -d agricultural_platform"
echo "• redis-cli -h localhost ping"
