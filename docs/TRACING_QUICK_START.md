# 🔍 OpenTelemetry + Jaeger Quick Start

## ✅ Configuration Complete

Jaeger and OpenTelemetry have been configured for distributed tracing.

## 🚀 Deploy Now

### Option 1: Use Deployment Script

```bash
cd /Users/bravo/working_code/jan-26/agricultural-platform
./DEPLOY_WITH_TRACING.sh
```

### Option 2: Manual Steps

```bash
# 1. Install dependencies
cd backend && npm install && cd ..
cd frontend && npm install && cd ..

# 2. Start Jaeger
docker compose up -d jaeger

# 3. Rebuild and start services
docker compose build
docker compose up -d
```

## 📊 Access Jaeger UI

**URL**: http://localhost:16686

### View Traces

1. Open http://localhost:16686
2. Select service:
   - `agricultural-frontend` - Frontend traces
   - `agricultural-backend` - Backend traces
3. Click "Find Traces"
4. Click on a trace to see the complete flow

## 🔍 What You'll See

### Trace Flow Example:
```
Frontend: User clicks "Login"
  └─> Frontend: API call to /api/auth/login
      └─> Backend: POST /api/auth/login
          └─> Backend: AuthService.login()
              └─> Database: SELECT user WHERE email = ...
              └─> Database: UPDATE user SET last_login = ...
          └─> Backend: Response 200 OK
      └─> Frontend: Handle response
```

### Trace Details Include:
- **HTTP Method & URL**
- **Request/Response Headers**
- **Database Queries** (Prisma)
- **Query Execution Time**
- **Errors & Exceptions**
- **Service Names**
- **Timestamps**

## 🧪 Test Tracing

1. **Open Frontend**: http://localhost:3002
2. **Perform Actions**:
   - Register a user
   - Login
   - Browse products
   - Make API calls
3. **View in Jaeger**:
   - Open http://localhost:16686
   - Select service
   - See all traces

## 📋 Service Ports

| Service | Port | URL |
|---------|------|-----|
| Jaeger UI | 16686 | http://localhost:16686 |
| OTLP HTTP | 4318 | http://localhost:4318 |
| OTLP gRPC | 4317 | http://localhost:4317 |
| Jaeger HTTP | 14268 | http://localhost:14268 |

## ✅ Verification

### Check Services
```bash
docker compose ps
```

### Check Jaeger
```bash
curl http://localhost:16686
```

### Check Backend
```bash
curl http://localhost:3001/health
```

---

**Status**: ✅ Configured  
**Jaeger UI**: http://localhost:16686  
**Ready**: ✅ Yes - Deploy Now!
