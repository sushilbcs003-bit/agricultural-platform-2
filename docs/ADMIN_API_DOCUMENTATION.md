# Admin API Documentation

## Overview
Comprehensive admin dashboard and management system for the Agricultural Platform.

## Authentication
All admin endpoints require authentication via Bearer token in the Authorization header:
```
Authorization: Bearer <admin_token>
```

**Note**: Currently uses simplified admin check. In production, implement proper JWT with role claims.

---

## 1. Dashboard

### GET `/api/admin/dashboard`
Get high-level platform health metrics.

**Response:**
```json
{
  "success": true,
  "data": {
    "users": {
      "total": {
        "buyers": 10,
        "farmers": 25,
        "suppliers": 5,
        "total": 40
      },
      "newRegistrations": {
        "today": 3,
        "week": 15
      },
      "active": {
        "dau": 20,
        "mau": 35
      }
    },
    "orders": {
      "createdToday": 5
    },
    "offers": {
      "createdToday": 12
    },
    "otp": {
      "successRate": 85.5,
      "total": 100,
      "successful": 85,
      "failed": 15
    },
    "pendingApprovals": {
      "products": 3,
      "machinery": 0,
      "transport": 0
    }
  }
}
```

---

## 2. Users Management

### GET `/api/admin/users/:role`
Get all users by role (BUYER, FARMER, SUPPLIER).

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 20)
- `status` (optional: active/inactive)
- `search` (optional: search by name, phone, email)

**Example:**
```
GET /api/admin/users/FARMER?page=1&limit=20&status=active&search=ravi
```

