# Railway Quick Reference

Quick commands and settings for Railway deployment.

## 🚀 Service Configuration

### Backend Service
- **Root Directory**: `/backend`
- **Port**: `3001`
- **Build**: Dockerfile
- **Start**: `npm start` (via Dockerfile CMD)

### Frontend Service
- **Root Directory**: `/frontend`
- **Port**: `3000`
- **Build**: Dockerfile
- **Start**: `serve -s build -l 3000` (via Dockerfile CMD)

### AI Service
- **Root Directory**: `/ai-service`
- **Port**: `5000`
- **Build**: Dockerfile
- **Start**: `gunicorn --bind 0.0.0.0:5000` (via Dockerfile CMD)

## 🔗 Service URL References

In Railway, reference other services using:
```env
${{ServiceName.VARIABLE}}
```

Examples:
- `${{Postgres.DATABASE_URL}}` - PostgreSQL connection string
- `${{Redis.REDIS_URL}}` - Redis connection string
- `${{Backend.PUBLIC_URL}}` - Backend public URL
- `${{Frontend.PUBLIC_URL}}` - Frontend public URL
- `${{AI_SERVICE.PUBLIC_URL}}` - AI service public URL

## 📝 Environment Variables Template

### Backend
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

### Frontend
```env
REACT_APP_API_URL=${{Backend.PUBLIC_URL}}
```

### AI Service
```env
REDIS_URL=${{Redis.REDIS_URL}}
MODEL_PATH=/app/models
FLASK_ENV=production
```

## 🔧 Railway CLI Commands

```bash
# Install CLI
npm install -g @railway/cli

# Login
railway login

# Link to project
railway link

# Deploy
railway up

# View logs
railway logs

# Run command
railway run <command>

# Open dashboard
railway open
```

## 🎯 Deployment Order

1. **PostgreSQL** (Railway managed)
2. **Redis** (Railway managed)
3. **Backend** (depends on Postgres + Redis)
4. **AI Service** (depends on Redis)
5. **Frontend** (depends on Backend)

## 🔍 Health Check Endpoints

- Backend: `https://your-backend.railway.app/health`
- AI Service: `https://your-ai-service.railway.app/health`
- Frontend: `https://your-frontend.railway.app` (should return HTML)

## 🐛 Common Issues & Fixes

### Build Timeout
**Fix**: Increase build timeout in service settings (default: 10min)

### Port Already in Use
**Fix**: Ensure PORT env var matches Railway's assigned port

### Database Connection Failed
**Fix**: Verify `DATABASE_URL` uses `${{Postgres.DATABASE_URL}}`

### CORS Errors
**Fix**: Ensure `CORS_ORIGIN` matches frontend URL exactly (including `https://`)

### Service Not Found
**Fix**: Verify service names match exactly (case-sensitive)

## 📊 Resource Limits (Free Tier)

- **RAM**: 512MB per service
- **CPU**: Shared
- **Storage**: 1GB
- **Monthly Credit**: $5

## 🔄 Auto-Deploy Settings

Railway auto-deploys on:
- Push to `main` branch → Production
- Push to other branches → Preview (optional)

Disable in: Service Settings → Source → Auto Deploy

## 🌐 Custom Domains

1. Service → Settings → Networking
2. Add Custom Domain
3. Copy DNS records
4. Add to DNS provider
5. Wait for SSL provisioning (~5 min)

## 💡 Pro Tips

1. Use Railway's variable references instead of hardcoding URLs
2. Enable "Watch" mode for faster deployments
3. Use Railway's built-in PostgreSQL/Redis (easier than self-hosting)
4. Set up monitoring alerts for production
5. Use preview deployments for testing PRs
