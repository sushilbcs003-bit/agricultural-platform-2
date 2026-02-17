#!/bin/bash

# Agricultural Platform Setup Script for Docker Compose V2
# =======================================================

set -e  # Exit on any error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Banner
echo -e "${GREEN}"
echo "🌱 Agricultural Platform Setup Script"
echo "======================================"
echo -e "${NC}"

# Check prerequisites
log_info "Checking prerequisites..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    log_error "Docker is not installed. Please install Docker first."
    echo "Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check Docker Compose V2 (the correct way)
if ! docker compose version &> /dev/null; then
    log_error "Docker Compose V2 is not available."
    log_info "If you have Docker Desktop installed, Docker Compose V2 should be included."
    log_info "Try running: docker --version && docker compose version"
    
    # Check if old docker-compose exists
    if command -v docker-compose &> /dev/null; then
        log_warning "Found old docker-compose command. Please use Docker Compose V2."
        log_info "Update Docker Desktop or install Docker Compose V2 plugin."
    fi
    
    echo "Visit: https://docs.docker.com/compose/install/"
    exit 1
fi

# Display versions
DOCKER_VERSION=$(docker --version)
COMPOSE_VERSION=$(docker compose version)

log_success "Docker detected: $DOCKER_VERSION"
log_success "Docker Compose V2 detected: $COMPOSE_VERSION"

# Check if running as root (not recommended)
if [[ $EUID -eq 0 ]]; then
    log_warning "Running as root is not recommended for development."
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Create project structure
log_info "Creating project structure..."

# Create all necessary directories
directories=(
    "backend/src/config"
    "backend/src/controllers"
    "backend/src/services"
    "backend/src/middleware"
    "backend/src/routes"
    "backend/src/utils"
    "backend/src/graphql"
    "backend/prisma"
    "backend/uploads"
    "frontend/src/pages"
    "frontend/src/components"
    "frontend/src/hooks"
    "frontend/src/contexts"
    "frontend/src/utils"
    "frontend/src/styles"
    "ai-service/models"
    "ai-service/cache"
    "database"
    "nginx/ssl"
    "nginx/conf.d"
    "logs"
    "backups"
)

for dir in "${directories[@]}"; do
    mkdir -p "$dir"
done

log_success "Project structure created"

# Generate secure keys
log_info "Generating secure keys..."

# Check if openssl is available
if command -v openssl &> /dev/null; then
    JWT_SECRET=$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-64)
    JWT_REFRESH_SECRET=$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-64)
    ENCRYPTION_KEY=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)
    log_success "Generated secure keys using OpenSSL"
else
    # Fallback key generation
    log_warning "OpenSSL not found. Using fallback key generation."
    JWT_SECRET="your-super-secret-jwt-key-change-in-production-make-it-very-long-and-secure-$(date +%s)"
    JWT_REFRESH_SECRET="your-super-secret-refresh-key-change-in-production-also-very-long-and-secure-$(date +%s)"
    ENCRYPTION_KEY="your-32-character-encryption-key-$(date +%s | cut -c1-6)"
    log_warning "Please change these keys before going to production!"
fi

# Create .env file
log_info "Creating environment configuration..."

cat > .env << EOF
# ==============================================
# Agricultural Platform Environment Variables
# ==============================================

# Database Configuration
DATABASE_URL=postgresql://postgres:postgres123@localhost:5432/agricultural_platform

# Redis Configuration  
REDIS_URL=redis://localhost:6379

# Security (Generated: $(date))
JWT_SECRET=${JWT_SECRET}
JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
ENCRYPTION_KEY=${ENCRYPTION_KEY}

# Server Configuration
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000

# File Upload Settings
UPLOAD_TO_CLOUD=false
MAX_FILE_SIZE=10485760
ALLOWED_IMAGE_TYPES=image/jpeg,image/png,image/webp

# Feature Flags
ENABLE_WEBSOCKETS=true
ENABLE_GRAPHQL=true
MOCK_SMS=true
MOCK_EMAIL=true
MOCK_PAYMENT=true

# Rate Limiting
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100
AUTH_RATE_LIMIT_MAX=5

# Business Rules
OTP_EXPIRY_MINUTES=10
OTP_LENGTH=6
MAX_OTP_ATTEMPTS=3
MAX_NEGOTIATION_ROUNDS=2
BID_EXPIRY_HOURS=24

# Logging
LOG_LEVEL=info
LOG_FORMAT=json

