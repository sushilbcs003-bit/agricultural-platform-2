# 🐳 Docker Deployment Steps

## ✅ What's Ready

- ✅ Docker Compose configuration
- ✅ Backend Dockerfile
- ✅ Frontend Dockerfile
- ✅ Admin routes added to backend
- ✅ Redeployment script created

## 🚀 Deploy on Docker

### Option 1: Use Redeployment Script (Recommended)

```bash
cd /Users/bravo/working_code/jan-26/agricultural-platform
chmod +x DOCKER_REDEPLOY.sh
./DOCKER_REDEPLOY.sh
```

### Option 2: Manual Commands

```bash
# 1. Navigate to project
cd /Users/bravo/working_code/jan-26/agricultural-platform

# 2. Stop existing containers
docker compose down

# 3. Rebuild containers (to include new admin routes)
docker compose build

# 4. Start all services
docker compose up -d

# 5. Wait for services to start
sleep 15

# 6. Create admin user
docker exec agricultural_backend node src/scripts/create-admin.js

# 7. Verify deployment
docker compose ps
curl http://localhost:3001/health
```

## 📊 Service URLs (Docker)

### Frontend
- **URL**: http://localhost:3002
- **Note**: Port 3002 (not 3000) when using Docker

### Backend
- **URL**: http://localhost:3001
- **Health**: http://localhost:3001/health
- **Admin Login**: http://localhost:3001/api/admin/auth/login

### Database
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

## 🔍 Verify Deployment

### Check Containers
```bash
docker compose ps
```

Expected output:
```
NAME                      STATUS
agricultural_backend      Up
agricultural_frontend     Up
agricultural_postgres     Up
agricultural_redis        Up
```

### Check Backend
```bash
curl http://localhost:3001/health
```

### Check Frontend
```bash
curl http://localhost:3002
```

### Check Admin Endpoint
```bash
curl -X POST http://localhost:3001/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@agricultural-platform.com","password":"admin123"}'
```

## 🛠️ Docker Commands Reference

### View Logs
```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f backend
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

### Rebuild Specific Service
```bash
# Rebuild backend
docker compose build backend
docker compose up -d backend

# Rebuild frontend
docker compose build frontend
docker compose up -d frontend
```

## 🔐 Admin Setup

### Create Admin User
```bash
docker exec agricultural_backend node src/scripts/create-admin.js
```

### Default Credentials
- **Email**: `admin@agricultural-platform.com`
- **Password**: `admin123`

## 📝 Important Notes

1. **Port Difference**: Frontend runs on port 3002 in Docker (not 3000)
2. **Data Persistence**: Database data persists in Docker volumes
3. **Rebuild Required**: After code changes, rebuild containers
4. **Admin User**: Create admin user after first deployment

## 🐛 Troubleshooting

### Containers not starting
```bash
# Check logs
docker compose logs

# Check Docker status
docker info
```

### Backend errors
```bash
# View backend logs
docker compose logs backend

# Restart backend
docker compose restart backend
```

### Frontend not loading
```bash
# View frontend logs
docker compose logs frontend

# Rebuild frontend
docker compose build frontend
docker compose up -d frontend
```

---

**Status**: Ready for Docker deployment  
**Script**: `DOCKER_REDEPLOY.sh`  
**Last Updated**: January 2024
