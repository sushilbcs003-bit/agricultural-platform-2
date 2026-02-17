# Database Directory

This directory contains database schemas and initialization scripts for the Agricultural Trading Platform.

## Files

### Schema Files

- **`schema-3nf.sql`** - Complete 3NF+ normalized database schema (RECOMMENDED)
  - PostgreSQL with UUID primary keys
  - All tables, indexes, constraints
  - Seed data for master tables
  - Follows BRD requirements exactly

- **`schema.sql`** - Original schema (kept for reference)
  - Legacy schema structure
  - May be deprecated in favor of schema-3nf.sql

### Scripts

- **`apply-schema.sh`** - Automated script to apply schema-3nf.sql
  - Checks Docker status
  - Starts PostgreSQL if needed
  - Applies schema
  - Verifies installation

- **`init-data.sql`** - Initialization script
  - Runs automatically when PostgreSQL container starts
  - Creates extensions
  - Placeholder for custom setup

### Documentation

- **`DATABASE_SETUP.md`** - Complete setup guide
  - Setup instructions
  - Schema structure overview
  - Verification steps
  - Troubleshooting

## Quick Start

### Apply New Schema (3NF+)

```bash
# Option 1: Use the automated script (recommended)
./database/apply-schema.sh

# Option 2: Manual application
docker exec -i agricultural_postgres psql -U postgres -d agricultural_platform < database/schema-3nf.sql
```

### Verify Schema

```bash
# Connect to database
docker exec -it agricultural_postgres psql -U postgres -d agricultural_platform

# Check tables
\dt

# Check seed data
SELECT * FROM countries;
SELECT * FROM machinery_category_master;
SELECT * FROM machinery_type_master;
```

## Schema Overview

### Core Structure

1. **Authentication** - `users`, `otp_requests`
2. **Location Hierarchy** - `countries` → `states` → `districts` → `tehsils` → `villages`, `addresses`
3. **Role Profiles** - `farmer_profiles`, `buyer_profiles`, `supplier_profiles`
4. **Farmer Data** - `farmer_locations`, `land_records`
5. **Products** - `products`, `product_images`
6. **Buyer Features** - `bids`, `buyer_shortlists`, `carts`, `cart_items`
7. **Machinery** - `machinery_category_master`, `machinery_type_master`, `supplier_machinery_inventory`
8. **Orders** - `orders`, `order_items`, `service_order_items`, `payments`
9. **Quality** - `quality_test_reports`, `quality_test_metrics`, `quality_test_images`
10. **Payments** - `payment_profiles`, `payment_profile_audit`

### Key Features

- ✅ 3NF+ Normalization
- ✅ Encrypted sensitive fields (Aadhaar, bank accounts)
- ✅ Normalized address hierarchy with LGD support
- ✅ Unified cart system (products + services)
- ✅ Admin-controlled machinery master data
- ✅ Complete audit trail support

## Migration Notes

### From Old Schema

If migrating from `schema.sql`:

1. **Backup existing data:**
   ```bash
   docker exec agricultural_postgres pg_dump -U postgres agricultural_platform > backup.sql
   ```

2. **Review differences** between old and new schema

3. **Create migration script** for data transformation if needed

4. **Test on development database first**

### Prisma Integration

If using Prisma ORM:

1. Update `backend/prisma/schema.prisma` to match new structure
2. Run migrations: `npx prisma migrate dev`
3. Generate client: `npx prisma generate`

## Troubleshooting

### Schema Already Exists

If you need to reset:

```sql
-- WARNING: This will delete all data!
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
```

Then re-run `apply-schema.sh`

### Connection Issues

```bash
# Check if PostgreSQL is running
docker compose ps postgres

# Check logs
docker compose logs postgres

# Restart if needed
docker compose restart postgres
```

## Support

For detailed information, see:
- `DATABASE_SETUP.md` - Complete setup guide
- `schema-3nf.sql` - Schema with inline comments
- BRD documentation - Business requirements

---

**Last Updated:** January 2024  
**Schema Version:** 3NF+ v1.0.0
