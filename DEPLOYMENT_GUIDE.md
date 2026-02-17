# Secure Internet Deployment Guide - Agricultural Platform v2

**Last Updated:** February 17, 2026  
**Target:** Deploy securely to the internet for testing from anywhere

## 🎯 Best Free Deployment Options (Ranked)

### 🥇 Option 1: Railway.app (RECOMMENDED)
**Why:** Best Docker Compose support, easiest setup, $5/month free credit

**Pros:**
- ✅ Native Docker Compose support
- ✅ Free $5/month credit (enough for testing)
- ✅ Automatic HTTPS/SSL
- ✅ Built-in PostgreSQL & Redis
- ✅ Environment variable management
- ✅ Simple deployment via GitHub
- ✅ Free custom domains

**Cons:**
- ⚠️ Limited free tier (but sufficient for testing)
- ⚠️ Sleeps after inactivity (free tier)

**Cost:** Free ($5 credit/month) → $5-20/month for production

---

### 🥈 Option 2: Fly.io
**Why:** Excellent Docker support, generous free tier, global edge network

**Pros:**
- ✅ Generous free tier (3 shared VMs)
- ✅ Global edge network (low latency)
- ✅ Automatic HTTPS
- ✅ Built-in PostgreSQL & Redis
- ✅ Great Docker support
- ✅ Free custom domains

**Cons:**
- ⚠️ Requires Fly CLI setup
- ⚠️ Slightly more complex than Railway

**Cost:** Free tier → $5-15/month for production

---

### 🥉 Option 3: Render
**Why:** Good Docker support, free tier available, simple UI

**Pros:**
- ✅ Free tier available
- ✅ Simple web UI
- ✅ Automatic HTTPS
- ✅ Built-in PostgreSQL & Redis
- ✅ GitHub integration

**Cons:**
- ⚠️ Free tier sleeps after inactivity
- ⚠️ Limited resources on free tier

**Cost:** Free tier → $7-25/month for production

---

### Option 4: DigitalOcean App Platform
**Why:** Reliable, good Docker support, $200 free credit

**Pros:**
- ✅ $200 free credit (60 days)
- ✅ Excellent documentation
- ✅ Built-in databases
- ✅ Automatic HTTPS

**Cons:**
- ⚠️ No permanent free tier
- ⚠️ More expensive after credit

**Cost:** Free trial ($200 credit) → $12-30/month

---

### Option 5: Google Cloud Run
**Why:** Pay-per-use, generous free tier, enterprise-grade

**Pros:**
- ✅ Generous free tier
- ✅ Pay only for usage
- ✅ Automatic HTTPS
- ✅ Global CDN

**Cons:**
- ⚠️ More complex setup
- ⚠️ Requires GCP account

**Cost:** Free tier → Pay-per-use (~$5-20/month)

---

## 🔒 Security Checklist Before Deployment

### Critical Security Steps

1. **✅ Change All Default Passwords**
   ```bash
   # Generate secure passwords
   openssl rand -base64 32  # For database
   openssl rand -base64 64  # For JWT secrets
   ```

2. **✅ Set Strong JWT Secrets**
   ```env
   JWT_SECRET=<generate-64-char-random-string>
   JWT_REFRESH_SECRET=<generate-64-char-random-string>
   ```

3. **✅ Set Encryption Key**
   ```env
   ENCRYPTION_KEY=<generate-32-char-random-string>
   ```

4. **✅ Update Database Credentials**
   ```env
   POSTGRES_PASSWORD=<strong-password>
   POSTGRES_USER=agricultural_user  # Don't use 'postgres'
   ```

5. **✅ Set Production Environment**
   ```env
   NODE_ENV=production
   OTP_BYPASS=false  # Enable OTP in production
   ```

6. **✅ Configure CORS Properly**
   ```env
   CORS_ORIGIN=https://your-domain.com
   REACT_APP_API_URL=https://api.your-domain.com
   ```

7. **✅ Remove Development Features**
   - Disable mock services (SMS, Email, Payment)
   - Enable rate limiting
   - Remove debug endpoints

---

