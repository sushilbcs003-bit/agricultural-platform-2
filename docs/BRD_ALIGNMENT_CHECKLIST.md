# BRD Alignment Checklist - Agricultural Trading Platform

## Overview
This document tracks alignment between the codebase and the Business Requirements Document (BRD).

## ✅ Completed Requirements

### Database Layer
- [x] 3NF+ normalized schema
- [x] Separate profile tables (farmer_profiles, buyer_profiles, supplier_profiles)
- [x] Address hierarchy (Village → Country)
- [x] Encrypted sensitive fields (Aadhaar, account numbers)
- [x] Machinery master data (admin-controlled)
- [x] Payment profiles table
- [x] Audit trail support (createdAt/updatedAt)

### Frontend
- [x] Responsive design system
- [x] Supplier Dashboard component
- [x] API utilities for all endpoints
- [x] Mobile navigation
- [x] Card/grid layouts

## ⏳ Requirements Needing Implementation

### A. Farmer Functionalities

#### A1. Registration & Authentication ✅
- [x] Register Farmer endpoint exists
- [x] OTP login implemented
- [ ] **Update**: Use new `otp_requests` table structure
- [ ] **Update**: Ensure farmer ID persistence

#### A2. Profile Management ⏳
- [x] View profile endpoint
- [x] Update profile endpoint
- [ ] **Update**: Use new address hierarchy (addresses table)
- [ ] **Update**: LGD village search integration
- [ ] **Add**: Registration time display (createdAt)

#### A3. Land Management ✅
- [x] View lands endpoint
- [x] Add/Edit/Delete land endpoints
- [ ] **Update**: Use new `land_records` table
- [ ] **Add**: Prevent deletion if linked to accepted orders

#### A4. Location Management ⏳
- [x] Add locations endpoint
- [ ] **Update**: Use new `farmer_locations` table
- [ ] **Update**: Use addresses table for location data

#### A5. Product Listing & Inventory ⏳
- [x] View/Add/Update/Delete products
- [x] Set availability
- [x] Update status (single & bulk)
- [ ] **Update**: Use new product status enum (DRAFT, PUBLISHED, SUSPENDED, SOLD_OUT)
- [ ] **Add**: Product images support

#### A6. Orders Tracking ⏳
- [x] View orders endpoint exists
- [ ] **Update**: Use new unified `orders` table
- [ ] **Add**: Track payment status, delivery date, providers

#### A7. Quality Testing Results ⏳
- [x] View quality tests endpoint exists
- [ ] **Update**: Use new `quality_test_reports` structure
- [ ] **Add**: Display metrics and images

#### A8. Farming & Transport Services Discovery ⏳
- [ ] **Create**: Browse farming machinery endpoint
- [ ] **Create**: Browse transport services endpoint
- [ ] **Add**: Supplier details view
- [ ] **Add**: Place service orders

### B. Buyer Functionalities

#### B1. Registration & Authentication ⏳
- [x] Register Buyer endpoint exists
- [x] OTP login exists
- [ ] **Update**: Use GST-based OTP login
- [ ] **Update**: Use new `otp_requests` table

#### B2. Browse Farmers & Products ✅
- [x] Browse farmers endpoint
- [x] View products per farmer
- [ ] **Enhance**: Marketplace-style UI

#### B3. Place Bid / Offer ⏳
- [x] Place bid endpoint exists
- [ ] **Update**: Use new `bids` table structure
- [ ] **Add**: Track bid status and timestamp

#### B4. Shortlist Farmers ⏳
- [ ] **Create**: Add/remove from shortlist endpoints
- [ ] **Add**: Add shortlisted farmer to cart
- [ ] **Update**: Use `buyer_shortlists` table

#### B5. Cart & Checkout Preparation ⏳
- [ ] **Create**: View cart endpoint
- [ ] **Create**: Add to cart endpoint
- [ ] **Create**: Remove from cart endpoint
- [ ] **Create**: Checkout endpoint
- [ ] **Update**: Use unified `carts` and `cart_items` tables

#### B6. Buyer Profile ⏳
- [x] View profile endpoint exists
- [ ] **Update**: Display business name, GST (read-only)
- [ ] **Add**: Registration time display

### C. Supplier Functionalities

#### C1. Supplier Registration ⏳
- [x] Register Supplier endpoint exists
- [ ] **Update**: Require supplier type selection
- [ ] **Update**: OTP phone verification
- [ ] **Add**: Password confirmation validation

#### C2. Supplier Authentication ⏳
- [x] OTP request endpoint exists
- [ ] **Update**: GST-based OTP login
- [ ] **Update**: Use new `otp_requests` table

#### C3. Supplier Platform Metrics ✅
- [x] Admin dashboard exists
- [ ] **Add**: Supplier count in metrics

#### C4. Supplier Profile Management ⏳
- [x] View/update profile endpoints exist
- [ ] **Update**: Use new profile structure
- [ ] **Add**: Registration time display
- [ ] **Update**: Use address hierarchy

### D. Machinery & Transport Module

#### D1. Supplier Machinery Management ⏳
- [ ] **Create**: View machinery endpoint
- [ ] **Create**: Add machinery endpoint
- [ ] **Create**: Edit machinery endpoint
- [ ] **Create**: Delete machinery endpoint
- [ ] **Add**: Machinery type validation (master data)
- [ ] **Add**: Coverage area support
- [ ] **Add**: Type-specific fields (capacity, refrigeration, horsepower)

