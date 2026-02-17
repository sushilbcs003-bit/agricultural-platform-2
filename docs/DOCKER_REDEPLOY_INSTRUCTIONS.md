# 🐳 Docker Redeployment Instructions

## ✅ Ready to Deploy

All code is ready for Docker deployment, including:
- ✅ Admin login endpoint (`/api/admin/auth/login`)
- ✅ Updated Dockerfiles
- ✅ Docker Compose configuration
- ✅ Admin user creation script

## 🚀 Deploy Now

### Quick Deploy (Recommended)

Run this single command in your terminal:

```bash
cd /Users/bravo/working_code/jan-26/agricultural-platform && \
docker compose down && \
docker compose build && \
docker compose up -d && \
sleep 15 && \
docker exec agricultural_backend node src/scripts/create-admin.js
```

### Or Use the Script

```bash
cd /Users/bravo/working_code/jan-26/agricultural-platform
chmod +x DOCKER_REDEPLOY.sh
./DOCKER_REDEPLOY.sh
```

## 📋 Manual Steps

### Step 1: Stop Existing Containers
```bash
docker compose down
```

### Step 2: Rebuild Containers
```bash
# Rebuild all
docker compose build

# Or rebuild specific services
docker compose build backend
docker compose build frontend
```

### Step 3: Start All Services
```bash
docker compose up -d
```

### Step 4: Wait for Services
```bash
sleep 15
```

### Step 5: Create Admin User
```bash
docker exec agricultural_backend node src/scripts/create-admin.js
```

### Step 6: Verify Deployment
```bash
# Check containers
docker compose ps

# Check backend health
curl http://localhost:3001/health

# Check admin endpoint
curl -X POST http://localhost:3001/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@agricultural-platform.com","password":"admin123"}'
```

## 🎯 Service URLs (Docker)

| Service | URL | Port |
|---------|-----|------|
| **Frontend** | http://localhost:3002 | 3002 |
| **Backend** | http://localhost:3001 | 3001 |
| **Health Check** | http://localhost:3001/health | 3001 |
| **Admin Login** | http://localhost:3001/api/admin/auth/login | 3001 |

**Note**: Frontend runs on port **3002** in Docker (not 3000)

## 🔐 Admin Credentials

- **Email**: `admin@agricultural-platform.com`
- **Password**: `admin123`

## 📊 Container Status

After deployment, check status:
```bash
docker compose ps
```

Expected:
```
NAME                      STATUS
agricultural_backend      Up
agricultural_frontend     Up
agricultural_postgres     Up
agricultural_redis        Up
```

## 🛠️ Useful Commands

### View Logs
```bash
# All services
docker compose logs -f

# Backend only
docker compose logs -f backend

# Frontend only
docker compose logs -f frontend
```

### Restart Services
```bash
# All services
docker compose restart

# Specific service
docker compose restart backend
```

### Stop Services
```bash
# Stop (keeps data)
docker compose stop

# Stop and remove (keeps data)
docker compose down

# Stop and remove everything
docker compose down -v
```

## 🐛 Troubleshooting

### Services not starting
```bash
# Check logs
docker compose logs

# Check Docker
docker info
```

### Backend errors
```bash
# View logs
docker compose logs backend

# Rebuild and restart
docker compose build backend
docker compose up -d backend
```

### Frontend not loading
```bash
# View logs
docker compose logs frontend

# Rebuild and restart
docker compose build frontend
docker compose up -d frontend
```

### Admin user creation fails
```bash
# Check database connection
docker exec agricultural_postgres pg_isready -U postgres

# Create admin manually
docker exec -it agricultural_backend bash
node src/scripts/create-admin.js
```

---

**Status**: ✅ Ready for Docker Deployment  
**Script**: `DOCKER_REDEPLOY.sh`  
**Quick Deploy**: See `DOCKER_REDEPLOY_QUICK.md`
