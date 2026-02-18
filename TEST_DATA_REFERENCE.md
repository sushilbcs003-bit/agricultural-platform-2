# 🧪 Test Data Reference Guide

Complete reference for all test users and data created for testing.

## 📊 Summary

- **Farmers**: 3
- **Buyers**: 3  
- **Suppliers**: 2
- **Products**: 8
- **Bids**: 3
- **Carts**: 1

---

## 👨‍🌾 Farmers

### 1. Ravi Kumar
- **Phone**: `+919876543210`
- **Email**: `ravi.kumar@farmer.com`
- **Aadhaar**: `123456789012` (Last 4: `9012`)
- **Date of Birth**: `1985-05-15`
- **Location**: Rampur, Meerut, Uttar Pradesh
- **Address**: Linked to primary address
- **About**: Organic farming specialist with 10+ years experience
- **Land**: 5.5 Hectares, Canal irrigation, Owned
- **Products**:
  - Wheat (60 Quintals @ ₹4,000/quintal)
  - Basmati Rice (40 Quintals @ ₹5,500/quintal)
  - Tomatoes (500 KG @ ₹30/kg)

### 2. Suresh Singh
- **Phone**: `+919876543211`
- **Email**: `suresh.singh@farmer.com`
- **Aadhaar**: `234567890123` (Last 4: `0123`)
- **Date of Birth**: `1978-03-20`
- **Location**: Baraut, Baghpat, Uttar Pradesh
- **Address**: Linked to primary address
- **About**: Traditional farmer growing sugarcane and wheat
- **Land**: 8.0 Hectares, Tube Well irrigation, Owned
- **Products**:
  - Sugarcane (25 Tons @ ₹3,500/ton)
  - Wheat (50 Quintals @ ₹3,800/quintal)

### 3. Priya Devi
- **Phone**: `+919876543212`
- **Email**: `priya.devi@farmer.com`
- **Aadhaar**: `345678901234` (Last 4: `1234`)
- **Date of Birth**: `1990-08-10`
- **Location**: Modinagar, Ghaziabad, Uttar Pradesh
- **Address**: Linked to primary address
- **About**: Women farmer growing vegetables and fruits. Focus on organic produce.
- **Land**: 3.0 Hectares, Rainwater irrigation, Owned
- **Products**:
  - Potatoes (800 KG @ ₹25/kg)
  - Onions (600 KG @ ₹35/kg)
  - Mangoes (200 KG @ ₹80/kg)

---

## 🏢 Buyers

### 1. AgriTrade Solutions Pvt Ltd
- **Phone**: `+919876543220`
- **Email**: `contact@agritrade.com`
- **GST Number**: `09AAACH7409R1ZZ`
- **Password**: `Buyer123!`
- **Aadhaar**: `456789012345` (Last 4: `2345`)
- **Full Name**: Rajesh Sharma
- **Date of Birth**: `1980-01-15`
- **Business**: Agricultural Commodities Trading
- **Website**: https://agritrade.com
- **Address**: Linked to business address
- **Cart**: Contains Wheat (10 quintals) and Tomatoes (50 KG)

### 2. Fresh Farm Direct
- **Phone**: `+919876543221`
- **Email**: `info@freshfarmdirect.com`
- **GST Number**: `09AAACH7409R2ZZ`
- **Aadhaar**: `567890123456` (Last 4: `3456`)
- **Full Name**: Anita Verma
- **Date of Birth**: `1985-06-20`
- **Business**: Fresh Produce Retail
- **Website**: https://freshfarmdirect.com
- **Address**: Linked to business address

### 3. Grain Masters Corporation
- **Phone**: `+919876543222`
- **Email**: `sales@grainmasters.com`
- **GST Number**: `09AAACH7409R3ZZ`
- **Aadhaar**: `678901234567` (Last 4: `4567`)
- **Full Name**: Vikram Mehta
- **Date of Birth**: `1975-11-10`
- **Business**: Grain Processing & Export
- **Website**: https://grainmasters.com
- **Address**: Linked to business address

---

## 🚜 Suppliers

### 1. Farm Equipment Services
- **Phone**: `+919876543230`
- **Email**: `contact@farmequipment.com`
- **GST Number**: `09AAACH7409S1ZZ`
- **Organization**: Farm Equipment Services
- **Contact**: Amit Kumar
- **Website**: https://farmequipment.com
- **Type**: Farming Machinery

