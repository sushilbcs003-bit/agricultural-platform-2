# 🔐 Admin Portal Setup

## ✅ Admin Login Endpoint Fixed

The admin login endpoint has been created and registered:
- **Endpoint**: `POST /api/admin/auth/login`
- **URL**: `http://localhost:3001/api/admin/auth/login`

## 📋 Admin Login Details

### Default Admin Credentials

**Email**: `admin@agricultural-platform.com`  
**Password**: `admin123`

⚠️ **Important**: Change the password after first login!

## 🚀 Create Admin User

### Option 1: Using Script (Recommended)

```bash
cd backend
node src/scripts/create-admin.js
```

### Option 2: Manual Creation

The admin user will be created automatically when you first try to login, or you can create it manually in the database.

### Option 3: Using Environment Variables

```bash
ADMIN_EMAIL=admin@example.com \
ADMIN_PASSWORD=securepassword \
ADMIN_NAME="Admin User" \
node backend/src/scripts/create-admin.js
```

## 🧪 Test Admin Login

### Using cURL

```bash
curl -X POST http://localhost:3001/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@agricultural-platform.com",
    "password": "admin123"
  }'
```

### Using Postman

1. **Method**: POST
2. **URL**: `http://localhost:3001/api/admin/auth/login`
3. **Headers**: `Content-Type: application/json`
4. **Body**:
```json
{
  "email": "admin@agricultural-platform.com",
  "password": "admin123"
}
```

### Expected Response

```json
{
  "success": true,
  "admin": {
    "id": "admin-uuid",
    "role": "ADMIN",
    "email": "admin@agricultural-platform.com",
    "name": "Admin User",
    "isActive": true
  },
  "token": "jwt_token_here",
  "message": "Admin login successful"
}
```

## 📊 Admin Dashboard Endpoint

### GET /api/admin/dashboard

**URL**: `http://localhost:3001/api/admin/dashboard`  
**Method**: GET  
**Auth**: Required (Bearer token)

**Headers**:
```
Authorization: Bearer <admin-token>
```

**Response**:
```json
{
  "success": true,
  "data": {
    "users": {
      "total": 100,
      "farmers": 50,
      "buyers": 30,
      "suppliers": 20
    },
    "products": {
      "total": 500
    },
    "bids": {
      "total": 200
    },
    "orders": {
      "total": 150
    }
  }
}
```

## 🔧 Admin Routes

### Authentication
- `POST /api/admin/auth/login` - Admin login

### Dashboard
- `GET /api/admin/dashboard` - Get dashboard statistics

## 🎯 Next Steps

1. **Create Admin User**: Run the create-admin script
2. **Test Login**: Use the admin credentials to login
3. **Access Dashboard**: Use the token to access admin dashboard
4. **Change Password**: Update admin password for security

## 🐛 Troubleshooting

### "Invalid email or password"
- **Solution**: Make sure admin user exists and password is correct
- **Fix**: Run `node backend/src/scripts/create-admin.js`

### "API endpoint not found"
- **Solution**: Make sure backend server is running
- **Fix**: Restart backend server

### "Unauthorized" on dashboard
- **Solution**: Include Bearer token in Authorization header
- **Fix**: Use the token from login response

---

**Status**: ✅ Admin endpoints created and ready  
**Last Updated**: January 2024
