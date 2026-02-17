# API & Database Sync Guide

## Overview
This guide helps sync the Frontend and Backend API with the new 3NF+ database schema.

## Database Schema Status

✅ **New Schema Created**: `database/schema-3nf.sql`  
✅ **Prisma Schema Created**: `backend/prisma/schema-3nf.prisma`  
⏳ **Backend Services**: Need updating  
⏳ **Frontend API**: Need updating  

## Migration Steps

### Step 1: Apply Database Schema

```bash
# Apply the new database schema
./apply-database-schema.sh

# Or manually
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

# Create migration (if needed)
npx prisma migrate dev --name sync_3nf_schema
```

### Step 3: Update Backend Services

#### Key Changes Needed:

1. **User Service** (`backend/src/services/userService.ts`)
   - Update to use new profile structure
   - Handle encrypted fields (aadhaar_enc, account_number_enc)
   - Support new address hierarchy

2. **Auth Service** (`backend/src/services/authService.ts`)
   - Update OTP handling to use `otp_requests` table
   - Support GST-based login for buyers/suppliers
   - Handle new user structure

3. **Product Service** (`backend/src/services/productService.ts`)
   - Update to use new `products` table structure
   - Handle new status enum (DRAFT, PUBLISHED, SUSPENDED, SOLD_OUT)
   - Support product images table

4. **Bid Service** (`backend/src/services/bidService.ts`)
   - Update to use new `bids` table
   - Support new bid status enum
   - Link to farmer_profiles and buyer_profiles

5. **New Services Needed**:
   - `machineryService.ts` - Handle supplier machinery inventory
   - `cartService.ts` - Unified cart (products + services)
   - `orderService.ts` - Unified orders (produce/service/mixed)
   - `locationService.ts` - LGD village search and address management

### Step 4: Update Backend Controllers

#### Controllers to Update:

1. **Auth Controller** (`backend/src/controllers/authController.ts`)
   ```typescript
   // New endpoints needed:
   - POST /api/auth/register/farmer (with new profile structure)
   - POST /api/auth/register/buyer (with GST)
   - POST /api/auth/register/supplier (with supplier types)
   - POST /api/auth/otp/request (unified OTP)
   - POST /api/auth/otp/verify (unified OTP)
   ```

2. **User Controller** (`backend/src/controllers/userController.ts`)
   ```typescript
   // Update endpoints:
   - GET /api/farmer/:id/profile (new structure)
   - PUT /api/farmer/:id/profile (new structure)
   - GET /api/buyer/:id/profile
   - GET /api/supplier/:id/profile
   ```

3. **Product Controller** (`backend/src/controllers/productController.ts`)
   ```typescript
   // Update to new product structure
   - Status enum changes
   - Product images support
   - Availability flags
   ```

4. **New Controllers Needed**:
   - `machineryController.ts` - Supplier machinery management
   - `cartController.ts` - Cart operations
   - `orderController.ts` - Order management
   - `locationController.ts` - LGD village search

### Step 5: Update Frontend API Utilities

#### File: `frontend/src/utils/api.js`

**New/Updated Functions Needed:**

```javascript
// Location APIs
export const searchLGDVillages = async (query) => {
  return apiCallWithFallback('get', 
    `${API_VERSION}/lgd/villages/search`, 
    '/api/lgd/villages/search', 
    { params: { q: query } }
  );
};

// Supplier APIs
export const getSupplierProfile = async (supplierId) => {
  return apiCallWithFallback('get', 
    `${API_VERSION}/supplier/${supplierId}/profile`,
    `/api/supplier/${supplierId}/profile`
  );
};

export const getSupplierMachinery = async (supplierId) => {
  return apiCallWithFallback('get',
    `${API_VERSION}/supplier/${supplierId}/machinery`,
    `/api/supplier/${supplierId}/machinery`
  );
};

export const addSupplierMachinery = async (supplierId, machineryData) => {
  return apiCallWithFallback('post',
    `${API_VERSION}/supplier/${supplierId}/machinery`,
    `/api/supplier/${supplierId}/machinery`,
    machineryData
  );
};

// Cart APIs
export const getCart = async (userId) => {
  return apiCallWithFallback('get',
    `${API_VERSION}/cart`,
    '/api/cart'
  );
};

export const addToCart = async (item) => {
  return apiCallWithFallback('post',
    `${API_VERSION}/cart/items`,
    '/api/cart/items',
    item
  );
};

export const removeFromCart = async (itemId) => {
  return apiCallWithFallback('delete',
    `${API_VERSION}/cart/items/${itemId}`,
    `/api/cart/items/${itemId}`
  );
};

// Order APIs
export const createOrder = async (orderData) => {
  return apiCallWithFallback('post',
    `${API_VERSION}/orders`,
    '/api/orders',
    orderData
  );
};

export const getOrders = async (userId, role) => {
  return apiCallWithFallback('get',
    `${API_VERSION}/orders?userId=${userId}&role=${role}`,
    `/api/orders?userId=${userId}&role=${role}`
  );
};

// Machinery Discovery APIs
export const getFarmingMachinery = async (filters) => {
  return apiCallWithFallback('get',
    `${API_VERSION}/machinery/farming`,
    '/api/machinery/farming',
    { params: filters }
  );
};

export const getTransportMachinery = async (filters) => {
  return apiCallWithFallback('get',
    `${API_VERSION}/machinery/transport`,
    '/api/machinery/transport',
    { params: filters }
  );
};
```

