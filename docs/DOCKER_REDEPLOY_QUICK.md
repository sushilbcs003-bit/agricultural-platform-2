# 🐳 Quick Docker Redeploy

## 🚀 One Command Deploy

```bash
cd /Users/bravo/working_code/jan-26/agricultural-platform && \
docker compose down && \
docker compose build && \
docker compose up -d && \
sleep 15 && \
docker exec agricultural_backend node src/scripts/create-admin.js && \
echo "✅ Deployment complete! Frontend: http://localhost:3002, Backend: http://localhost:3001"
```

## 📋 Step by Step

### 1. Stop Existing
```bash
docker compose down
```

### 2. Rebuild & Start
```bash
docker compose build
docker compose up -d
```

### 3. Wait & Create Admin
```bash
sleep 15
docker exec agricultural_backend node src/scripts/create-admin.js
```

### 4. Verify
```bash
curl http://localhost:3001/health
curl http://localhost:3002
```

## 🎯 Access URLs

- **Frontend**: http://localhost:3002
- **Backend**: http://localhost:3001
- **Admin Login**: http://localhost:3001/api/admin/auth/login

## 🔐 Admin Credentials

- Email: `admin@agricultural-platform.com`
- Password: `admin123`

---

**Ready?** Copy and paste the one-liner above!
