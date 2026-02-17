#!/bin/bash

echo "🌱 Setting up Agricultural Platform with Docker Compose V2..."

# Check Docker Compose V2
if ! docker compose version >/dev/null 2>&1; then
    echo "❌ Docker Compose V2 not found. Please update Docker Desktop."
    echo "Download from: https://www.docker.com/products/docker-desktop/"
    exit 1
fi

echo "✅ Docker Compose V2 detected"

# Create project structure
echo "📁 Creating project structure..."
mkdir -p {backend/src,frontend/src,ai-service,database,nginx/ssl,uploads}

# Generate secure keys
echo "🔐 Generating secure keys..."
JWT_SECRET=$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-64)
JWT_REFRESH_SECRET=$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-64)
ENCRYPTION_KEY=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)

# Create .env file
cat > .env << EOF
# Database
DATABASE_URL=postgresql://postgres:postgres123@localhost:5432/agricultural_platform
REDIS_URL=redis://localhost:6379

# Security (Generated securely)
JWT_SECRET=${JWT_SECRET}
JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
ENCRYPTION_KEY=${ENCRYPTION_KEY}

# Server
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000

# Features
UPLOAD_TO_CLOUD=false
ENABLE_WEBSOCKETS=true
MOCK_SMS=true
MOCK_EMAIL=true
MOCK_PAYMENT=true

# Docker Compose
COMPOSE_PROJECT_NAME=agricultural-platform
COMPOSE_FILE=docker-compose.yml
EOF

echo "✅ Generated .env with secure keys"

# Create basic nginx config
mkdir -p nginx
cat > nginx/nginx.conf << 'EOF'
events {
    worker_connections 1024;
}

http {
    upstream backend {
        server backend:3001;
    }
    
    upstream frontend {
        server frontend:3000;
    }
    
    server {
        listen 80;
        
        location /api/ {
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }
        
        location /graphql {
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
        }
        
        location / {
            proxy_pass http://frontend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }
    }
}
EOF

echo "✅ Created nginx configuration"

# Make script executable
chmod +x setup-v2.sh

echo ""
echo "🎉 Setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. docker compose up -d          # Start all services"
echo "2. docker compose logs -f        # Watch logs"
echo "3. docker compose exec backend npx prisma migrate dev  # Setup database"
echo ""
echo "🌐 Access points:"
echo "• Frontend:  http://localhost:3000"
echo "• Backend:   http://localhost:3001"
echo "• AI Service: http://localhost:5000"
echo "• Database:  localhost:5432"
echo "• Redis:     localhost:6379"
echo ""
echo "🔧 Useful commands:"
echo "• docker compose ps              # Check status"
echo "• docker compose logs backend    # View backend logs"
echo "• docker compose restart backend # Restart backend"
echo "• docker compose down           # Stop all services"