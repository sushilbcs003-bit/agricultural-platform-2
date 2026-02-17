# 🐳 Docker Redeploy Now - Step by Step

## 🚀 Quick Deploy

Run this in your terminal:

```bash
cd /Users/bravo/working_code/jan-26/agricultural-platform
chmod +x DOCKER_REDEPLOY.sh
./DOCKER_REDEPLOY.sh
```

## 📝 Manual Steps

### Step 1: Stop Existing Containers
```bash
cd /Users/bravo/working_code/jan-26/agricultural-platform
docker compose down
```

### Step 2: Start PostgreSQL
```bash
docker compose up -d postgres
sleep 10
```

### Step 3: Rebuild Backend (with new admin routes)
```bash
docker compose build backend
```

### Step 4: Rebuild Frontend
```bash
docker compose build frontend
```

### Step 5: Start All Services
```bash
docker compose up -d
```

### Step 6: Wait for Services
```bash
sleep 15
```

### Step 7: Create Admin User
```bash
docker exec agricultural_backend node src/scripts/create-admin.js
```

### Step 8: Verify Services
```bash
# Check containers
docker compose ps

# Check backend
curl http://localhost:3001/health

# Check frontend
curl http://localhost:3002
```

## 🎯 One-Liner (After Docker Starts)

```bash
cd /Users/bravo/working_code/jan-26/agricultural-platform && \
docker compose down && \
docker compose build && \
docker compose up -d && \
sleep 15 && \
docker exec agricultural_backend node src/scripts/create-admin.js
```

## ✅ Expected Results

After deployment:
- ✅ Backend: http://localhost:3001
- ✅ Frontend: http://localhost:3002 (Note: Port 3002 in Docker)
- ✅ Admin Login: http://localhost:3001/api/admin/auth/login

## 🔐 Admin Credentials

- **Email**: `admin@agricultural-platform.com`
- **Password**: `admin123`

## 📊 Service Ports (Docker)

| Service | Host Port | Container Port | URL |
|---------|-----------|----------------|-----|
| Frontend | 3002 | 3000 | http://localhost:3002 |
| Backend | 3001 | 3001 | http://localhost:3001 |
| PostgreSQL | 5432 | 5432 | localhost:5432 |
| Redis | 6379 | 6379 | localhost:6379 |

---

**Ready?** Run `./DOCKER_REDEPLOY.sh` in your terminal!
