# Railway Deployment Fix

## Problem
Railway was looking for a root `Dockerfile` but couldn't find it because this is a multi-service application.

## Solution
I've created a root `Dockerfile` that uses Docker-in-Docker to run docker-compose.

## ⚠️ IMPORTANT: Better Approach for Railway

Railway works best when you deploy services **separately**. Here's the recommended approach:

### Option 1: Deploy Services Separately (RECOMMENDED)

1. **Create 3 separate services in Railway:**

   **Backend Service:**
   - Source: Your GitHub repo
   - Root Directory: `backend`
   - Build Command: (auto-detected)
   - Start Command: `npm start`
   - Port: 3001

   **Frontend Service:**
   - Source: Your GitHub repo  
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Start Command: `serve -s build -l 3000`
   - Port: 3000

   **AI Service:**
   - Source: Your GitHub repo
   - Root Directory: `ai-service`
   - Build Command: (auto-detected)
   - Start Command: `gunicorn --bind 0.0.0.0:5000 --workers 2 app:app`
   - Port: 5000

2. **Add Managed Services:**
   - PostgreSQL (Railway managed)
   - Redis (Railway managed)

3. **Connect Services:**
   - Railway automatically connects services in the same project
   - Use service names: `postgres`, `redis`, `backend`, `frontend`, `ai-service`

### Option 2: Use Root Dockerfile (Current Fix)

The root `Dockerfile` I created will work, but it's less efficient because:
- Uses Docker-in-Docker (heavier)
- All services run in one container
- Harder to scale individually

## Quick Fix Applied

✅ Created root `Dockerfile`  
✅ Updated `railway.json`  
✅ Ready to deploy

## Next Steps

1. **Push the changes:**
   ```bash
   git add Dockerfile railway.json
   git commit -m "Add root Dockerfile for Railway deployment"
   git push origin main
   ```

2. **In Railway Dashboard:**
   - Go to your service
   - Click "Redeploy" or wait for auto-deploy
   - The build should now succeed

3. **If it still fails, use Option 1** (separate services) - it's Railway's recommended approach for multi-service apps.

## Environment Variables Needed

Make sure you have these in Railway:

```env
NODE_ENV=production
DATABASE_URL=<from-postgres-service>
REDIS_URL=<from-redis-service>
JWT_SECRET=<your-secret>
JWT_REFRESH_SECRET=<your-secret>
ENCRYPTION_KEY=<your-secret>
FRONTEND_URL=https://your-frontend.railway.app
BACKEND_URL=https://your-backend.railway.app
CORS_ORIGIN=https://your-frontend.railway.app
```
