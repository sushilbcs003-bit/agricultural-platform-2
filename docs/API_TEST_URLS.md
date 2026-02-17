# 🔗 Quick API Test URLs

## 🌐 Base URLs

- **Backend**: http://localhost:3001
- **Frontend**: http://localhost:3000

---

## ✅ Quick Test URLs (Copy & Paste in Browser)

### Health & Info
```
http://localhost:3001/health
http://localhost:3001/
```

### Products (Public)
```
http://localhost:3001/api/products
```

### Location (Public)
```
http://localhost:3001/api/location/lgd/villages/search?q=delhi
http://localhost:3001/api/location/countries/default
```

---

## 📋 All Endpoints Summary

### 🔐 Authentication
- `POST http://localhost:3001/api/auth/check-phone`
- `POST http://localhost:3001/api/auth/otp/request`
- `POST http://localhost:3001/api/auth/otp/verify`
- `POST http://localhost:3001/api/auth/register/farmer`
- `POST http://localhost:3001/api/auth/register/buyer`
- `POST http://localhost:3001/api/auth/register/supplier`

### 👤 Users
- `GET http://localhost:3001/api/users/profile`

### 🛒 Products
- `GET http://localhost:3001/api/products`

### 💰 Bids
- `POST http://localhost:3001/api/bids`
- `GET http://localhost:3001/api/bids/my-bids`
- `GET http://localhost:3001/api/bids/product/{productId}`
- `PUT http://localhost:3001/api/bids/{bidId}/status`

### 🚜 Machinery
- `GET http://localhost:3001/api/machinery/types?category=FARMING`
- `GET http://localhost:3001/api/machinery/types?category=TRANSPORT`
- `GET http://localhost:3001/api/machinery/supplier/{id}`
- `POST http://localhost:3001/api/machinery/supplier/{id}`
- `PUT http://localhost:3001/api/machinery/supplier/{id}/{machineryId}`
- `DELETE http://localhost:3001/api/machinery/supplier/{id}/{machineryId}`
- `GET http://localhost:3001/api/machinery/farming`
- `GET http://localhost:3001/api/machinery/transport`

### 🛒 Cart
- `GET http://localhost:3001/api/cart`
- `POST http://localhost:3001/api/cart/items`
- `PUT http://localhost:3001/api/cart/items/{itemId}`
- `DELETE http://localhost:3001/api/cart/items/{itemId}`
- `POST http://localhost:3001/api/cart/checkout`
- `GET http://localhost:3001/api/cart/summary`

### 📍 Location
- `GET http://localhost:3001/api/location/lgd/villages/search?q={query}`
- `GET http://localhost:3001/api/location/countries/default`

### 💳 Payment
- `GET http://localhost:3001/api/payment/{role}/{id}/profile`
- `PUT http://localhost:3001/api/payment/{role}/{id}/profile`

---

## 🧪 Test with cURL

### Health Check
```bash
curl http://localhost:3001/health
```

### Request OTP
```bash
curl -X POST http://localhost:3001/api/auth/otp/request \
  -H "Content-Type: application/json" \
  -d '{"phone": "+919876543210", "purpose": "LOGIN"}'
```

### Get Products
```bash
curl http://localhost:3001/api/products
```

### Search Villages
```bash
curl "http://localhost:3001/api/location/lgd/villages/search?q=delhi"
```

---

## 📱 Postman Collection

Create a Postman collection with:
- **Base URL**: `http://localhost:3001`
- **Environment Variables**:
  - `base_url`: `http://localhost:3001`
  - `token`: `<jwt-token>` (after login)
  - `user_id`: `<user-uuid>` (after login)

---

## 🎯 Quick Test Sequence

1. **Health Check**: `http://localhost:3001/health`
2. **Get Products**: `http://localhost:3001/api/products`
3. **Search Villages**: `http://localhost:3001/api/location/lgd/villages/search?q=test`
4. **Request OTP**: Use Postman/cURL with POST request

---

**Note**: Most endpoints require authentication. Start with public endpoints, then login to get a token for protected endpoints.
