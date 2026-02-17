# Database Schema Changelog

## 2024-01-11 - 3NF+ Schema Implementation

### Added Files

1. **`schema-3nf.sql`** (22KB)
   - Complete 3NF+ normalized database schema
   - PostgreSQL with UUID primary keys
   - All tables, indexes, constraints, and seed data
   - Follows BRD requirements exactly

2. **`apply-schema.sh`** (Executable)
   - Automated script to apply schema
   - Checks Docker status
   - Verifies installation
   - Provides helpful output

3. **`DATABASE_SETUP.md`**
   - Complete setup guide
   - Schema structure overview
   - Troubleshooting guide

4. **`README.md`**
   - Quick reference for database directory
   - File descriptions
   - Quick start guide

5. **`VERIFY_SCHEMA.sql`**
   - Verification queries
   - Check tables, indexes, constraints
   - Verify seed data

### Updated Files

1. **`init-data.sql`**
   - Updated to reference new schema
   - Added notes about applying schema-3nf.sql
   - Improved initialization messages

### Root Level

1. **`apply-database-schema.sh`** (Executable)
   - Convenience script in project root
   - Calls database/apply-schema.sh

## Schema Features

### New Tables (30+)

- **Authentication**: `users`, `otp_requests`
- **Location**: `countries`, `states`, `districts`, `tehsils`, `villages`, `addresses`
- **Profiles**: `farmer_profiles`, `buyer_profiles`, `supplier_profiles`, `supplier_types`
- **Farmer Data**: `farmer_locations`, `land_records`
- **Products**: `products`, `product_images`
- **Buyer Features**: `bids`, `buyer_shortlists`, `carts`, `cart_items`
- **Machinery**: `machinery_category_master`, `machinery_type_master`, `supplier_machinery_inventory`
- **Orders**: `orders`, `order_items`, `service_order_items`, `payments`
- **Quality**: `quality_test_reports`, `quality_test_metrics`, `quality_test_images`
- **Payments**: `payment_profiles`, `payment_profile_audit`

### Key Improvements

1. **3NF+ Normalization**
   - Properly normalized address hierarchy
   - Separated concerns (trade vs services)
   - Reusable address table

2. **Security**
   - Encrypted sensitive fields (Aadhaar, bank accounts)
   - Proper access control via user_id FKs

3. **Master Data**
   - Admin-controlled machinery types
   - Seed data for all master tables

4. **Unified Cart**
   - Supports both products and services
   - Proper constraints and validation

5. **Audit Trail**
   - createdAt/updatedAt on all tables
   - Payment profile audit table

## Usage

### Apply Schema

```bash
# From project root
./apply-database-schema.sh

# Or from database directory
./database/apply-schema.sh

# Or manually
docker exec -i agricultural_postgres psql -U postgres -d agricultural_platform < database/schema-3nf.sql
```

### Verify Schema

```bash
# Connect and run verification
docker exec -it agricultural_postgres psql -U postgres -d agricultural_platform -f database/VERIFY_SCHEMA.sql
```

## Migration Notes

- Old schema (`schema.sql`) is kept for reference
- New schema is completely independent
- Can be applied to fresh database or alongside existing schema (with care)
- Prisma schema will need updating to match new structure

## Next Steps

1. ✅ Schema files created
2. ⏳ Apply schema to database (when Docker is running)
3. ⏳ Update Prisma schema if using Prisma ORM
4. ⏳ Update backend models
5. ⏳ Test API endpoints

---

**Status**: Ready for application  
**Version**: 3NF+ v1.0.0
