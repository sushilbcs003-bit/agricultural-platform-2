# Complete Deployment Guide

## 🚀 Quick Start

### Prerequisites
1. **Docker Desktop** must be running
2. **Node.js** (v16+) and **npm** installed
3. **PostgreSQL** (if not using Docker)

## Step-by-Step Deployment

### Step 1: Start Docker Desktop
```bash
# Make sure Docker Desktop is running
# On macOS: Open Docker Desktop application
# On Linux: sudo systemctl start docker
```

### Step 2: Clear Database and Apply Schema

**Option A: Using the deployment script (Recommended)**
```bash
cd /Users/bravo/working_code/jan-26/agricultural-platform
./deploy.sh
```

**Option B: Manual steps**
```bash
# 1. Start PostgreSQL container
docker compose up -d postgres

# 2. Wait for PostgreSQL to be ready (5-10 seconds)
sleep 10

# 3. Clear all tables and apply new schema
docker exec -i agricultural_postgres psql -U postgres -d agricultural_platform <<EOF
-- Drop all tables
DO \$\$ 
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
END \$\$;
EOF

# 4. Apply new schema
docker exec -i agricultural_postgres psql -U postgres -d agricultural_platform < database/schema-3nf.sql
```

### Step 3: Update Prisma Schema

```bash
cd backend

# Backup existing schema
cp prisma/schema.prisma prisma/schema.prisma.backup

# Use new schema
cp prisma/schema-3nf.prisma prisma/schema.prisma

# Generate Prisma client
npx prisma generate
```

### Step 4: Install Dependencies (if needed)

```bash
# Backend dependencies
cd backend
npm install

# Frontend dependencies
cd ../frontend
npm install
```

### Step 5: Start Services

**Option A: Using Docker Compose (All services)**
```bash
# From project root
docker compose up
```

**Option B: Manual (Development mode)**

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
# Backend will run on http://localhost:3001
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
# Frontend will run on http://localhost:3000
```

## 🔍 Verification

### Check Database
```bash
# Connect to database
docker exec -it agricultural_postgres psql -U postgres -d agricultural_platform

# List all tables
\dt

# Count tables
SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';

# Exit
\q
```

### Check Backend
```bash
# Health check
curl http://localhost:3001/health

# API info
curl http://localhost:3001/
```

### Check Frontend
```bash
# Open browser
open http://localhost:3000
```

## 📋 Deployment Checklist

- [ ] Docker Desktop is running
- [ ] PostgreSQL container is running
- [ ] All tables cleared
- [ ] New schema applied
- [ ] Prisma schema updated
- [ ] Prisma client generated
- [ ] Backend dependencies installed
- [ ] Frontend dependencies installed
- [ ] Backend server running (port 3001)
- [ ] Frontend server running (port 3000)
- [ ] Database connection verified
- [ ] API endpoints responding

## 🐛 Troubleshooting

### Docker not running
```bash
# macOS: Open Docker Desktop
# Linux: sudo systemctl start docker
# Windows: Start Docker Desktop
```

### Port already in use
```bash
# Find process using port 3001
lsof -i :3001
# Kill process
kill -9 <PID>

# Or change port in .env file
```

### Prisma client errors
```bash
cd backend
rm -rf node_modules/.prisma
npx prisma generate
```

### Database connection errors
```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Restart PostgreSQL
docker compose restart postgres

# Check logs
docker logs agricultural_postgres
```

## 🎯 Quick Commands

### Full Reset (Clear everything)
```bash
# Stop all containers
docker compose down

# Remove volumes (clears all data)
docker compose down -v

# Start fresh
docker compose up -d postgres
sleep 10
docker exec -i agricultural_postgres psql -U postgres -d agricultural_platform < database/schema-3nf.sql
```

### View Logs
```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f postgres
```

### Stop Services
```bash
# Stop all
docker compose down

# Stop and remove volumes
docker compose down -v
```

## 📊 Expected Results

After successful deployment:

- **Database**: 30+ tables created
- **Backend**: Running on http://localhost:3001
- **Frontend**: Running on http://localhost:3000
- **API Endpoints**: All new routes available
  - `/api/machinery`
  - `/api/cart`
  - `/api/location`
  - `/api/payment`

## 🔗 Useful Links

- Backend API: http://localhost:3001
- Frontend App: http://localhost:3000
- Health Check: http://localhost:3001/health
- API Docs: http://localhost:3001/ (root endpoint)

---

**Last Updated**: January 2024
