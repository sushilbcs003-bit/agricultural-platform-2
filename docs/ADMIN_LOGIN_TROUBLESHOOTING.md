# 🔍 Admin Login Troubleshooting

## ✅ Backend Updated

The backend has been updated to:
- Trim whitespace from email and password
- Normalize email to lowercase
- Add logging for debugging

## 🔐 Correct Credentials

**Email**: `admin@agricultural-platform.com` (no spaces)  
**Password**: `admin123` (exactly as shown)

## 🧪 Test the Endpoint

### Test 1: Direct API Call
```bash
curl -X POST http://localhost:3001/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@agricultural-platform.com","password":"admin123"}'
```

**Expected Response**:
```json
{
  "success": true,
  "admin": {
    "id": "admin_001",
    "role": "ADMIN",
    "email": "admin@agricultural-platform.com",
    "name": "Admin User",
    "isActive": true
  },
  "token": "jwt_token_admin_...",
  "message": "Admin login successful"
}
```

### Test 2: Check Backend Logs
```bash
docker compose logs backend --tail 20
```

Look for:
- `🔐 Admin login attempt:` - Shows what email/password was received
- `✅ Admin login successful` - Login worked
- `❌ Admin login failed` - Login failed

## 🔍 Common Issues

### Issue 1: Extra Spaces
**Problem**: Email or password has leading/trailing spaces  
**Solution**: Backend now trims whitespace automatically

### Issue 2: Case Sensitivity
**Problem**: Email case mismatch  
**Solution**: Backend now normalizes email to lowercase

### Issue 3: Wrong Credentials
**Problem**: Typo in email or password  
**Solution**: Double-check credentials:
- Email: `admin@agricultural-platform.com`
- Password: `admin123`

### Issue 4: CORS Issues
**Problem**: Browser blocking request  
**Solution**: Check browser console for CORS errors

### Issue 5: Frontend Not Updated
**Problem**: Frontend using old code  
**Solution**: Rebuild frontend:
```bash
docker compose build frontend
docker compose up -d frontend
```

## 🛠️ Debug Steps

### Step 1: Check Backend is Running
```bash
curl http://localhost:3001/health
```

### Step 2: Test Admin Endpoint Directly
```bash
curl -X POST http://localhost:3001/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@agricultural-platform.com","password":"admin123"}'
```

### Step 3: Check Backend Logs
```bash
docker compose logs backend --tail 30
```

### Step 4: Check Browser Console
1. Open http://localhost:3002
2. Open DevTools (F12)
3. Go to Console tab
4. Try login
5. Check for errors

### Step 5: Check Network Tab
1. Open DevTools (F12)
2. Go to Network tab
3. Try login
4. Click on `/api/admin/auth/login` request
5. Check:
   - Request payload (what was sent)
   - Response (what was received)
   - Status code

## 📝 What to Check in Browser

### Request Payload
Should be:
```json
{
  "email": "admin@agricultural-platform.com",
  "password": "admin123"
}
```

### Response
Should be:
```json
{
  "success": true,
  "admin": {...},
  "token": "...",
  "message": "Admin login successful"
}
```

## 🔧 If Still Not Working

### Option 1: Restart Backend
```bash
docker compose restart backend
```

### Option 2: Rebuild Backend
```bash
docker compose build backend
docker compose up -d backend
```

### Option 3: Check Container Logs
```bash
docker compose logs backend
```

### Option 4: Verify File Updated
```bash
docker exec agricultural_backend cat /app/index.js | grep -A 5 "Admin login attempt"
```

---

**Status**: Backend updated with improved validation  
**Ready**: ✅ Yes  
**Next**: Test login in browser
