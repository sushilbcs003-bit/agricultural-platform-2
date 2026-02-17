# Railway Deployment Guide

This guide will help you deploy the Agricultural Platform to Railway.app.

## 🏗️ Architecture Overview

This is a **monorepo** with 3 main services:
- **Frontend** (React) - Port 3000
- **Backend** (Node.js/Express) - Port 3001
- **AI Service** (Python/Flask) - Port 5000

Plus dependencies:
- **PostgreSQL** (managed by Railway)
- **Redis** (managed by Railway)

## 🚀 Deployment Strategy

Railway works best when you deploy services **separately**. This gives you:
- ✅ Independent scaling
- ✅ Better resource management
- ✅ Easier debugging
- ✅ Service-specific monitoring

## 📋 Prerequisites

1. **GitHub Account** - Your code should be on GitHub
2. **Railway Account** - Sign up at https://railway.app (free)
3. **Railway CLI** (optional but recommended):
   ```bash
   npm install -g @railway/cli
   railway login
   ```

## 🎯 Step-by-Step Deployment

### Step 1: Create Railway Project

1. Go to https://railway.app
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose your repository: `agricultural-platform-2`
5. Railway will create a new project

### Step 2: Add PostgreSQL Database

1. In your Railway project, click **"+ New"**
2. Select **"Database"** → **"Add PostgreSQL"**
3. Railway will automatically create and configure PostgreSQL
4. **Copy the `DATABASE_URL`** from the Variables tab (you'll need it later)

### Step 3: Add Redis Cache

1. Click **"+ New"** again
2. Select **"Database"** → **"Add Redis"**
3. Railway will automatically create Redis
4. **Copy the `REDIS_URL`** from the Variables tab

### Step 4: Deploy Backend Service

1. Click **"+ New"** → **"GitHub Repo"**
2. Select your repository again
3. In the service settings:
   - **Name**: `backend`
   - **Root Directory**: `/backend`
   - **Build Command**: (leave empty - Dockerfile handles it)
   - **Start Command**: (leave empty - Dockerfile handles it)
   - **Port**: `3001`

4. **Add Environment Variables** (in Variables tab):
   ```env
   NODE_ENV=production
   PORT=3001
   DATABASE_URL=${{Postgres.DATABASE_URL}}
   REDIS_URL=${{Redis.REDIS_URL}}
   AI_SERVICE_URL=${{AI_SERVICE.PUBLIC_URL}}
   JWT_SECRET=<generate-64-char-random-string>
   JWT_REFRESH_SECRET=<generate-64-char-random-string>
   ENCRYPTION_KEY=<generate-32-char-random-string>
   CORS_ORIGIN=${{Frontend.PUBLIC_URL}}
   ```

   **Note**: Use Railway's variable references (`${{Service.VARIABLE}}`) to reference other services.

5. **Generate Domain**: Settings → Generate Domain (e.g., `backend-production.up.railway.app`)

### Step 5: Deploy AI Service

1. Click **"+ New"** → **"GitHub Repo"**
2. Select your repository
3. In the service settings:
   - **Name**: `ai-service`
   - **Root Directory**: `/ai-service`
   - **Port**: `5000`

4. **Add Environment Variables**:
   ```env
   REDIS_URL=${{Redis.REDIS_URL}}
   MODEL_PATH=/app/models
   FLASK_ENV=production
   ```

5. **Generate Domain**: Settings → Generate Domain

### Step 6: Deploy Frontend Service

1. Click **"+ New"** → **"GitHub Repo"**
2. Select your repository
3. In the service settings:
   - **Name**: `frontend`
   - **Root Directory**: `/frontend`
   - **Port**: `3000`

4. **Add Environment Variables**:
   ```env
   REACT_APP_API_URL=${{Backend.PUBLIC_URL}}
   REACT_APP_OTEL_EXPORTER_OTLP_ENDPOINT=${{Jaeger.PUBLIC_URL}}/v1/traces
   ```

5. **Generate Domain**: Settings → Generate Domain (e.g., `frontend-production.up.railway.app`)

### Step 7: Update Service URLs

After all services are deployed, update environment variables with actual URLs:

1. **Backend** - Update `CORS_ORIGIN`:
   ```env
   CORS_ORIGIN=https://frontend-production.up.railway.app
   ```

2. **Backend** - Update `AI_SERVICE_URL`:
   ```env
   AI_SERVICE_URL=https://ai-service-production.up.railway.app
   ```

3. **Frontend** - Update `REACT_APP_API_URL`:
   ```env
   REACT_APP_API_URL=https://backend-production.up.railway.app
   ```

### Step 8: Run Database Migrations

1. Go to **Backend** service
2. Open **Deployments** tab
3. Click **"..."** → **"Run Command"**
4. Run:
   ```bash
   cd backend && npx prisma migrate deploy
   ```
   Or if Prisma CLI is installed:
   ```bash
   npx prisma migrate deploy
   ```

## 🔐 Generating Secrets

Use this script to generate secure secrets:

```bash
# Generate JWT secrets (64 characters)
openssl rand -base64 48 | tr -d '\n' | cut -c1-64

# Generate encryption key (32 characters)
openssl rand -base64 24 | tr -d '\n' | cut -c1-32

# Or use the provided script
./scripts/generate-secrets.sh
```

## 🌐 Custom Domains (Optional)

1. Go to your service → **Settings** → **Networking**
2. Click **"Custom Domain"**
3. Add your domain (e.g., `api.yourdomain.com`)
4. Railway will provide DNS records to add
5. Update your DNS provider with the records
6. Railway automatically provisions SSL certificates

## 📊 Monitoring & Logs

- **Logs**: Click any service → **Deployments** → View logs
- **Metrics**: Click service → **Metrics** tab
- **Alerts**: Configure in service settings

## 🔄 Auto-Deploy

Railway automatically deploys when you push to your GitHub repo:
- Push to `main` branch → Deploys to production
- Create PR → Creates preview deployment (optional)

## 🛠️ Troubleshooting

### Issue: Build fails
**Solution**: Check build logs in Railway dashboard. Common issues:
- Missing dependencies
- Dockerfile errors
- Build timeout (increase in settings)

### Issue: Services can't connect
**Solution**: 
- Verify service names match exactly
- Check environment variables use correct references: `${{Service.VARIABLE}}`
- Ensure services are deployed and running

### Issue: Database connection fails
**Solution**:
- Verify `DATABASE_URL` is set correctly
- Check PostgreSQL service is running
- Ensure database migrations have run

### Issue: CORS errors
**Solution**:
- Verify `CORS_ORIGIN` matches your frontend URL exactly
- Check `REACT_APP_API_URL` matches your backend URL
- Ensure URLs use `https://` not `http://`

### Issue: Out of memory
**Solution**:
- Railway free tier: 512MB RAM per service
- Upgrade plan or optimize Docker images
- Use multi-stage builds

## 💰 Railway Pricing

- **Free Tier**: $5 credit/month (usually enough for testing)
- **Hobby Plan**: $5/month (more resources)
- **Pro Plan**: $20/month (production-ready)

**Cost-saving tips**:
- Use Railway's managed databases (included)
- Enable auto-sleep for dev environments
- Monitor usage in dashboard

## 📝 Environment Variables Reference

### Backend Required Variables
```env
NODE_ENV=production
PORT=3001
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}
AI_SERVICE_URL=${{AI_SERVICE.PUBLIC_URL}}
JWT_SECRET=<64-char-secret>
JWT_REFRESH_SECRET=<64-char-secret>
ENCRYPTION_KEY=<32-char-secret>
CORS_ORIGIN=${{Frontend.PUBLIC_URL}}
```

### Frontend Required Variables
```env
REACT_APP_API_URL=${{Backend.PUBLIC_URL}}
```

### AI Service Required Variables
```env
REDIS_URL=${{Redis.REDIS_URL}}
MODEL_PATH=/app/models
FLASK_ENV=production
```

## 🎉 Success Checklist

- [ ] All 3 services deployed and running
- [ ] PostgreSQL database connected
- [ ] Redis cache connected
- [ ] Database migrations completed
- [ ] Frontend can reach backend API
- [ ] Backend can reach AI service
- [ ] CORS configured correctly
- [ ] HTTPS/SSL working (automatic)
- [ ] Custom domains configured (optional)
- [ ] Monitoring set up

## 🚀 Quick Deploy Commands (CLI)

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link to project
railway link

# Deploy specific service
cd backend && railway up
cd ../frontend && railway up
cd ../ai-service && railway up

# View logs
railway logs

# Run commands
railway run npx prisma migrate deploy
```

## 📚 Additional Resources

- [Railway Documentation](https://docs.railway.app)
- [Railway Discord](https://discord.gg/railway)
- [Railway Status](https://status.railway.app)

---

**Need help?** Check Railway's [support docs](https://docs.railway.app) or join their [Discord community](https://discord.gg/railway).