# Docker Compose Settings
COMPOSE_PROJECT_NAME=agricultural-platform
COMPOSE_FILE=docker-compose.yml

# Development Settings
WATCH_FILES=true
HOT_RELOAD=true

# External Services (Optional - Add your keys here)
# TWILIO_ACCOUNT_SID=your_twilio_account_sid
# TWILIO_AUTH_TOKEN=your_twilio_auth_token
# SENDGRID_API_KEY=your_sendgrid_api_key
# RAZORPAY_KEY_ID=your_razorpay_key_id
# AWS_ACCESS_KEY_ID=your_aws_access_key_id
EOF

log_success "Environment file created: .env"

# Create Docker Compose file
log_info "Creating Docker Compose configuration..."

cat > docker-compose.yml << 'EOF'
# Docker Compose V2 Configuration for Agricultural Platform
name: agricultural-platform

services:
  # PostgreSQL Database
  postgres:
    image: postgres:15-alpine
    container_name: agricultural_postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: agricultural_platform
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres123
      POSTGRES_HOST_AUTH_METHOD: trust
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database:/docker-entrypoint-initdb.d:ro
    networks:
      - agricultural_network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d agricultural_platform"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 10s

  # Redis Cache
  redis:
    image: redis:7-alpine
    container_name: agricultural_redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - agricultural_network
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5
      start_period: 5s
    command: redis-server --appendonly yes --maxmemory 256mb --maxmemory-policy allkeys-lru

  # Backend API (when you add the code)
  # backend:
  #   build:
  #     context: ./backend
  #     dockerfile: Dockerfile
  #   container_name: agricultural_backend
  #   restart: unless-stopped
  #   ports:
  #     - "3001:3001"
  #   environment:
  #     - NODE_ENV=development
  #     - DATABASE_URL=postgresql://postgres:postgres123@postgres:5432/agricultural_platform
  #     - REDIS_URL=redis://redis:6379
  #   depends_on:
  #     postgres:
  #       condition: service_healthy
  #     redis:
  #       condition: service_healthy
  #   volumes:
  #     - ./backend:/app
  #     - /app/node_modules
  #   networks:
  #     - agricultural_network

  # Frontend App (when you add the code)
  # frontend:
  #   build:
  #     context: ./frontend
  #     dockerfile: Dockerfile
  #   container_name: agricultural_frontend
  #   restart: unless-stopped
  #   ports:
  #     - "3000:3000"
  #   environment:
  #     - NEXT_PUBLIC_API_URL=http://localhost:3001/api
  #   depends_on:
  #     - backend
  #   volumes:
  #     - ./frontend:/app
  #     - /app/node_modules
  #   networks:
  #     - agricultural_network

volumes:
  postgres_data:
  redis_data:

networks:
  agricultural_network:
    driver: bridge
EOF

log_success "Docker Compose file created"

# Create basic nginx configuration
log_info "Creating Nginx configuration..."