## 🚀 Deployment: Railway.app (Recommended)

### Step 1: Prepare Repository

1. **Create `.railwayignore`** (similar to .gitignore)
   ```bash
   node_modules/
   .git/
   .env
   *.log
   ```

2. **Create `railway.json`** (optional, for custom config)
   ```json
   {
     "build": {
       "builder": "DOCKERFILE",
       "dockerfilePath": "Dockerfile"
     },
     "deploy": {
       "startCommand": "docker compose up",
       "restartPolicyType": "ON_FAILURE",
       "restartPolicyMaxRetries": 10
     }
   }
   ```

### Step 2: Create Production Docker Compose

Create `docker-compose.prod.yml`:

```yaml
name: agricultural-platform-prod

services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    environment:
      - NODE_ENV=production
      - PORT=3001
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
      - AI_SERVICE_URL=http://ai-service:5000
      - JWT_SECRET=${JWT_SECRET}
      - JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
      - ENCRYPTION_KEY=${ENCRYPTION_KEY}
      - CORS_ORIGIN=${FRONTEND_URL}
    ports:
      - "3001:3001"
    depends_on:
      - postgres
      - redis

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    environment:
      - REACT_APP_API_URL=${BACKEND_URL}
    ports:
      - "3000:3000"

  ai-service:
    build:
      context: ./ai-service
      dockerfile: Dockerfile
    environment:
      - REDIS_URL=${REDIS_URL}
      - FLASK_ENV=production
    ports:
      - "5000:5000"
    depends_on:
      - redis

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=${POSTGRES_DB}
      - POSTGRES_USER=${POSTGRES_USER}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

### Step 3: Deploy to Railway

1. **Sign up:** https://railway.app
2. **New Project** → Deploy from GitHub
3. **Select your repository**
4. **Add Services:**
   - Add PostgreSQL (Railway managed)
   - Add Redis (Railway managed)
   - Add Web Service (your Docker Compose)

5. **Set Environment Variables:**
   ```env
   NODE_ENV=production
   POSTGRES_DB=agricultural_platform
   POSTGRES_USER=railway
   POSTGRES_PASSWORD=<from-railway-postgres-service>
   DATABASE_URL=<from-railway-postgres-service>
   REDIS_URL=<from-railway-redis-service>
   JWT_SECRET=<generate-secure-random>
   JWT_REFRESH_SECRET=<generate-secure-random>
   ENCRYPTION_KEY=<generate-secure-random>
   FRONTEND_URL=https://your-app.railway.app
   BACKEND_URL=https://your-api.railway.app
   ```

6. **Deploy!** Railway will automatically:
   - Build Docker images
   - Deploy services
   - Provide HTTPS URLs
   - Set up networking

---

## 🚀 Deployment: Fly.io (Alternative)

### Step 1: Install Fly CLI
```bash
curl -L https://fly.io/install.sh | sh
fly auth login
```

### Step 2: Create `fly.toml`
```toml
app = "agricultural-platform"
primary_region = "iad"

[build]
  dockerfile = "Dockerfile"

[http_service]
  internal_port = 3000
  force_https = true
  auto_stop_machines = true
  auto_start_machines = true
  min_machines_running = 0
  processes = ["app"]

[[services]]
  protocol = "tcp"
  internal_port = 3000
  processes = ["app"]

  [[services.ports]]
    port = 80
    handlers = ["http"]
    force_https = true

  [[services.ports]]
    port = 443
    handlers = ["tls", "http"]
```

### Step 3: Deploy
```bash
fly launch
fly secrets set JWT_SECRET=<your-secret>
fly secrets set DATABASE_URL=<your-db-url>
fly deploy
```

---

## 🔐 Security Hardening for Production

### 1. Environment Variables Security

**Never commit secrets!** Use platform secrets management:

**Railway:**
- Go to Project → Variables
- Add all sensitive variables
- Mark as "Secret" (hidden in UI)

**Fly.io:**
```bash
fly secrets set JWT_SECRET=<secret>
fly secrets set DATABASE_URL=<url>
```

### 2. Database Security

```yaml
# In docker-compose.prod.yml
postgres:
  environment:
    POSTGRES_HOST_AUTH_METHOD=scram-sha-256  # Not 'trust'
    POSTGRES_PASSWORD_FILE=/run/secrets/postgres_password
  secrets:
    - postgres_password
