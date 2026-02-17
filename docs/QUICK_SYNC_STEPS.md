# Quick Sync Steps - Frontend & Backend with 3NF+ Database

## 🎯 Goal
Sync Frontend and Backend APIs with the new 3NF+ database schema.

## ✅ What's Already Done

1. ✅ **Database Schema** - `database/schema-3nf.sql` (22KB, complete)
2. ✅ **Prisma Schema** - `backend/prisma/schema-3nf.prisma` (matches DB)
3. ✅ **Frontend API Utilities** - Updated with new endpoints
4. ✅ **Documentation** - Setup guides and sync documentation

## 📋 Next Steps (In Order)

### Step 1: Apply Database Schema
```bash
# From project root
./apply-database-schema.sh

# Or manually
docker compose up -d postgres
sleep 5
docker exec -i agricultural_postgres psql -U postgres -d agricultural_platform < database/schema-3nf.sql
```

### Step 2: Update Prisma Schema
```bash
cd backend

# Backup current schema
cp prisma/schema.prisma prisma/schema.prisma.backup

# Use new schema
cp prisma/schema-3nf.prisma prisma/schema.prisma

# Generate Prisma client
npx prisma generate

# Optional: Create migration
npx prisma migrate dev --name sync_3nf_schema
```

### Step 3: Update Backend Services

**Priority Services to Update:**

1. **`src/services/authService.ts`**
   - Update OTP handling for `otp_requests` table
   - Support new user/profile structure
   - Handle GST-based login

2. **`src/services/userService.ts`**
   - Update for new profile structure (farmer_profiles, buyer_profiles, supplier_profiles)
   - Handle encrypted fields (aadhaar_enc)
   - Support address hierarchy

3. **`src/services/productService.ts`**
   - Update for new `products` table structure
   - Handle new status enum
   - Support `product_images` table

4. **Create New Services:**
   - `src/services/machineryService.ts`
   - `src/services/cartService.ts`
   - `src/services/orderService.ts`
   - `src/services/locationService.ts`

### Step 4: Update Backend Controllers

**Priority Controllers:**

1. Update `src/controllers/authController.ts`
2. Update `src/controllers/userController.ts`
3. Update `src/controllers/productController.ts`
4. Create `src/controllers/machineryController.ts`
5. Create `src/controllers/cartController.ts`
6. Create `src/controllers/orderController.ts`

### Step 5: Update Routes

Add new routes in `src/routes/`:
- `machinery.ts`
- `cart.ts`
- `orders.ts`
- `location.ts`

### Step 6: Test & Verify

```bash
# Test backend
cd backend
npm run dev

# Test frontend
cd frontend
npm start
```

## 🔑 Key Changes to Remember

### 1. User Structure
**Old:** Single `users` table  
**New:** `users` + `farmer_profiles`/`buyer_profiles`/`supplier_profiles`

### 2. Address Structure
**Old:** Flat fields in profiles  
**New:** Normalized `addresses` table with hierarchy

### 3. Products
**Old:** Various status values  
**New:** Standardized enum (`DRAFT`, `PUBLISHED`, `SUSPENDED`, `SOLD_OUT`)

### 4. Cart System
**New:** Unified `carts` + `cart_items` (supports products + services)

### 5. Orders
**New:** Unified `orders` table with `order_type` (`PRODUCE`, `SERVICE`, `MIXED`)

### 6. Machinery
**New:** Complete system with master data and supplier inventory

## 📚 Documentation

- **Database Setup**: `database/DATABASE_SETUP.md`
- **API Sync Guide**: `backend/API_SYNC_GUIDE.md`
- **Sync Status**: `SYNC_STATUS.md`
- **Prisma Schema**: `backend/prisma/schema-3nf.prisma`

## ⚠️ Important Notes

1. **Encryption**:** Sensitive fields (aadhaar_enc, account_number_enc) must be encrypted before storing
2. **Address Hierarchy**: Use `addresses` table for all location needs
3. **Cart**: Supports both PRODUCT and SERVICE items
4. **Orders**: Can be PRODUCE, SERVICE, or MIXED type
5. **Machinery**: Admin-controlled master data, supplier inventory

## 🚀 Quick Test

After applying schema and updating Prisma:

```bash
# Test database connection
cd backend
npx prisma studio

# Test API
npm run dev
# Visit http://localhost:3001/health
```

## 📞 Support

- Check `SYNC_STATUS.md` for detailed status
- Review `API_SYNC_GUIDE.md` for implementation details
- See `database/DATABASE_SETUP.md` for database info

---

**Status**: Ready for implementation  
**Last Updated**: January 2024
