# Railway.app Quick Start Guide

**Fastest way to deploy your Agricultural Platform to the internet!**

## 🚀 Step-by-Step Deployment

### Prerequisites
- GitHub account
- Railway account (free signup at https://railway.app)

### Step 1: Generate Secrets

```bash
# Run the secret generator script
./scripts/generate-secrets.sh

# Copy the generated secrets - you'll need them!
```

### Step 2: Push to GitHub

```bash
# Make sure your code is pushed to GitHub
git add .
git commit -m "Prepare for Railway deployment"
git push origin main
```

### Step 3: Deploy on Railway

1. **Go to Railway:** https://railway.app
2. **Sign up/Login** with GitHub
3. **New Project** → **Deploy from GitHub repo**
4. **Select your repository**

### Step 4: Add Services

Railway will detect your `docker-compose.yml`. You need to:

1. **Add PostgreSQL Database:**
   - Click **"+ New"** → **Database** → **Add PostgreSQL**
   - Railway will provide `DATABASE_URL` automatically

2. **Add Redis:**
   - Click **"+ New"** → **Database** → **Add Redis**
   - Railway will provide `REDIS_URL` automatically

3. **Add Web Service (Your App):**
   - Railway should auto-detect your Docker setup
   - If not, click **"+ New"** → **GitHub Repo** → Select your repo

### Step 5: Configure Environment Variables

Go to your **Web Service** → **Variables** tab and add:

```env
# Environment
NODE_ENV=production

# Database (from Railway PostgreSQL service)
DATABASE_URL=<auto-filled-from-postgres-service>

# Redis (from Railway Redis service)
REDIS_URL=<auto-filled-from-redis-service>

# Security Secrets (from generate-secrets.sh)
JWT_SECRET=<paste-from-script-output>
JWT_REFRESH_SECRET=<paste-from-script-output>
ENCRYPTION_KEY=<paste-from-script-output>

# URLs (update after deployment)
FRONTEND_URL=https://your-app.railway.app
BACKEND_URL=https://your-api.railway.app

# Backend Configuration
PORT=3001
CORS_ORIGIN=https://your-app.railway.app

# AI Service
AI_SERVICE_URL=http://ai-service:5000

# Production Settings
OTP_BYPASS=false
```

### Step 6: Configure Service Settings

1. **Set Root Directory** (if needed):
   - Settings → Root Directory: `/` (or leave blank)

2. **Set Start Command:**
   - Settings → Start Command: `docker compose -f docker-compose.prod.yml up`

3. **Set Port:**
   - Settings → Port: `3000` (for frontend) or `3001` (for backend)

### Step 7: Deploy!

1. Railway will automatically build and deploy
2. Watch the **Deploy Logs** for progress
3. Wait for "Deployment successful"

### Step 8: Get Your URLs

1. Go to your **Web Service**
2. Click **Settings** → **Generate Domain**
3. Copy your public URL (e.g., `https://your-app.railway.app`)

### Step 9: Update Frontend URL

1. Go back to **Variables**
2. Update `FRONTEND_URL` and `BACKEND_URL` with your actual Railway URLs
3. Update `CORS_ORIGIN` to match your frontend URL
4. Redeploy (Railway auto-redeploys on variable changes)

### Step 10: Test!

```bash
# Test backend health
curl https://your-api.railway.app/api/health

# Test frontend
curl https://your-app.railway.app

# Open in browser
open https://your-app.railway.app
```

## 🔧 Troubleshooting

### Issue: Build fails
**Solution:** Check build logs in Railway dashboard

### Issue: Services can't connect
**Solution:** 
- Verify `DATABASE_URL` and `REDIS_URL` are set correctly
- Check service names match in docker-compose.prod.yml

### Issue: CORS errors
**Solution:** 
- Update `CORS_ORIGIN` to match your exact frontend URL
- Ensure `REACT_APP_API_URL` matches your backend URL

### Issue: Out of memory
**Solution:**
- Railway free tier has limits
- Consider upgrading or optimizing Docker images

## 💡 Pro Tips

1. **Use Railway's managed databases** - They're free and easier than self-hosting
2. **Set up custom domain** - Railway provides free SSL certificates
3. **Monitor usage** - Check Railway dashboard for resource usage
4. **Enable auto-deploy** - Railway auto-deploys on git push
5. **Use Railway CLI** - For advanced deployments:
   ```bash
   npm i -g @railway/cli
   railway login
   railway up
   ```

## 📊 Railway Free Tier Limits

- **$5 credit/month** (usually enough for testing)
- **500 hours** of runtime
- **512MB RAM** per service
- **Managed databases** included

## 🎉 You're Done!

Your Agricultural Platform is now live on the internet! 🚀

**Next Steps:**
- Share your URL with testers
- Monitor logs in Railway dashboard
- Set up custom domain (optional)
- Configure monitoring and alerts