## Key Schema Changes Summary

### 1. User & Authentication
- **Old**: Single `users` table with all fields
- **New**: `users` table + separate profile tables (`farmer_profiles`, `buyer_profiles`, `supplier_profiles`)
- **OTP**: New `otp_requests` table with purpose tracking

### 2. Address Structure
- **Old**: Flat address fields in profiles
- **New**: Normalized hierarchy (`countries` → `states` → `districts` → `tehsils` → `villages`)
- **Reusable**: `addresses` table for all entities

### 3. Products
- **Old**: Various status values
- **New**: Standardized enum (`DRAFT`, `PUBLISHED`, `SUSPENDED`, `SOLD_OUT`)
- **Images**: Separate `product_images` table

### 4. Bids
- **Old**: `buyer_bids` with different structure
- **New**: `bids` table with standardized status enum
- **Links**: Direct links to `farmer_profiles` and `buyer_profiles`

### 5. Cart System
- **Old**: Separate selections/shortlists
- **New**: Unified `carts` and `cart_items` supporting both products and services
- **Type**: `CartItemType` enum (`PRODUCT`, `SERVICE`)

### 6. Orders
- **Old**: Single order structure
- **New**: Unified `orders` table with `order_type` enum (`PRODUCE`, `SERVICE`, `MIXED`)
- **Items**: Separate `order_items` (produce) and `service_order_items` (services)

### 7. Machinery
- **New**: Complete machinery system
- **Master Data**: `machinery_category_master`, `machinery_type_master`
- **Inventory**: `supplier_machinery_inventory` with type-specific fields

### 8. Quality Tests
- **Old**: `test_results` with different structure
- **New**: `quality_test_reports` with separate `quality_test_metrics` and `quality_test_images`

### 9. Payment Profiles
- **New**: `payment_profiles` table for bank & digital payment info
- **Audit**: `payment_profile_audit` for change tracking
- **Encryption**: `account_number_enc` field

## Testing Checklist

### Backend
- [ ] Prisma client generates successfully
- [ ] All services updated and tested
- [ ] All controllers updated
- [ ] API endpoints return correct data structure
- [ ] Encryption/decryption working for sensitive fields
- [ ] Address hierarchy queries working
- [ ] Cart operations (add/remove/checkout) working
- [ ] Order creation and management working

### Frontend
- [ ] API utilities updated
- [ ] All API calls use new endpoints
- [ ] Error handling updated
- [ ] Forms updated for new data structure
- [ ] Dashboard components updated
- [ ] Cart functionality working
- [ ] Order tracking working
- [ ] Machinery browsing working

## Rollback Plan

If issues occur:

1. **Database Rollback**:
   ```bash
   # Restore from backup
   docker exec -i agricultural_postgres psql -U postgres -d agricultural_platform < backup.sql
   ```

2. **Prisma Rollback**:
   ```bash
   cd backend
   cp prisma/schema.prisma.backup prisma/schema.prisma
   npx prisma generate
   ```

3. **Code Rollback**:
   ```bash
   git checkout HEAD -- backend/src/
   git checkout HEAD -- frontend/src/utils/api.js
   ```

## Next Steps

1. ✅ Database schema created
2. ✅ Prisma schema created
3. ⏳ Apply database schema
4. ⏳ Update Prisma and generate client
5. ⏳ Update backend services
6. ⏳ Update backend controllers
7. ⏳ Update frontend API utilities
8. ⏳ Test all endpoints
9. ⏳ Update frontend components
10. ⏳ End-to-end testing

## Support

For questions or issues:
- Check `database/DATABASE_SETUP.md` for schema details
- Review `backend/prisma/schema-3nf.prisma` for model structure
- Check BRD for business requirements

---

**Last Updated:** January 2024  
**Status:** In Progress
