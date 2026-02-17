# 🔍 Jaeger + OpenTelemetry Setup Guide

## ✅ Configuration Complete

Jaeger and OpenTelemetry have been configured for distributed tracing across Frontend → Backend → Database.

## 📊 What's Configured

### 1. Jaeger Service (Docker)
- **UI**: http://localhost:16686
- **OTLP HTTP**: http://localhost:4318
- **OTLP gRPC**: http://localhost:4317
- **Jaeger HTTP**: http://localhost:14268

### 2. Backend Tracing
- ✅ OpenTelemetry SDK initialized
- ✅ Express request tracing middleware
- ✅ Prisma database query tracing
- ✅ Automatic instrumentation for HTTP, Express, etc.

### 3. Frontend Tracing
- ✅ OpenTelemetry Web SDK initialized
- ✅ Fetch/XMLHttpRequest instrumentation
- ✅ User interaction tracing
- ✅ Document load tracing

## 🚀 Deploy with Tracing

### Step 1: Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd frontend
npm install
```

### Step 2: Start Services

```bash
# Start all services including Jaeger
docker compose up -d

# Or rebuild and start
docker compose build
docker compose up -d
```

### Step 3: Access Jaeger UI

Open browser: **http://localhost:16686**

## 📋 Service URLs

| Service | URL | Description |
|---------|-----|-------------|
| **Jaeger UI** | http://localhost:16686 | View traces and spans |
| **Frontend** | http://localhost:3002 | Application |
| **Backend** | http://localhost:3001 | API |
| **OTLP HTTP** | http://localhost:4318 | OTLP endpoint |

## 🔍 What You'll See in Jaeger

### Traces Include:
1. **Frontend Spans**:
   - User interactions (clicks, form submissions)
   - API calls (fetch/axios requests)
   - Document load events

2. **Backend Spans**:
   - HTTP requests (method, path, status)
   - Route handlers
   - Service calls
   - Database queries (Prisma)

3. **Database Spans**:
   - Query execution time
   - Query parameters
   - Connection details

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

## 🧪 Test Tracing

### 1. Make API Calls
- Register a user
- Login
- Browse products
- Place a bid

### 2. View in Jaeger
1. Open http://localhost:16686
2. Select service: `agricultural-frontend` or `agricultural-backend`
3. Click "Find Traces"
4. Click on a trace to see the full span tree

### 3. Filter Traces
- **Service**: Select frontend or backend
- **Operation**: Filter by endpoint (e.g., `/api/auth/login`)
- **Tags**: Filter by HTTP status, error, etc.
- **Time Range**: Select time window

## 📊 Trace Attributes

### Frontend Traces
- `http.method`: GET, POST, etc.
- `http.url`: Full request URL
- `http.status_code`: Response status
- `user.action`: User interaction type

### Backend Traces
- `http.method`: HTTP method
- `http.route`: Route path
- `http.status_code`: Response status
- `db.system`: Database type (postgresql)
- `db.operation`: Query type (SELECT, INSERT, etc.)
- `db.statement`: SQL query

## 🛠️ Advanced Usage

### Add Custom Spans in Backend

```javascript
const { tracer, createSpan } = require('./src/tracing');

// Create a custom span
const result = await createSpan('custom-operation', async (span) => {
  span.setAttribute('operation.type', 'data-processing');
  // Your code here
  return data;
});
```

### Add Custom Spans in Frontend

```javascript
import { tracer, createSpan } from './tracing';

// Create a custom span
const result = await createSpan('custom-operation', async (span) => {
  span.setAttribute('operation.type', 'data-processing');
  // Your code here
  return data;
});
```

## 🔧 Troubleshooting

### No Traces Appearing

1. **Check Jaeger is Running**:
   ```bash
   docker compose ps jaeger
   ```

2. **Check Backend Logs**:
   ```bash
   docker compose logs backend | grep -i "opentelemetry\|tracing"
   ```

3. **Check Frontend Console**:
   - Open browser DevTools
   - Look for "OpenTelemetry tracing initialized"

4. **Verify Endpoints**:
   - Backend: `OTEL_EXPORTER_JAEGER_ENDPOINT=http://jaeger:14268/api/traces`
   - Frontend: `REACT_APP_OTEL_EXPORTER_OTLP_ENDPOINT=http://jaeger:4318/v1/traces`

### Traces Not Linking

- Ensure CORS is configured correctly
- Check that trace headers are being propagated
- Verify both services are using the same Jaeger instance

## 📝 Environment Variables

### Backend
```env
OTEL_SERVICE_NAME=agricultural-backend
OTEL_EXPORTER_JAEGER_ENDPOINT=http://jaeger:14268/api/traces
OTEL_EXPORTER_OTLP_ENDPOINT=http://jaeger:4318/v1/traces
```

### Frontend
```env
REACT_APP_OTEL_EXPORTER_OTLP_ENDPOINT=http://jaeger:4318/v1/traces
```

## ✅ Verification

### Check Services
```bash
# All services running
docker compose ps

# Jaeger UI accessible
curl http://localhost:16686

# Backend health
curl http://localhost:3001/health
```

### View Traces
1. Open http://localhost:16686
2. Select service
3. Click "Find Traces"
4. You should see traces from your API calls

---

**Status**: ✅ Configured  
**Jaeger UI**: http://localhost:16686  
**Ready**: ✅ Yes