**Response:**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "uuid",
        "name": "Ravi Kumar",
        "phone": "+91******10",
        "email": "ra***@example.com",
        "role": "FARMER",
        "isActive": true,
        "phoneVerified": true,
        "emailVerified": false,
        "lastLogin": "2024-01-04T10:00:00Z",
        "createdAt": "2024-01-01T10:00:00Z",
        "profile": { ... }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "pages": 5
    }
  }
}
```

### GET `/api/admin/users/:role/:userId`
Get detailed user information (read-only).

**Response:** Includes full profile, stats (products, bids, orders).

### PATCH `/api/admin/users/:role/:userId/status`
Update user status.

**Body:**
```json
{
  "status": "active|suspended|blocked",
  "reason": "Violation of terms"
}
```

### POST `/api/admin/users/:role/:userId/force-logout`
Force logout user (invalidate all sessions).

**Body:**
```json
{
  "reason": "Security concern"
}
```

### PATCH `/api/admin/users/:role/:userId/verify`
Verify/Unverify user profile.

**Body:**
```json
{
  "verify": true,
  "reason": "Documents verified"
}
```

---

## 3. Authentication & OTP Logs

### GET `/api/admin/auth-logs`
Get OTP and authentication logs.

**Query Parameters:**
- `role` (optional: BUYER, FARMER, SUPPLIER)
- `purpose` (optional: LOGIN, REGISTRATION)
- `page` (default: 1)
- `limit` (default: 50)

**Response:**
```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "id": "uuid",
        "phone": "+91******10",
        "purpose": "LOGIN",
        "isUsed": true,
        "attempts": 1,
        "role": "FARMER",
        "createdAt": "2024-01-04T10:00:00Z",
        "expiresAt": "2024-01-04T10:10:00Z"
      }
    ],
    "pagination": { ... },
    "stats": {
      "total": 100,
      "successful": 85,
      "failed": 15
    }
  }
}
```

**Note**: Phone numbers are masked for privacy. OTP codes are never shown.

---

## 4. Products & Listings Management

### GET `/api/admin/products`
Get all products with filtering.

**Query Parameters:**
- `status` (optional: ACTIVE, SOLD, CANCELLED)
- `role` (optional: filter by farmer role)
- `page` (default: 1)
- `limit` (default: 50)

### PATCH `/api/admin/products/:productId/status`
Update product status.

**Body:**
```json
{
  "status": "ACTIVE|SOLD|CANCELLED",
  "reason": "Invalid pricing"
}
```

---

## 5. Offers Management

### GET `/api/admin/offers`
Get all offers/bids.

**Query Parameters:**
- `status` (optional: SUBMITTED, ACCEPTED, REJECTED)
- `page` (default: 1)
- `limit` (default: 50)

**Response:** Includes buyer info, product info, farmer info (all PII masked).

---

## 6. Orders Management

### GET `/api/admin/orders`
Get all orders.

**Query Parameters:**
- `status` (optional: PENDING, CONFIRMED, DELIVERED, CANCELLED)
- `page` (default: 1)
- `limit` (default: 50)

### PATCH `/api/admin/orders/:orderId/cancel`
Cancel an order.

**Body:**
```json
{
  "reason": "Customer request"
}
```

---

## 7. Machinery Management

### GET `/api/admin/machinery`
Get all machinery listings.

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 50)

**Response:** Includes supplier info (PII masked).

---

## 8. Transport Management

### GET `/api/admin/transport`
Get all transport listings.

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 50)

**Response:** Includes supplier info (PII masked).

---

## 9. Quality Test Results

### GET `/api/admin/quality-tests`
Get all quality test results.

**Query Parameters:**
- `status` (optional: SCHEDULED, COMPLETED, CANCELLED)
- `page` (default: 1)
- `limit` (default: 50)

### PATCH `/api/admin/quality-tests/:testResultId/verify`
Verify or flag a test result.

**Body:**
```json
{
  "verify": true,
  "reason": "Test results verified by lab"
}
```

---

## 10. Audit Logs

### GET `/api/admin/audit-logs`
Get all admin action audit logs.

**Query Parameters:**
- `action` (optional: filter by action)
- `entityType` (optional: USER, PRODUCT, ORDER, etc.)
- `adminId` (optional: filter by admin)
- `userId` (optional: filter by affected user)
- `page` (default: 1)
- `limit` (default: 50)

**Response:**
```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "id": "uuid",
        "action": "UPDATE_USER_STATUS_SUSPENDED",
        "entityType": "USER",
        "entityId": "user-uuid",
        "role": "FARMER",
        "admin": {
          "id": "admin-uuid",
          "name": "Admin User",
          "email": "ad***@example.com"
        },
        "user": {
          "id": "user-uuid",
          "name": "Ravi Kumar",
          "role": "FARMER"
        },
        "oldValues": { "isActive": true },
        "newValues": { "isActive": false },
        "reason": "Violation of terms",
        "ipAddress": "192.168.1.1",
        "createdAt": "2024-01-04T10:00:00Z"
      }
    ],
    "pagination": { ... }
  }
}
```

---

## Security Features

1. **PII Masking**: All phone numbers and emails are masked in responses
2. **Audit Logging**: Every admin action is logged with:
   - Admin ID
   - Action type
   - Entity affected
   - Old/New values
   - Reason
   - IP address
   - Timestamp
3. **Role-based Access**: Currently checks for ADMIN role (can be extended to RBAC)

---

## Implementation Notes

1. **Admin Authentication**: Currently simplified. In production:
   - Implement proper JWT with role claims
   - Add session management
   - Implement rate limiting for admin endpoints
   - Add IP whitelisting for sensitive operations

2. **RBAC**: Can be extended with:
   - Super Admin
   - Ops Admin
   - Support Admin
   - Finance Admin
   - Auditor (read-only)

3. **Analytics**: Additional analytics endpoints can be added for:
   - Funnel analytics
   - Conversion rates
   - Fraud detection
   - Role-based metrics

4. **Export**: Add CSV/Excel export functionality for audit logs and reports

---

## Error Responses

All endpoints return errors in this format:
```json
{
  "success": false,
  "error": {
    "message": "Error description"
  }
}
```

Common HTTP status codes:
- `401`: Unauthorized (missing/invalid token)
- `403`: Forbidden (insufficient permissions)
- `404`: Not found
- `500`: Internal server error


