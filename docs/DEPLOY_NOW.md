# 🚀 Deploy Now - Step by Step

## ⚠️ Important: Docker Desktop Must Be Running First!

### Step 1: Start Docker Desktop
1. **Open Docker Desktop** application on your Mac
2. **Wait** until the Docker icon in the menu bar shows "Docker Desktop is running"
3. This may take 30-60 seconds

### Step 2: Run Deployment Script

Open Terminal and run:

```bash
cd /Users/bravo/working_code/jan-26/agricultural-platform
chmod +x RUN_DEPLOYMENT.sh
./RUN_DEPLOYMENT.sh
```

This script will:
- ✅ Start PostgreSQL container
- ✅ Clear all old tables
- ✅ Apply new 3NF+ schema
- ✅ Generate Prisma client
- ✅ Verify deployment

### Step 3: Start Services

After the deployment script completes, start the services:

**Terminal 1 - Backend:**
```bash
cd /Users/bravo/working_code/jan-26/agricultural-platform/backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd /Users/bravo/working_code/jan-26/agricultural-platform/frontend
npm start
```

## 🎯 Quick One-Liner (After Docker Starts)

```bash
cd /Users/bravo/working_code/jan-26/agricultural-platform && \
chmod +x RUN_DEPLOYMENT.sh && \
./RUN_DEPLOYMENT.sh && \
echo "✅ Deployment complete! Now start services in separate terminals"
```

## 📋 Manual Commands (If Script Fails)

### 1. Start PostgreSQL
```bash
cd /Users/bravo/working_code/jan-26/agricultural-platform
docker compose up -d postgres
sleep 10
```

### 2. Clear Tables
```bash
docker exec -i agricultural_postgres psql -U postgres -d agricultural_platform <<'EOF'
DO $$ 
DECLARE r RECORD;
BEGIN
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') 
    LOOP EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE'; END LOOP;
    FOR r IN (SELECT typname FROM pg_type WHERE typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public') AND typtype = 'e')
    LOOP EXECUTE 'DROP TYPE IF EXISTS ' || quote_ident(r.typname) || ' CASCADE'; END LOOP;
END $$;
EOF
```

### 3. Apply Schema
```bash
docker exec -i agricultural_postgres psql -U postgres -d agricultural_platform < database/schema-3nf.sql
```

### 4. Generate Prisma Client
```bash
cd backend
npx prisma generate
```

### 5. Start Services
```bash
# Terminal 1
cd backend && npm run dev

# Terminal 2
cd frontend && npm start
```

## ✅ Verify Deployment

### Check Database
```bash
docker exec -it agricultural_postgres psql -U postgres -d agricultural_platform -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';"
```

### Check Backend
```bash
curl http://localhost:3001/health
```

### Check Frontend
Open browser: http://localhost:3000

## 🐛 Troubleshooting

### "Docker is not running"
- **Solution**: Start Docker Desktop application
- Wait for it to fully start (whale icon in menu bar)

### "Cannot connect to Docker daemon"
- **Solution**: Make sure Docker Desktop is fully started
- Try: `docker ps` to verify connection

### "Port already in use"
- **Solution**: Stop existing services
```bash
# Find process using port 3001
lsof -i :3001
# Kill it
kill -9 <PID>
```

### "Prisma generate fails"
- **Solution**: Make sure you're in the backend directory
```bash
cd backend
npx prisma generate
```

## 📊 Expected Results

After successful deployment:
- ✅ 30+ tables in database
- ✅ Backend running on http://localhost:3001
- ✅ Frontend running on http://localhost:3000
- ✅ All API endpoints available

---

**Ready to deploy?** Start Docker Desktop, then run `./RUN_DEPLOYMENT.sh`