### 2. Transport Solutions Ltd
- **Phone**: `+919876543231`
- **Email**: `info@transportsolutions.com`
- **GST Number**: `09AAACH7409S2ZZ`
- **Organization**: Transport Solutions Ltd
- **Contact**: Sunil Yadav
- **Website**: https://transportsolutions.com
- **Type**: Transport Machinery

---

## 💰 Bids Created

1. **Buyer**: AgriTrade Solutions → **Farmer**: Ravi Kumar
   - **Product**: Wheat
   - **Quantity**: 50 Quintals
   - **Bid Price**: ₹4,200/quintal
   - **Status**: PLACED

2. **Buyer**: Fresh Farm Direct → **Farmer**: Ravi Kumar
   - **Product**: Basmati Rice
   - **Quantity**: 30 Quintals
   - **Bid Price**: ₹5,600/quintal
   - **Status**: PLACED

3. **Buyer**: Grain Masters → **Farmer**: Suresh Singh
   - **Product**: Sugarcane
   - **Quantity**: 20 Tons
   - **Bid Price**: ₹3,600/ton
   - **Status**: ACCEPTED

---

## 🧪 Testing Scenarios

### Test Farmer Login/Registration
```bash
# Request OTP
curl -X POST http://localhost:3001/api/auth/otp/request \
  -H "Content-Type: application/json" \
  -d '{"phone": "+919876543210", "purpose": "LOGIN"}'

# Verify OTP (check logs for OTP code)
curl -X POST http://localhost:3001/api/auth/otp/verify \
  -H "Content-Type: application/json" \
  -d '{"phone": "+919876543210", "otp": "123456"}'
```

### Test Buyer Login
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "gst": "09AAACH7409R1ZZ",
    "password": "Buyer123!"
  }'
```

### Test Product Listing
```bash
# Get all products
curl http://localhost:3001/api/products

# Get products by farmer
curl http://localhost:3001/api/products?farmerId=<farmer-id>
```

### Test Bids
```bash
# Get bids (requires auth token)
curl -H "Authorization: Bearer <token>" \
  http://localhost:3001/api/bids/my-bids

# Get bids for a product
curl http://localhost:3001/api/bids/product/<product-id>
```

### Test Cart
```bash
# Get cart (requires auth token)
curl -H "Authorization: Bearer <token>" \
  http://localhost:3001/api/cart
```

---

## 🔄 Resetting Test Data

To clear all test data and start fresh:

```bash
# Truncate user data only (preserves master data)
./truncate-user-data-only.sh

# Then re-seed
docker cp backend/seed-test-data.js agricultural_backend:/app/seed-test-data.js
docker exec agricultural_backend node /app/seed-test-data.js
```

---

## 📝 Notes

- ✅ **All phone numbers are verified**
- ✅ **All farmers have Aadhaar numbers** (stored encrypted in User table and FarmerProfile)
- ✅ **All buyers have Aadhaar numbers** (stored encrypted in User table and BuyerProfile)
- ✅ **All mandatory fields populated**: district, state, fullName, dob, addresses
- ✅ **All farmers have products listed**
- ✅ **Buyers have GST numbers for login**
- ✅ **One buyer (AgriTrade) has a cart with items**
- ✅ **Bids are created between buyers and farmers**
- ✅ **Location master data** (India, UP, Meerut) is created
- ✅ **Addresses are linked** to the location hierarchy
- ✅ **Primary addresses** are linked for all farmers
- ✅ **Business addresses** are linked for all buyers and suppliers

### Aadhaar Storage
- **User Table**: `aadhaarEncrypted` (base64 encoded string)
- **FarmerProfile**: `aadhaarEnc` (Bytes), `aadhaarLast4` (last 4 digits)
- **BuyerProfile**: `aadhaarEnc` (Bytes), `aadhaarLast4` (last 4 digits)

---

## 🚀 Quick Start Testing

1. **Test Frontend**: Open http://localhost:3002
2. **Login as Farmer**: Use phone `+919876543210` with any OTP
3. **Login as Buyer**: Use GST `09AAACH7409R1ZZ` with password `Buyer123!`
4. **Browse Products**: All 8 products should be visible
5. **View Bids**: Check bids on products
6. **Test Cart**: Login as AgriTrade buyer to see cart items

---

**Last Updated**: February 18, 2026
