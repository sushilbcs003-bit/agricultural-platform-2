# Database Setup Guide - 3NF+ Relational Design

## Overview
This directory contains the complete 3NF+ normalized database schema for the Agricultural Trading Platform.

## Files
- `schema-3nf.sql` - **Single source of truth.** Complete 3NF schema with tables, indexes, seed data
- `schema.sql` - DEPRECATED stub (no DDL). Legacy schema preserved in `deprecated/schema-legacy.sql`
- `z_*.sql` - Post-schema migrations (enum extensions, user columns). Run after schema-3nf
- `migrations/` - Manual migrations for schema evolution

## Database Design Principles

1. **One auth identity per login** - Role-specific details in separate profile tables
2. **Normalized address hierarchy** - Village → Tehsil → District → State → Country with LGD support
3. **Separated trade and services** - Products/bids/orders separate from machinery/service orders
4. **Admin-controlled master data** - Machinery types are master lists (no free text)
5. **Encrypted sensitive fields** - Aadhaar and bank account numbers stored encrypted
6. **Audit trail** - createdAt/updatedAt everywhere, plus audit tables

## Setup Instructions

### Option 1: Using Docker (Recommended)

1. **Start PostgreSQL container:**
   ```bash
   cd /Users/bravo/working_code/jan-26/agricultural-platform
   docker compose up -d postgres
   ```

2. **Wait for database to be ready:**
   ```bash
   # Check if database is ready
   docker compose ps postgres
   ```

3. **Apply the schema:**
   ```bash
   # Copy schema to container and execute
   docker exec -i agricultural_postgres psql -U postgres -d agricultural_platform < database/schema-3nf.sql
   ```

   Or connect interactively:
   ```bash
   docker exec -it agricultural_postgres psql -U postgres -d agricultural_platform
   ```
   Then run:
   ```sql
   \i /path/to/schema-3nf.sql
   ```

### Option 2: Direct PostgreSQL Connection

If you have PostgreSQL installed locally:

1. **Connect to database:**
   ```bash
   psql -h localhost -U postgres -d agricultural_platform
   ```

2. **Apply schema:**
   ```sql
   \i database/schema-3nf.sql
   ```

### Option 3: Using psql from host

```bash
psql -h localhost -p 5432 -U postgres -d agricultural_platform -f database/schema-3nf.sql
```

## Schema Structure

### Core Tables

1. **Authentication & Users**
   - `users` - Core user identity
   - `otp_requests` - OTP tracking

2. **Location Hierarchy**
   - `countries` → `states` → `districts` → `tehsils` → `villages`
   - `addresses` - Reusable address records

3. **Role Profiles**
   - `farmer_profiles`
   - `buyer_profiles`
   - `supplier_profiles`
   - `supplier_types` - Multi-select supplier types

4. **Farmer Data**
   - `farmer_locations` - Multiple collection points
   - `land_records` - Land management

5. **Products & Inventory**
   - `products` - Farmer product listings
   - `product_images` - Product images

6. **Buyer Features**
   - `bids` - Bid/offer management
   - `buyer_shortlists` - Shortlisted farmers
   - `carts` & `cart_items` - Unified cart (products + services)

7. **Machinery & Services**
   - `machinery_category_master` - Farming/Transport categories
   - `machinery_type_master` - Admin-controlled types
   - `supplier_machinery_inventory` - Supplier inventory

8. **Orders & Payments**
   - `orders` - Unified order table (produce/service/mixed)
   - `order_items` - Produce line items
   - `service_order_items` - Service line items
   - `payments` - Payment transactions

9. **Quality Testing**
   - `quality_test_reports`
   - `quality_test_metrics`
   - `quality_test_images`

10. **Payment Profiles**
    - `payment_profiles` - Bank & digital payment info
    - `payment_profile_audit` - Audit trail

## Seed Data Included

The schema includes seed data for:

1. **Countries**
   - India (default)

2. **Supplier Types**
   - FARMING_MACHINERY
   - TRANSPORT_MACHINERY

3. **Machinery Categories**
   - FARMING
   - TRANSPORT

4. **Machinery Types (Farming)**
   - Tractor, Power Tiller, Rotavator, Seed Drill
   - Sprayer, Harvester, Thresher, Cultivator

5. **Machinery Types (Transport)**
   - Mini Truck (Tata Ace), Tractor Trolley
   - 6-Wheeler Truck, 10-Wheeler Truck
   - Refrigerated Van, Bulk Carrier, Tempo

## Verification

After applying the schema, verify it worked:

```sql
-- Check tables were created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check seed data
SELECT * FROM countries;
SELECT * FROM machinery_category_master;
SELECT * FROM machinery_type_master;
SELECT * FROM supplier_type_master;
```

## Key Features

### 1. Encrypted Fields
- `aadhaar_enc` - Encrypted Aadhaar (BYTEA)
- `account_number_enc` - Encrypted bank account (BYTEA)
- Use application-layer encryption before storing

### 2. Address Normalization
- Full hierarchy: Country → State → District → Tehsil → Village
- LGD code support for government data integration
- Reusable `addresses` table for all entities

### 3. Unified Cart
- Supports both PRODUCT and SERVICE items
- Check constraint ensures proper item type references
- One ACTIVE cart per user (enforced by unique index)

### 4. Order Types
- PRODUCE - Product trade orders
- SERVICE - Machinery/transport service orders
- MIXED - Combined orders

### 5. Land Protection
- `land_records` linked to `order_items`
- Prevents deletion of land linked to accepted orders
- Enforce in application layer or via triggers

## Migration Notes

If you have existing data:

1. **Backup existing database:**
   ```bash
   pg_dump -U postgres agricultural_platform > backup.sql
   ```

2. **Review schema differences:**
   - Compare old `schema.sql` with new `schema-3nf.sql`

3. **Create migration script** if needed for data transformation

4. **Test on development database first**

## Troubleshooting

### Error: "relation already exists"
- Drop existing tables first (if safe):
  ```sql
  DROP SCHEMA public CASCADE;
  CREATE SCHEMA public;
  ```

### Error: "extension already exists"
- The `CREATE EXTENSION IF NOT EXISTS` should handle this
- If issues persist, manually create:
  ```sql
  CREATE EXTENSION IF NOT EXISTS pgcrypto;
  ```

### Connection Issues
- Ensure PostgreSQL is running: `docker compose ps postgres`
- Check connection string: `postgresql://postgres:postgres123@localhost:5432/agricultural_platform`

## Next Steps

After schema is applied:

1. Update Prisma schema (`backend/prisma/schema.prisma`) to match
2. Run Prisma migrations: `npx prisma migrate dev`
3. Update backend models to use new schema
4. Test API endpoints with new structure

## Support

For questions or issues:
- Check schema comments in `schema-3nf.sql`
- Review design principles in this document
- Refer to BRD for business requirements

---

**Last Updated:** January 2024  
**Schema Version:** 3NF+ v1.0.0
