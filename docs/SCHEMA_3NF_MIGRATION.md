# Schema 3NF Migration Summary

## What Changed

### 1. schema-3nf.sql is now the single source of truth
- All new schema changes go through schema-3nf.sql or migrations
- schema.sql has been deprecated (stub only, no DDL)

### 2. schema.sql deprecated
- Replaced with a no-op stub
- Original preserved in `database/deprecated/schema-legacy.sql`

### 3. lands table added to schema-3nf
- Flat structure for farmer portal compatibility
- Columns: farmer_id, land_name, village_name, state_code, district_code, subdistrict_code, land_area, land_unit, ownership_type, status

### 4. Backend targets 3NF only
- **Products:** Uses `farmer_user_id`, `name`, `price`, `stock_qty`, `unit`, `status`
- **Lands:** Uses `lands` table (farmer_id, land_name, etc.)
- Removed schema.sql fallbacks

### 5. Migrations setup
- **Init scripts:** `database/z_*.sql` run automatically on Docker first init
- **Manual migrations:** `database/migrations/*.sql` run via apply-schema.sh
- **Prisma:** `backend/prisma/migrations/` for ORM-managed schema evolution

### 6. Post-schema scripts (z_*.sql)
- `z_extend_land_area_unit.sql` - Adds KATHA, GUNTHA to LandAreaUnit enum
- `z_add_users_profile_columns.sql` - Adds name, phone_verified, etc. to users

## Existing Deployments

If you have an existing database with schema.sql structure:

1. **Products:** Run migration to add `farmer_user_id`, `name`, `price`, `stock_qty` or recreate products table
2. **Users:** Run `z_add_users_profile_columns.sql` to add missing columns
3. **Lands:** Run schema-3nf (lands table is IF NOT EXISTS) or ensure lands exists

For a clean start: `docker compose down -v` then `docker compose up -d postgres`

## Apply schema manually

```bash
./database/apply-schema.sh
```
