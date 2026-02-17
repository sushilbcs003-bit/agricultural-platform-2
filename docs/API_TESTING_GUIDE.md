# 🧪 API Testing Guide - Complete Endpoint Reference

## 🌐 Base URLs

- **Backend API**: `http://localhost:3001`
- **Frontend**: `http://localhost:3000`
- **Health Check**: `http://localhost:3001/health`

---

## 📋 Table of Contents

1. [Health & Info](#health--info)
2. [Authentication](#authentication)
3. [Users](#users)
4. [Products](#products)
5. [Bids](#bids)
6. [Machinery](#machinery)
7. [Cart](#cart)
8. [Location](#location)
9. [Payment Profiles](#payment-profiles)

---

## 🔍 Health & Info

### GET /health
**Description**: Check API health status  
**URL**: `http://localhost:3001/health`  
**Method**: GET  
**Auth**: Not required

**Response**:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-26T10:00:00.000Z",
  "version": "1.0.0",
  "environment": "development"
}
```

### GET /
**Description**: API root information  
**URL**: `http://localhost:3001/`  
**Method**: GET  
**Auth**: Not required

---

## 🔐 Authentication

### POST /api/auth/check-phone
**Description**: Check if phone number exists  
**URL**: `http://localhost:3001/api/auth/check-phone`  
**Method**: POST  
**Auth**: Not required

**Request Body**:
```json
{
  "phone": "+919876543210"
}
```

**Response**:
```json
{
  "success": true,
  "exists": false,
  "phone": "+919876543210"
}
```

### POST /api/auth/otp/request
**Description**: Request OTP for login/registration  
**URL**: `http://localhost:3001/api/auth/otp/request`  
**Method**: POST  
**Auth**: Not required

**Request Body**:
```json
{
  "phone": "+919876543210",
  "purpose": "LOGIN"
}
```

**Response**:
```json
{
  "success": true,
  "message": "OTP sent successfully",
  "phone": "+919876543210"
}
```

**Note**: Check console logs for OTP (in development)

### POST /api/auth/otp/verify
**Description**: Verify OTP  
**URL**: `http://localhost:3001/api/auth/otp/verify`  
**Method**: POST  
**Auth**: Not required

**Request Body**:
```json
{
  "phone": "+919876543210",
  "otp": "123456"
}
```

**Response**:
```json
{
  "success": true,
  "user": { ... },
  "token": "jwt_token_here",
  "message": "Login successful"
}
```

### POST /api/auth/register/farmer
**Description**: Register a new farmer  
**URL**: `http://localhost:3001/api/auth/register/farmer`  
**Method**: POST  
**Auth**: Not required (but phone must be verified)

**Request Body**:
```json
{
  "phone": "+919876543210",
  "name": "John Doe",
  "aadhaar": "123456789012",
  "village": "Village Name",
  "tehsil": "Tehsil Name",
  "district": "District Name",
  "state": "State Name",
  "pincode": "123456",
  "about": "About farmer",
  "landAreaValue": 5.5,
  "landAreaUnit": "ACRE"
}
```

### POST /api/auth/register/buyer
**Description**: Register a new buyer  
**URL**: `http://localhost:3001/api/auth/register/buyer`  
**Method**: POST  
**Auth**: Not required

**Request Body**:
```json
{
  "phone": "+919876543210",
  "name": "Buyer Name",
  "businessName": "Business Name",
  "gst": "29ABCDE1234F1Z5",
  "businessAddress": "Business Address",
  "village": "Village",
  "tehsil": "Tehsil",
  "district": "District",
  "state": "State",
  "pincode": "123456"
}
```

### POST /api/auth/register/supplier
**Description**: Register a new supplier  
**URL**: `http://localhost:3001/api/auth/register/supplier`  
**Method**: POST  
**Auth**: Not required

**Request Body**:
```json
{
  "phone": "+919876543210",
  "organizationName": "Supplier Org",
  "contactName": "Contact Person",
  "gst": "29ABCDE1234F1Z5",
  "address": "Address",
  "website": "https://example.com",
  "supplierTypes": ["FARMING_MACHINERY", "TRANSPORT_MACHINERY"]
}
```

---

## 👤 Users

### GET /api/users/profile
**Description**: Get user profile  
**URL**: `http://localhost:3001/api/users/profile`  
**Method**: GET  
**Auth**: Required (Header: `user-id: <userId>`)

**Headers**:
```
user-id: <user-uuid>
```

**Response**:
```json
{
  "success": true,
  "user": {
    "id": "...",
    "role": "FARMER",
    "phone": "+919876543210",
    "farmerProfile": { ... }
  }
}
```

---

## 🛒 Products

### GET /api/products
**Description**: Get all products  
**URL**: `http://localhost:3001/api/products`  
**Method**: GET  
**Auth**: Not required

**Response**:
```json
{
  "success": true,
  "products": [
    {
      "id": "...",
      "name": "Wheat",
      "price": 2500,
      "unit": "QUINTAL",
      "farmer": { ... }
    }
  ]
}
```

---

## 💰 Bids

### POST /api/bids
**Description**: Create a new bid  
**URL**: `http://localhost:3001/api/bids`  
**Method**: POST  
**Auth**: Required (Buyer role)

**Request Body**:
```json
{
  "productId": "product-uuid",
  "bidQuantity": 10,
  "bidPrice": 2400,
  "message": "Interested in buying"
}
```

### GET /api/bids/my-bids
**Description**: Get buyer's bids  
**URL**: `http://localhost:3001/api/bids/my-bids`  
**Method**: GET  
**Auth**: Required (Buyer role)

### GET /api/bids/product/:productId
**Description**: Get bids for a product  
**URL**: `http://localhost:3001/api/bids/product/{productId}`  
**Method**: GET  
**Auth**: Required (Farmer role)

### PUT /api/bids/:bidId/status
**Description**: Update bid status  
**URL**: `http://localhost:3001/api/bids/{bidId}/status`  
**Method**: PUT  
**Auth**: Required (Farmer role)

**Request Body**:
```json
{
  "status": "ACCEPTED"
}
```

---

## 🚜 Machinery

### GET /api/machinery/types
**Description**: Get machinery types by category  
**URL**: `http://localhost:3001/api/machinery/types?category=FARMING`  
**URL**: `http://localhost:3001/api/machinery/types?category=TRANSPORT`  
**Method**: GET  
**Auth**: Required

**Query Parameters**:
- `category`: `FARMING` or `TRANSPORT`

### GET /api/machinery/supplier/:id
**Description**: Get supplier's machinery inventory  
**URL**: `http://localhost:3001/api/machinery/supplier/{supplierId}`  
**Method**: GET  
**Auth**: Required (Supplier can only view own)

### POST /api/machinery/supplier/:id
**Description**: Add machinery to supplier inventory  
**URL**: `http://localhost:3001/api/machinery/supplier/{supplierId}`  
**Method**: POST  
**Auth**: Required (Supplier role)

**Request Body**:
```json
{
  "machineryTypeId": "type-uuid",
  "quantity": 2,
  "coverageAddressId": "address-uuid",
  "coverageRadiusKm": 50,
  "availabilityStatus": "AVAILABLE",
  "capacityTons": 10,
  "refrigeration": false,
  "horsepower": 50,
  "suitableCrops": "Wheat, Rice"
}
```

### PUT /api/machinery/supplier/:id/:machineryId
**Description**: Update machinery  
**URL**: `http://localhost:3001/api/machinery/supplier/{supplierId}/{machineryId}`  
**Method**: PUT  
**Auth**: Required (Supplier role)

### DELETE /api/machinery/supplier/:id/:machineryId
**Description**: Delete machinery  
**URL**: `http://localhost:3001/api/machinery/supplier/{supplierId}/{machineryId}`  
**Method**: DELETE  
**Auth**: Required (Supplier role)

### GET /api/machinery/farming
**Description**: Browse farming machinery  
**URL**: `http://localhost:3001/api/machinery/farming`  
**Method**: GET  
**Auth**: Required (Farmer role)

**Query Parameters**:
- `availability`: `AVAILABLE`, `LIMITED`, `UNAVAILABLE`
- `machineryTypeId`: UUID
- `latitude`: number
- `longitude`: number
- `radiusKm`: number

### GET /api/machinery/transport
**Description**: Browse transport machinery  
**URL**: `http://localhost:3001/api/machinery/transport`  
**Method**: GET  
**Auth**: Required (Farmer or Buyer role)

**Query Parameters**:
- `availability`: `AVAILABLE`, `LIMITED`, `UNAVAILABLE`
- `machineryTypeId`: UUID
- `hasRefrigeration`: boolean
- `minCapacity`: number
- `latitude`: number
- `longitude`: number
- `radiusKm`: number

**Note**: Buyers can only browse transport after product finalization

---

## 🛒 Cart

### GET /api/cart
**Description**: Get user's cart  
**URL**: `http://localhost:3001/api/cart`  
**Method**: GET  
**Auth**: Required

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "cart-uuid",
    "status": "ACTIVE",
    "items": [
      {
        "id": "item-uuid",
        "itemType": "PRODUCT",
        "product": { ... },
        "quantity": 5,
        "unitPrice": 2500
      }
    ]
  }
}
```

### POST /api/cart/items
**Description**: Add item to cart  
**URL**: `http://localhost:3001/api/cart/items`  
**Method**: POST  
**Auth**: Required

**Request Body** (Product):
```json
{
  "itemType": "PRODUCT",
  "productId": "product-uuid",
  "quantity": 5,
  "unitPrice": 2500
}
```

**Request Body** (Service):
```json
{
  "itemType": "SERVICE",
  "machineryInventoryId": "machinery-uuid",
  "quantity": 1,
  "unitPrice": 5000
}
```

### PUT /api/cart/items/:itemId
**Description**: Update cart item quantity  
**URL**: `http://localhost:3001/api/cart/items/{itemId}`  
**Method**: PUT  
**Auth**: Required

**Request Body**:
```json
{
  "quantity": 10
}
```

### DELETE /api/cart/items/:itemId
**Description**: Remove item from cart  
**URL**: `http://localhost:3001/api/cart/items/{itemId}`  
**Method**: DELETE  
**Auth**: Required

### POST /api/cart/checkout
**Description**: Checkout cart (create order)  
**URL**: `http://localhost:3001/api/cart/checkout`  
**Method**: POST  
**Auth**: Required

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "order-uuid",
    "orderNumber": "ORD-1234567890-ABC",
    "orderType": "MIXED",
    "status": "CREATED"
  }
}
```

### GET /api/cart/summary
**Description**: Get cart summary  
**URL**: `http://localhost:3001/api/cart/summary`  
**Method**: GET  
**Auth**: Required

**Response**:
```json
{
  "success": true,
  "data": {
    "itemCount": 15,
    "totalAmount": 50000,
    "items": 3
  }
}
```

---

## 📍 Location

### GET /api/location/lgd/villages/search
**Description**: Search LGD villages  
**URL**: `http://localhost:3001/api/location/lgd/villages/search?q=village_name`  
**Method**: GET  
**Auth**: Not required

**Query Parameters**:
- `q`: Search query (village name or LGD code)
- `limit`: Number of results (default: 20)

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "village-uuid",
      "name": "Village Name",
      "lgdCode": "12345",
      "tehsil": "Tehsil Name",
      "district": "District Name",
      "state": "State Name",
      "country": "India",
      "fullPath": "Village Name, Tehsil Name, District Name, State Name"
    }
  ]
}
```

### GET /api/location/countries/default
**Description**: Get default country (India)  
**URL**: `http://localhost:3001/api/location/countries/default`  
**Method**: GET  
**Auth**: Not required

---

## 💳 Payment Profiles

### GET /api/payment/:role/:id/profile
**Description**: Get payment profile  
**URL**: `http://localhost:3001/api/payment/FARMER/{userId}/profile`  
**URL**: `http://localhost:3001/api/payment/BUYER/{userId}/profile`  
**URL**: `http://localhost:3001/api/payment/SUPPLIER/{userId}/profile`  
**Method**: GET  
**Auth**: Required (User can only view own profile)

**Response**:
```json
{
  "success": true,
  "data": {
    "userId": "user-uuid",
    "bankName": "Bank Name",
    "accountHolderName": "Account Holder",
    "accountNumber": "****1234",
    "ifscCode": "BANK0001234",
    "upiId": "user@upi",
    "preferredPayoutMethod": "BANK"
  }
}
```

### PUT /api/payment/:role/:id/profile
**Description**: Update payment profile  
**URL**: `http://localhost:3001/api/payment/FARMER/{userId}/profile`  
**Method**: PUT  
**Auth**: Required (User can only update own profile)

**Request Body**:
```json
{
  "bankName": "Bank Name",
  "accountHolderName": "Account Holder Name",
  "accountNumber": "1234567890",
  "ifscCode": "BANK0001234",
  "upiId": "user@upi",
  "paytmId": "9876543210",
  "bharatpeId": "bharatpe@id",
  "googlePayId": "googlepay@id",
  "applePayId": "applepay@id",
  "preferredPayoutMethod": "BANK"
}
```

---

## 🧪 Testing Tools

### Using cURL

**Example - Health Check**:
```bash
curl http://localhost:3001/health
```

**Example - Request OTP**:
```bash
curl -X POST http://localhost:3001/api/auth/otp/request \
  -H "Content-Type: application/json" \
  -d '{"phone": "+919876543210", "purpose": "LOGIN"}'
```

**Example - Get Products**:
```bash
curl http://localhost:3001/api/products
```

### Using Postman

1. **Import Collection**: Create a new collection
2. **Set Base URL**: `http://localhost:3001`
3. **Add Requests**: Use the endpoints above
4. **Set Headers**: 
   - `Content-Type: application/json`
   - `Authorization: Bearer <token>` (for protected routes)
   - `user-id: <userId>` (for user routes)

### Using Browser

**Simple GET requests**:
- Open: `http://localhost:3001/health`
- Open: `http://localhost:3001/api/products`

### Using JavaScript/Fetch

```javascript
// Health check
fetch('http://localhost:3001/health')
  .then(res => res.json())
  .then(data => console.log(data));

// Request OTP
fetch('http://localhost:3001/api/auth/otp/request', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    phone: '+919876543210',
    purpose: 'LOGIN'
  })
})
  .then(res => res.json())
  .then(data => console.log(data));
```

---

## 📝 Testing Checklist

### Authentication
- [ ] Check phone exists
- [ ] Request OTP
- [ ] Verify OTP
- [ ] Register Farmer
- [ ] Register Buyer
- [ ] Register Supplier

### Products
- [ ] Get all products
- [ ] Get product by ID
- [ ] Create product (Farmer)
- [ ] Update product (Farmer)
- [ ] Delete product (Farmer)

### Bids
- [ ] Create bid (Buyer)
- [ ] Get my bids (Buyer)
- [ ] Get product bids (Farmer)
- [ ] Update bid status (Farmer)

### Machinery
- [ ] Get machinery types (FARMING)
- [ ] Get machinery types (TRANSPORT)
- [ ] Get supplier machinery
- [ ] Add machinery (Supplier)
- [ ] Update machinery (Supplier)
- [ ] Delete machinery (Supplier)
- [ ] Browse farming machinery (Farmer)
- [ ] Browse transport machinery (Farmer/Buyer)

### Cart
- [ ] Get cart
- [ ] Add product to cart
- [ ] Add service to cart
- [ ] Update cart item
- [ ] Remove cart item
- [ ] Get cart summary
- [ ] Checkout cart

### Location
- [ ] Search villages
- [ ] Get default country

### Payment
- [ ] Get payment profile
- [ ] Update payment profile

---

## 🔑 Authentication Notes

Most endpoints require authentication. After login/registration, you'll receive a JWT token. Include it in requests:

**Header**:
```
Authorization: Bearer <your-jwt-token>
```

Or for some routes:
```
user-id: <user-uuid>
```

---

## 🐛 Common Issues

### 401 Unauthorized
- **Cause**: Missing or invalid token
- **Solution**: Login first and include token in headers

### 403 Forbidden
- **Cause**: Wrong role (e.g., Buyer trying to access Farmer endpoint)
- **Solution**: Use correct role account

### 404 Not Found
- **Cause**: Invalid endpoint or resource ID
- **Solution**: Check URL and resource IDs

### 500 Internal Server Error
- **Cause**: Server/database issue
- **Solution**: Check backend logs and database connection

---

**Last Updated**: January 2024  
**API Version**: 1.0.0  
**Base URL**: http://localhost:3001