```

### 3. Network Security

- ✅ Use internal Docker networks (already configured)
- ✅ Don't expose database/redis ports publicly
- ✅ Use platform-managed databases when possible
- ✅ Enable firewall rules

### 4. HTTPS/SSL

All recommended platforms provide automatic HTTPS:
- Railway: ✅ Automatic
- Fly.io: ✅ Automatic
- Render: ✅ Automatic
- DigitalOcean: ✅ Automatic

### 5. Rate Limiting

Ensure production settings:
```env
RATE_LIMIT_WINDOW=900000  # 15 minutes
RATE_LIMIT_MAX=100
AUTH_RATE_LIMIT_MAX=5
```

### 6. CORS Configuration

```env
# Frontend URL only
CORS_ORIGIN=https://your-frontend-domain.com

# No wildcards in production!
# CORS_ORIGIN=*  ❌ NEVER DO THIS
```

---

## 📋 Pre-Deployment Checklist

- [ ] All secrets generated and stored securely
- [ ] Database credentials changed from defaults
- [ ] JWT secrets set (64+ characters)
- [ ] Encryption key set (32 characters)
- [ ] `NODE_ENV=production`
- [ ] `OTP_BYPASS=false` (enable OTP)
- [ ] CORS configured for your domain only
- [ ] Rate limiting enabled
- [ ] Mock services disabled
- [ ] Health checks configured
- [ ] Logging configured
- [ ] Database migrations ready
- [ ] Backup strategy planned

---

## 🧪 Testing After Deployment

### 1. Health Checks
```bash
# Backend
curl https://your-api.railway.app/api/health

# AI Service
curl https://your-api.railway.app:5000/health

# Frontend
curl https://your-app.railway.app
```

### 2. Security Tests
```bash
# Test HTTPS redirect
curl -I http://your-app.railway.app  # Should redirect to HTTPS

# Test CORS
curl -H "Origin: https://evil.com" \
     https://your-api.railway.app/api/health
# Should reject or not include Access-Control-Allow-Origin
```

### 3. Database Connection
```bash
# Test database connectivity
curl https://your-api.railway.app/api/health
# Should return database status
```

---

## 💰 Cost Comparison (Monthly)

| Platform | Free Tier | Production Cost |
|----------|-----------|-----------------|
| **Railway** | $5 credit | $5-20 |
| **Fly.io** | 3 VMs | $5-15 |
| **Render** | Free (sleeps) | $7-25 |
| **DigitalOcean** | $200 credit | $12-30 |
| **Google Cloud Run** | Generous | $5-20 |

**Recommendation:** Start with Railway.app for easiest setup, then migrate to Fly.io if you need more resources.

---

## 🆘 Troubleshooting

### Issue: Services won't start
**Solution:** Check logs
```bash
railway logs
# or
fly logs
```

### Issue: Database connection fails
**Solution:** Verify DATABASE_URL format
```
postgresql://user:password@host:port/database
```

### Issue: CORS errors
**Solution:** Update CORS_ORIGIN to match your frontend URL exactly

### Issue: Out of memory
**Solution:** 
- Railway: Upgrade plan
- Fly.io: Increase VM size
- Optimize Docker images (multi-stage builds)

---

## 📚 Additional Resources

- [Railway Docs](https://docs.railway.app)
- [Fly.io Docs](https://fly.io/docs)
- [Render Docs](https://render.com/docs)
- [Docker Security Best Practices](https://docs.docker.com/engine/security/)

---

## 🎯 Quick Start Commands

### Railway
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Initialize
railway init

# Deploy
railway up
```

### Fly.io
```bash
# Install Fly CLI
curl -L https://fly.io/install.sh | sh

# Login
fly auth login

# Launch
fly launch

# Deploy
fly deploy
```

---

**Ready to deploy?** Start with Railway.app for the easiest experience! 🚀
