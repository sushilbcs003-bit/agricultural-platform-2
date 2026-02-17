# Database Migrations

## Schema Source of Truth

**schema-3nf.sql** is the single source of truth. It runs on Docker init (first startup).

## Migration Types

### 1. Init Scripts (database/*.sql)

Run automatically on first `docker compose up` when the DB volume is empty.

- `init-data.sql` - Extensions
- `schema-3nf.sql` - Full 3NF schema
- `schema.sql` - DEPRECATED stub (no DDL)
- `z_extend_land_area_unit.sql` - Extends LandAreaUnit enum (runs last)

### 2. Manual Migrations (database/migrations/)

For schema changes after initial setup. Run with:

```bash
for f in database/migrations/*.sql; do
  docker exec -i agricultural_postgres psql -U postgres -d agricultural_platform < "$f"
done
```

Or add to `apply-schema.sh` for a combined apply.

### 3. Prisma Migrations (backend/prisma/migrations/)

For schema evolution managed by Prisma ORM.

**Baseline** (existing DB): Schema was applied by schema-3nf.sql. Mark as applied:

```bash
cd backend && npx prisma migrate resolve --applied 0_init_baseline
```

**New changes**: Create migration from schema changes:

```bash
cd backend && npx prisma migrate dev --name your_change_name
```

## Adding New Migrations

1. Create `database/migrations/YYYYMMDD_description.sql`
2. Use `IF NOT EXISTS` / `EXCEPTION WHEN duplicate_object` for idempotency
3. Update this README if needed