cat > nginx/nginx.conf << 'EOF'
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;
    
    # Logging
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';
    
    access_log /var/log/nginx/access.log main;
    error_log /var/log/nginx/error.log warn;
    
    # Basic settings
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 10240;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
    
    upstream backend {
        server backend:3001;
    }
    
    upstream frontend {
        server frontend:3000;
    }
    
    server {
        listen 80;
        server_name localhost;
        
        # API routes
        location /api/ {
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
        
        # GraphQL endpoint
        location /graphql {
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            
            # WebSocket support
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
        }
        
        # Frontend routes
        location / {
            proxy_pass http://frontend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
EOF

log_success "Nginx configuration created"

# Create sample database init file
log_info "Creating database initialization script..."

cat > database/init-data.sql << 'EOF'
-- Agricultural Platform Database Initialization
-- This file will be executed when PostgreSQL starts for the first time

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create indexes for better performance (will be created by Prisma migrations)
-- This is just a placeholder for any custom database setup

-- Insert sample data (optional)
-- You can add sample data here for testing

-- Log the initialization
INSERT INTO information_schema.sql_features (feature_id, feature_name, sub_feature_id, sub_feature_name, is_supported, comments)
VALUES ('AGRI001', 'Agricultural Platform', 'INIT', 'Database Initialized', 'YES', 'Database initialized successfully at ' || NOW());

-- Note: Actual tables will be created by Prisma migrations
SELECT 'Agricultural Platform database initialized successfully!' as message;
EOF

log_success "Database initialization script created"

# Create development script
log_info "Creating helper scripts..."

cat > start-dev.sh << 'EOF'
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
EOF

chmod +x start-dev.sh

cat > stop-all.sh << 'EOF'
#!/bin/bash

echo "🛑 Stopping Agricultural Platform..."
docker compose down

echo "✅ All services stopped"
echo ""
echo "🗑️  To remove all data (careful!):"
echo "docker compose down -v"
EOF

chmod +x stop-all.sh

log_success "Helper scripts created: start-dev.sh, stop-all.sh"

# Create .gitignore
log_info "Creating .gitignore file..."

cat > .gitignore << 'EOF'
# Environment files
.env
.env.local
.env.production
.env.development

# Logs
logs/
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Dependencies
node_modules/
*/node_modules/

# Build outputs
dist/
build/
.next/
out/

# Database
*.db
*.sqlite

# Uploads
uploads/*
!uploads/.gitkeep

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# IDE files
.vscode/
.idea/
*.swp
*.swo
*~

# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
env/
venv/
ENV/

# Docker
.dockerignore

# Backups
backups/
*.backup
EOF

# Create uploads directory with gitkeep
mkdir -p uploads
touch uploads/.gitkeep

log_success ".gitignore created"

# Create README for the setup
log_info "Creating README..."

cat > README-SETUP.md << 'EOF'
# Agricultural Platform - Setup Complete! 🌱

## Quick Start

1. **Start Development Environment**
```bash
   ./start-dev.sh
```

2. **Check Service Status**
```bash
   docker compose ps
```

3. **View Logs**
```bash
   docker compose logs -f
```

4. **Stop All Services**
```bash
   ./stop-all.sh
```

## Services

- **PostgreSQL**: `localhost:5432`
  - Database: `agricultural_platform`
  - User: `postgres`
  - Password: `postgres123`

- **Redis**: `localhost:6379`

## Next Steps

1. Add your backend code to `backend/` directory
2. Add your frontend code to `frontend/` directory  
3. Create Dockerfiles for both services
4. Uncomment backend/frontend in `docker-compose.yml`
5. Run `docker compose up -d`

## Useful Commands
```bash
# Start all services
docker compose up -d

# Start specific service
docker compose up -d postgres

# View logs
docker compose logs postgres
docker compose logs redis

# Execute commands in containers
docker compose exec postgres psql -U postgres -d agricultural_platform
docker compose exec redis redis-cli

# Restart services
docker compose restart postgres

# Remove everything (including data)
docker compose down -v
```

## Environment Variables

Check `.env` file for all configuration options.

## Database Connection
```bash
# Connect to PostgreSQL
psql -h localhost -U postgres -d agricultural_platform

# Test Redis
redis-cli -h localhost ping
```

Happy coding! 🚀
EOF

log_success "Setup documentation created: README-SETUP.md"

# Final summary
echo ""
echo -e "${GREEN}🎉 Setup Complete!${NC}"
echo "=================================="
echo ""
echo -e "${BLUE}📁 Project Structure:${NC}"
echo "  ✅ Directories created"
echo "  ✅ Environment file (.env)"
echo "  ✅ Docker Compose V2 configuration"
echo "  ✅ Nginx configuration"
echo "  ✅ Helper scripts"
echo "  ✅ Database initialization"
echo ""
echo -e "${BLUE}🚀 Quick Start:${NC}"
echo "  1. ./start-dev.sh                 # Start development environment"
echo "  2. docker compose ps              # Check status"
echo "  3. Add your code to backend/ and frontend/"
echo "  4. docker compose up -d           # Start full stack"
echo ""
echo -e "${BLUE}📊 Services:${NC}"
echo "  • PostgreSQL: localhost:5432"
echo "  • Redis: localhost:6379"
echo ""
echo -e "${BLUE}🔧 Useful Commands:${NC}"
echo "  • docker compose logs -f          # View logs"
echo "  • docker compose ps               # Check status"
echo "  • ./stop-all.sh                   # Stop everything"
echo ""
echo -e "${YELLOW}⚠️  Note:${NC} Backend and frontend services are commented out"
echo "    in docker-compose.yml. Uncomment them when you add your code."
echo ""
echo -e "${GREEN}Ready to build your agricultural platform! 🌱${NC}"
EOF

# Make the script executable
chmod +x setup-v2.sh

echo "✅ Fixed setup script created!"
echo ""
echo "🚀 Now run:"
echo "  ./setup-v2.sh"