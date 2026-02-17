# 🔌 Port Configuration

## 📊 Deployment Ports

### When Running Locally (npm start)

| Service | Port | URL | Description |
|---------|------|-----|-------------|
| **Frontend** | **3000** | http://localhost:3000 | React application |
| **Backend API** | **3001** | http://localhost:3001 | Node.js/Express API |
| **PostgreSQL** | **5432** | localhost:5432 | Database (Docker) |
| **Redis** | **6379** | localhost:6379 | Cache (Docker) |

### When Running with Docker Compose

| Service | Host Port | Container Port | URL | Description |
|---------|-----------|----------------|-----|-------------|
| **Frontend** | **3002** | 3000 | http://localhost:3002 | React application |
| **Backend API** | **3001** | 3001 | http://localhost:3001 | Node.js/Express API |
| **PostgreSQL** | **5432** | 5432 | localhost:5432 | Database |
| **Redis** | **6379** | 6379 | localhost:6379 | Cache |

---

## 🎯 Quick Reference

### Development Mode (Local)
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:3001
- **Health Check**: http://localhost:3001/health

### Docker Compose Mode
- **Frontend**: http://localhost:3002
- **Backend**: http://localhost:3001
- **Health Check**: http://localhost:3001/health

---

## 📝 Port Details

### Backend (Port 3001)
- **Default Port**: 3001
- **Configurable**: Yes (via `PORT` environment variable)
- **Location**: `backend/src/index.ts` line 108
- **Access**: http://localhost:3001

### Frontend (Port 3000/3002)
- **Local Development**: Port 3000 (React default)
- **Docker**: Port 3002 (mapped from container port 3000)
- **Configurable**: Yes (via `PORT` environment variable)
- **Access**: 
  - Local: http://localhost:3000
  - Docker: http://localhost:3002

### PostgreSQL (Port 5432)
- **Port**: 5432 (PostgreSQL default)
- **Host**: localhost
- **Database**: agricultural_platform
- **User**: postgres
- **Password**: postgres123

### Redis (Port 6379)
- **Port**: 6379 (Redis default)
- **Host**: localhost
- **Access**: localhost:6379

---

## 🔧 Changing Ports

### Backend Port
```bash
# Set environment variable
export PORT=4000

# Or in .env file
PORT=4000
```

### Frontend Port
```bash
# Set environment variable
export PORT=4000

# Or in package.json scripts
"start": "PORT=4000 react-scripts start"
```

### Docker Compose Ports
Edit `docker-compose.yml`:
```yaml
services:
  backend:
    ports:
      - "4000:3001"  # Host:Container
  frontend:
    ports:
      - "4001:3000"  # Host:Container
```

---

## ✅ Verify Ports

### Check if ports are in use
```bash
# Check backend port
lsof -i :3001

# Check frontend port
lsof -i :3000

# Check PostgreSQL port
lsof -i :5432

# Check Redis port
lsof -i :6379
```

### Test ports
```bash
# Test backend
curl http://localhost:3001/health

# Test frontend (if running)
curl http://localhost:3000

# Test PostgreSQL
docker exec agricultural_postgres pg_isready -U postgres

# Test Redis
docker exec agricultural_redis redis-cli ping
```

---

## 🚨 Common Port Conflicts

### Port 3000 already in use
**Solution**: 
```bash
# Find process
lsof -i :3000

# Kill process
kill -9 <PID>

# Or use different port
PORT=3003 npm start
```

### Port 3001 already in use
**Solution**:
```bash
# Find process
lsof -i :3001

# Kill process
kill -9 <PID>

# Or use different port
PORT=4001 npm run dev
```

### Port 5432 already in use
**Solution**:
```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Stop conflicting service
# Or change port in docker-compose.yml
```

---

## 📋 Summary

**Primary Ports**:
- ✅ **Frontend**: 3000 (local) / 3002 (Docker)
- ✅ **Backend**: 3001
- ✅ **PostgreSQL**: 5432
- ✅ **Redis**: 6379

**Access URLs**:
- 🌐 **Frontend**: http://localhost:3000 (or 3002 in Docker)
- 🔌 **Backend API**: http://localhost:3001
- 🏥 **Health Check**: http://localhost:3001/health

---

**Last Updated**: January 2024
