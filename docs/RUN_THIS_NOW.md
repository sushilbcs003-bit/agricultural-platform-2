# 🚀 Run Deployment Now

Since Docker is running on your machine, please **execute these commands in your terminal**:

## Quick Deploy (Copy & Paste)

```bash
cd /Users/bravo/working_code/jan-26/agricultural-platform
chmod +x EXECUTE_DEPLOYMENT.sh
./EXECUTE_DEPLOYMENT.sh
```

## Or Run Commands Manually

### Step 1: Start PostgreSQL
```bash
cd /Users/bravo/working_code/jan-26/agricultural-platform
docker compose up -d postgres
sleep 10
```

### Step 2: Clear All Tables
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

### Step 3: Apply New Schema
```bash
docker exec -i agricultural_postgres psql -U postgres -d agricultural_platform < database/schema-3nf.sql
```

### Step 4: Generate Prisma Client
```bash
cd backend
npx prisma generate
```

### Step 5: Start Services

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

## 🎯 Expected Results

After deployment:
- ✅ 30+ tables in database
- ✅ Backend running on http://localhost:3001
- ✅ Frontend running on http://localhost:3000
- ✅ All API endpoints available

---

**Ready?** Copy and paste the commands above in your terminal!
