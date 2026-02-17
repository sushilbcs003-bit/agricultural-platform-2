# Quick Deploy Commands

## 🚀 One-Command Deploy (After Docker is Running)

```bash
cd /Users/bravo/working_code/jan-26/agricultural-platform && ./deploy.sh
```

## 📝 Manual Steps

### 1. Start Docker & Database
```bash
# Start Docker Desktop first, then:
docker compose up -d postgres
sleep 10
```

### 2. Clear & Apply Schema
```bash
# Clear all tables
docker exec -i agricultural_postgres psql -U postgres -d agricultural_platform <<EOF
DO \$\$ 
DECLARE r RECORD;
BEGIN
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') 
    LOOP EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE'; END LOOP;
    FOR r IN (SELECT typname FROM pg_type WHERE typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public') AND typtype = 'e')
    LOOP EXECUTE 'DROP TYPE IF EXISTS ' || quote_ident(r.typname) || ' CASCADE'; END LOOP;
END \$\$;
EOF

# Apply new schema
docker exec -i agricultural_postgres psql -U postgres -d agricultural_platform < database/schema-3nf.sql
```

### 3. Update Prisma
```bash
cd backend
cp prisma/schema-3nf.prisma prisma/schema.prisma
npx prisma generate
```

### 4. Start Services
```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend  
cd frontend && npm start
```

## ✅ Verify
- Backend: http://localhost:3001/health
- Frontend: http://localhost:3000