#### D2. Farmer Machinery Discovery ⏳
- [ ] **Create**: Browse farming machinery endpoint
- [ ] **Create**: Browse transport services endpoint
- [ ] **Add**: Filter by type, location, availability
- [ ] **Add**: Supplier details display

#### D3. Buyer Transport Access ⏳
- [ ] **Create**: Conditional transport access check
- [ ] **Add**: Finalization check (product in cart/order)
- [ ] **Add**: Transport tab visibility logic

### E. Payment Profiles

#### E1. Payment Profile Management ⏳
- [ ] **Create**: GET /api/{role}/:id/payment-details
- [ ] **Create**: PUT /api/{role}/:id/payment-details
- [ ] **Add**: Bank account details (encrypted)
- [ ] **Add**: UPI & wallet IDs
- [ ] **Add**: IFSC validation
- [ ] **Add**: UPI ID validation
- [ ] **Add**: Masking in UI
- [ ] **Add**: Role-based requirements (Farmer/Supplier mandatory, Buyer optional)

### F. Access Control

#### F1. Authorization Rules ⏳
- [ ] **Enforce**: Farmers manage own data only
- [ ] **Enforce**: Buyers manage own profile, bids, cart
- [ ] **Enforce**: Suppliers manage own profiles only
- [ ] **Enforce**: Admin views platform-wide data
- [ ] **Enforce**: Supplier machinery isolation (own only)
- [ ] **Enforce**: Buyer transport conditional access

## 🔧 Implementation Priority

### Phase 1: Critical (Core Functionality)
1. Update OTP system to use `otp_requests` table
2. Update profile endpoints for new structure
3. Implement cart system (unified)
4. Implement payment profiles
5. Update address handling (use addresses table)

### Phase 2: High Priority (User Features)
1. Machinery management (supplier)
2. Machinery discovery (farmer/buyer)
3. Order system (unified)
4. Quality test reports (new structure)
5. Shortlist functionality

### Phase 3: Medium Priority (Enhancements)
1. LGD village search integration
2. Land deletion protection
3. Buyer transport conditional access
4. Enhanced validation
5. Audit trail implementation

## 📝 Code Updates Needed

### Backend Services
- [ ] Update `authService.ts` - New OTP structure
- [ ] Update `userService.ts` - New profile structure, payment profiles
- [ ] Create `machineryService.ts` - Complete implementation
- [ ] Create `cartService.ts` - Unified cart
- [ ] Create `orderService.ts` - Unified orders
- [ ] Create `locationService.ts` - LGD search, address management
- [ ] Update `productService.ts` - New structure
- [ ] Update `bidService.ts` - New structure

### Backend Controllers
- [ ] Update `authController.ts` - New OTP, GST-based login
- [ ] Update `userController.ts` - Payment profiles, new structure
- [ ] Create `machineryController.ts`
- [ ] Create `cartController.ts`
- [ ] Create `orderController.ts`
- [ ] Create `locationController.ts`
- [ ] Create `paymentController.ts`

### Backend Routes
- [ ] Update `routes/auth.ts`
- [ ] Update `routes/users.ts`
- [ ] Create `routes/machinery.ts`
- [ ] Create `routes/cart.ts`
- [ ] Create `routes/orders.ts`
- [ ] Create `routes/location.ts`
- [ ] Create `routes/payment.ts`

### Frontend Components
- [ ] Update FarmerDashboard - New profile structure
- [ ] Update BuyerDashboard - Cart, shortlist, conditional transport
- [ ] Update SupplierDashboard - Machinery management
- [ ] Create Cart component
- [ ] Create Machinery browsing components
- [ ] Update forms for new data structure

## 🎯 Acceptance Criteria Checklist

### Farmer
- [ ] Can register with OTP
- [ ] Can view/update profile with address hierarchy
- [ ] Can manage lands (CRUD with deletion protection)
- [ ] Can manage multiple locations
- [ ] Can manage products (CRUD, availability, status)
- [ ] Can view orders with full details
- [ ] Can view quality test results
- [ ] Can browse farming & transport machinery
- [ ] Can place service orders

### Buyer
- [ ] Can register with GST
- [ ] Can login with GST-based OTP
- [ ] Can browse farmers and products
- [ ] Can place bids
- [ ] Can shortlist farmers
- [ ] Can manage cart (add/remove/checkout)
- [ ] Can view orders
- [ ] Can browse transport (only after finalization)

### Supplier
- [ ] Can register with supplier types
- [ ] Can login with GST-based OTP
- [ ] Can manage profile
- [ ] Can manage machinery inventory (CRUD)
- [ ] Can view orders

### Admin
- [ ] Can view platform metrics
- [ ] Can see supplier counts
- [ ] Can view masked sensitive data

## 📊 Current Status

**Database Schema**: ✅ 100% Complete  
**Prisma Schema**: ✅ 100% Complete  
**Frontend APIs**: ✅ 100% Complete  
**Backend Services**: ⏳ 30% Complete (needs updates)  
**Backend Controllers**: ⏳ 40% Complete (needs updates)  
**Frontend Components**: ⏳ 60% Complete (needs updates)  

## 🚀 Next Steps

1. Apply database schema
2. Update Prisma and generate client
3. Update backend services (priority order above)
4. Update backend controllers
5. Update frontend components
6. Test all acceptance criteria

---

**Last Updated**: January 2024  
**Status**: Database ready, Backend/Frontend sync in progress
