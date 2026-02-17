# Deployment Steps

## Quick Deploy

Run the deployment script:
```bash
./deploy.sh
```

## Manual Deployment Steps

### 1. Start Database Services
```bash
docker compose up -d postgres redis
```

Wait 10-15 seconds for services to start.

### 2. Run Database Migrations

The schema has been updated to include the `tehsil` field. You need to run migrations:

**Option A: Using Prisma Migrate (Recommended)**
```bash
cd backend
npm install  # If dependencies not installed
npx prisma generate
npx prisma migrate dev --name add_tehsil_field
```

**Option B: Using Prisma DB Push (Faster, for development)**
```bash
cd backend
npx prisma generate
npx prisma db push
```

This will add the `tehsil` column to:
- `farmer_profiles` table
- `buyer_profiles` table  
- `provider_profiles` table

### 3. Start All Services
```bash
cd ..
docker compose up -d --build
```

### 4. Verify Deployment

Check service status:
```bash
docker compose ps
```

Check backend health:
```bash
curl http://localhost:3001/health
```

View logs:
```bash
docker compose logs -f
```

## What Changed

✅ Added `tehsil` field to all registration forms:
- Farmer Registration: Village → **Tehsil** → District → State
- Buyer Registration: Village → **Tehsil** → District → State
- Supplier Registration: Village → **Tehsil** → District → State

✅ Updated database schema (Prisma)
✅ Updated backend API endpoints
✅ Updated frontend forms

## Troubleshooting

### Migration fails
If migration fails, you can manually add the column:
```sql
ALTER TABLE farmer_profiles ADD COLUMN tehsil VARCHAR(100);
ALTER TABLE buyer_profiles ADD COLUMN village VARCHAR(100);
ALTER TABLE buyer_profiles ADD COLUMN tehsil VARCHAR(100);
ALTER TABLE provider_profiles ADD COLUMN village VARCHAR(100);
ALTER TABLE provider_profiles ADD COLUMN tehsil VARCHAR(100);
```

### Services won't start
1. Check Docker is running: `docker info`
2. Check ports are free: `lsof -i :3000 -i :3001 -i :5432`
3. View logs: `docker compose logs`

### Database connection issues
1. Verify database is running: `docker compose ps postgres`
2. Check connection: `docker compose exec postgres psql -U postgres -d agricultural_platform`
3. Verify DATABASE_URL in environment

## Access Points

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **API Health**: http://localhost:3001/health
- **Database**: localhost:5432




