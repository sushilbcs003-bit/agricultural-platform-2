# 🚀 Quick API Testing

## Start Testing Now

### 1. Open in Browser (Public Endpoints)

**Health Check**:
```
http://localhost:3001/health
```

**Get Products**:
```
http://localhost:3001/api/products
```

**Search Villages**:
```
http://localhost:3001/api/location/lgd/villages/search?q=delhi
```

### 2. Test with cURL

```bash
# Health check
curl http://localhost:3001/health

# Get products
curl http://localhost:3001/api/products

# Request OTP
curl -X POST http://localhost:3001/api/auth/otp/request \
  -H "Content-Type: application/json" \
  -d '{"phone": "+919876543210", "purpose": "LOGIN"}'
```

### 3. Run Test Script

```bash
chmod +x TEST_ENDPOINTS.sh
./TEST_ENDPOINTS.sh
```

### 4. Use Postman

1. Import collection from `API_TESTING_GUIDE.md`
2. Set base URL: `http://localhost:3001`
3. Start testing!

---

**Full Documentation**: See `API_TESTING_GUIDE.md`
