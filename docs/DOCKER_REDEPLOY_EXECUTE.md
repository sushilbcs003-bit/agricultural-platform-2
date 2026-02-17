# 🐳 Execute Docker Redeployment Now

## ✅ All Code is Ready!

The following has been prepared:
- ✅ Admin routes created (`/api/admin/auth/login`)
- ✅ Dockerfiles updated
- ✅ Docker Compose configured
- ✅ Admin user creation script ready

## 🚀 Execute This Command

**Copy and paste this entire command in your terminal:**

```bash
cd /Users/bravo/working_code/jan-26/agricultural-platform && \
docker compose down && \
docker compose build && \
docker compose up -d && \
sleep 20 && \
docker exec agricultural_backend node src/scripts/create-admin.js && \
echo "" && \
echo "✅✅✅ Docker Redeployment Complete! ✅✅✅" && \
echo "" && \
echo "🌐 Access URLs:" && \
echo "   Frontend: http://localhost:3002" && \
echo "   Backend:  http://localhost:3001" && \
echo "   Health:   http://localhost:3001/health" && \
echo "" && \
echo "🔐 Admin Login:" && \
echo "   URL:      http://localhost:3001/api/admin/auth/login" && \
echo "   Email:    admin@agricultural-platform.com" && \
echo "   Password: admin123" && \
echo "" && \
echo "📊 Check Status:" && \
echo "   docker compose ps" && \
echo ""
```

## 📋 What This Does

1. **Stops** all existing containers
2. **Rebuilds** containers with latest code (including admin routes)
3. **Starts** all services (PostgreSQL, Redis, Backend, Frontend)
4. **Waits** for services to be ready
5. **Creates** admin user
6. **Shows** all access URLs

## 🎯 After Deployment

### Access Frontend
- **URL**: http://localhost:3002
- **Note**: Port 3002 (not 3000) when using Docker

### Access Backend
- **URL**: http://localhost:3001
- **Health**: http://localhost:3001/health

### Admin Login
- **Endpoint**: `POST http://localhost:3001/api/admin/auth/login`
- **Email**: `admin@agricultural-platform.com`
- **Password**: `admin123`

## 🔍 Verify Deployment

### Check Containers
```bash
docker compose ps
```

### Test Backend
```bash
curl http://localhost:3001/health
```

### Test Admin Endpoint
```bash
curl -X POST http://localhost:3001/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@agricultural-platform.com","password":"admin123"}'
```

## 📊 Service Ports (Docker)

| Service | Port | URL |
|---------|------|-----|
| Frontend | 3002 | http://localhost:3002 |
| Backend | 3001 | http://localhost:3001 |
| PostgreSQL | 5432 | localhost:5432 |
| Redis | 6379 | localhost:6379 |

## 🛠️ Quick Commands

### View Logs
```bash
docker compose logs -f
```

### Restart Services
```bash
docker compose restart
```

### Stop Services
```bash
docker compose stop
```

---

**Ready?** Copy and paste the deployment command above! 🚀
