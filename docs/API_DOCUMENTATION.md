# Agricultural Platform API Documentation

## Overview

The Agricultural Platform API provides comprehensive endpoints for connecting Farmers, Buyers, and Service Providers in a unified agricultural ecosystem. The API supports multilingual operations (English/Hindi), real-time bidding, quality testing, transport booking, and secure payment processing.

## Base URLs

- **Development**: `http://localhost:3001/api`
- **Production**: `https://api.agricultural-platform.com/api`
- **GraphQL**: `http://localhost:3001/graphql`

## Authentication

The API uses JWT (JSON Web Token) based authentication with role-based access control.

### Token Format
```
Authorization: Bearer <your-jwt-token>
```

### Roles
- `FARMER`: Can manage products, view bids, book services
- `BUYER`: Can browse products, place bids, make payments
- `PROVIDER`: Can manage service listings, accept bookings
- `ADMIN`: Full system access

## Core Endpoints

### Authentication Endpoints

#### Request OTP
```http
POST /auth/otp/request
Content-Type: application/json

{
  "phone": "+919876543210"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP sent successfully",
  "expires_in": 600
}
```

#### Verify OTP
```http
POST /auth/otp/verify
Content-Type: application/json

{
  "phone": "+919876543210",
  "otp": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "role": "FARMER",
    "name": "Rajesh Kumar",
    "phone": "+919876543210"
  }
}
```

#### Register Farmer
```http
POST /auth/register/farmer
Content-Type: application/json

{
  "phone": "+919876543210",
  "name": "Rajesh Kumar",
  "aadhaar": "123456789012",
  "district": "Ludhiana",
  "state": "Punjab",
  "village": "Khanna",
  "land_area_value": 5.5,
  "land_area_unit": "HECTARE"
}
```

#### Register Buyer
```http
POST /auth/register/buyer
Content-Type: application/json

{
  "gst": "07AABCF1234M1Z5",
  "business_name": "Fresh Mart Foods",
  "email": "buyer@freshmart.com",
  "password": "SecurePassword123!",
  "phone": "+919876543220",
  "contact_person": "Suresh Gupta"
}
```

### Product Management

#### Create Product (Farmer)
```http
POST /products
Authorization: Bearer <farmer-token>
Content-Type: multipart/form-data

{
  "name_en": "Premium Wheat",
  "name_hi": "प्रीमियम गेहूं",
  "category_id": "uuid",
  "quantity": 100,
  "unit": "Quintal",
  "expected_price": 2500,
  "description_en": "High quality wheat",
  "harvest_date": "2024-04-15",
  "images": [file1, file2]
}
```

#### Browse Products
```http
GET /products?page=1&limit=20&category=wheat&state=Punjab&min_price=2000&max_price=3000
```

**Response:**
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": "uuid",
        "name_en": "Premium Wheat",
        "name_hi": "प्रीमियम गेहूं",
        "farmer": {
          "id": "uuid",
          "name": "Rajesh Kumar",
          "district": "Ludhiana",
          "state": "Punjab"
        },
        "quantity": 100,
        "unit": "Quintal",
        "expected_price": 2500,
        "images": ["url1", "url2"],
        "status": "ACTIVE",
        "created_at": "2024-04-10T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "total_pages": 8
    }
  }
}
```

### Bidding System

#### Place Bid
```http
POST /bids
Authorization: Bearer <buyer-token>
Content-Type: application/json

{
  "product_id": "uuid",
  "offered_price": 2400,
  "quantity": 50,
  "message": "Interested in bulk purchase"
}
```

#### Get Buyer's Selected Items
```http
GET /buyers/me/selected
Authorization: Bearer <buyer-token>
```

#### Counter Bid (Farmer)
```http
POST /bids/uuid/counter
Authorization: Bearer <farmer-token>
Content-Type: application/json

{
  "counter_price": 2450,
  "message": "Final offer for bulk quantity"
}
```

### Payment Processing

#### Create Payment Intent
```http
POST /payments/create-intent
Authorization: Bearer <buyer-token>
Content-Type: application/json

{
  "selection_ids": ["uuid1", "uuid2"],
  "payment_method": "razorpay"
}
```

**Response:**
```json
{
  "success": true,
  "payment_intent": {
    "id": "uuid",
    "amount": 125000,
    "currency": "INR",
    "razorpay_order_id": "order_xyz123",
    "key_id": "rzp_test_key"
  }
}
```

#### Confirm Payment
```http
POST /payments/confirm
Authorization: Bearer <buyer-token>
Content-Type: application/json

{
  "payment_id": "uuid",
  "razorpay_payment_id": "pay_xyz123",
  "razorpay_signature": "signature_hash"
}
```

### Quality Testing

#### Schedule Test
```http
POST /tests/schedule
Authorization: Bearer <buyer-token>
Content-Type: application/json

{
  "product_id": "uuid",
  "payment_id": "uuid",
  "test_provider_id": "uuid",
  "preferred_date": "2024-04-20",
  "special_instructions": "Test for organic certification"
}
```

#### Upload Test Results (Provider)
```http
POST /tests/uuid/results
Authorization: Bearer <provider-token>
Content-Type: multipart/form-data

{
  "ai_analysis": true,
  "test_images": [file1, file2],
  "lab_results": {
    "moisture_content": 12.5,
    "protein_content": 11.8
  }
}
```

#### Get Test Results
```http
GET /tests/uuid/results
Authorization: Bearer <buyer-token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "test_id": "uuid",
    "quality_score": 85,
    "grade": "A",
    "defects": [
      {
        "type": "minor_discoloration",
        "severity": 0.2,
        "confidence": 0.8
      }
    ],
    "recommendations": [
      "Excellent quality for premium markets",
      "Store in cool, dry conditions"
    ],
    "price_adjustment": 5.0,
    "confidence_score": 88,
    "test_images": ["url1", "url2"],
    "created_at": "2024-04-20T14:30:00Z"
  }
}
```

### Transport & Machinery

#### Get Transport Listings
```http
GET /transport?coverage_area=Ludhiana&vehicle_type=truck&date=2024-04-25
```

#### Book Transport
```http
POST /bookings/transport
Authorization: Bearer <buyer-token>
Content-Type: application/json

{
  "listing_id": "uuid",
  "product_ids": ["uuid1", "uuid2"],
  "pickup_location": "Farm Address, Ludhiana",
  "delivery_location": "Warehouse, Delhi",
  "pickup_date": "2024-04-25",
  "special_instructions": "Handle with care"
}
```

#### Get Machinery Listings
```http
GET /machinery?type=tractor&coverage_area=Ludhiana&available_date=2024-04-20
```

### Provider Management

#### Register as Multi-Category Provider
```http
POST /providers/register
Authorization: Bearer <user-token>
Content-Type: application/json

{
  "provider_types": ["TEST", "TRANSPORT"],
  "organization_name": "AgriServices Ltd",
  "business_address": "Industrial Area, Ludhiana",
  "gst_number": "03AABCA1234M1Z5",
  "coverage_areas": ["Ludhiana", "Patiala"],
  "license_documents": ["doc_url1", "doc_url2"]
}
```

#### Provider Dashboard
```http
GET /providers/me/dashboard
Authorization: Bearer <provider-token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "provider_types": ["TEST", "TRANSPORT"],
    "pending_requests": 5,
    "active_bookings": 12,
    "earnings": {
      "this_month": 45000,
      "last_month": 38000
    },
    "rating": 4.7,
    "total_services": 156
  }
}
```

### Admin Endpoints

#### Get System Statistics
```http
GET /admin/stats
Authorization: Bearer <admin-token>
```

#### Manage Product Categories
```http
POST /admin/categories
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "name_en": "Organic Vegetables",
  "name_hi": "जैविक सब्जियां",
  "parent_id": "uuid"
}
```

## GraphQL API

### Example Queries

#### Get Products with Farmer Details
```graphql
query GetProducts($filter: ProductFilter) {
  products(filter: $filter) {
    id
    nameEn
    nameHi
    quantity
    unit
    expectedPrice
    status
    farmer {
      id
      name
      profile {
        district
        state
        village
      }
    }
    category {
      nameEn
      nameHi
    }
    images
  }
}
```

#### Get Buyer Dashboard Data
```graphql
query BuyerDashboard {
  me {
    id
    name
    role
    bids {
      id
      offeredPrice
      status
      product {
        nameEn
        farmer {
          name
        }
      }
    }
    orders {
      id
      status
      totalAmount
    }
  }
}
```

### Mutations

#### Place Bid
```graphql
mutation PlaceBid($input: BidInput!) {
  placeBid(input: $input) {
    id
    offeredPrice
    status
    product {
      nameEn
      farmer {
        name
      }
    }
  }
}
```

## Error Handling

### Error Response Format
```json
{
  "success": false,
  "message": "Validation failed",
  "code": "VALIDATION_ERROR",
  "errors": [
    {
      "field": "phone",
      "message": "Phone number is required"
    }
  ],
  "timestamp": "2024-04-10T10:00:00Z"
}
```

### Common Error Codes
- `AUTHENTICATION_FAILED` (401)
- `AUTHORIZATION_ERROR` (403)
- `VALIDATION_ERROR` (400)
- `NOT_FOUND` (404)
- `CONFLICT_ERROR` (409)
- `RATE_LIMIT_ERROR` (429)
- `INTERNAL_ERROR` (500)

## Rate Limiting

- **General API**: 100 requests per 15 minutes per IP
- **Authentication**: 5 requests per 15 minutes per IP
- **File Upload**: 10 uploads per hour per user

## Webhooks

### Payment Confirmation
```http
POST /webhooks/payment
Content-Type: application/json

{
  "event": "payment.captured",
  "payment_id": "uuid",
  "razorpay_payment_id": "pay_xyz123",
  "amount": 125000,
  "status": "captured"
}
```

### AI Analysis Complete
```http
POST /webhooks/ai-analysis
Content-Type: application/json

{
  "event": "analysis.completed",
  "test_id": "uuid",
  "quality_score": 85,
  "grade": "A"
}
```

## Business Rules

1. **Negotiation Limit**: Maximum 2 rounds of counter-offers
2. **OTP Validity**: 10 minutes
3. **Bid Expiry**: 24 hours from creation
4. **Payment Timeout**: 30 minutes for payment completion
5. **Test Scheduling**: Only for paid products
6. **GST Immutability**: GST cannot be changed after registration
7. **Phone/Aadhaar Uniqueness**: No duplicate registrations allowed

## Status Codes

### Product Status
- `ACTIVE`: Available for bidding
- `UNDER_BID`: Has active bids
- `SOLD`: Transaction completed
- `CANCELLED`: Removed from market

### Bid Status
- `SUBMITTED`: Initial bid placed
- `SELECTED`: Automatically moved to buyer's cart
- `ACCEPTED`: Farmer accepted the bid
- `REJECTED`: Farmer rejected the bid
- `COUNTERED`: Farmer made counter-offer

### Order Status
- `PENDING`: Order created, awaiting confirmation
- `CONFIRMED`: Order confirmed by all parties
- `IN_TRANSIT`: Product being transported
- `DELIVERED`: Order completed
- `CANCELLED`: Order cancelled

## Integration Examples

### React Frontend Integration
```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3001/api',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
});

// Place a bid
const placeBid = async (productId, price, quantity) => {
  try {
    const response = await api.post('/bids', {
      product_id: productId,
      offered_price: price,
      quantity: quantity
    });
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};
```

### Mobile App Integration
```javascript
// React Native with Expo
import * as ImagePicker from 'expo-image-picker';

const uploadProductImages = async (productId, images) => {
  const formData = new FormData();
  
  images.forEach((image, index) => {
    formData.append('images', {
      uri: image.uri,
      type: 'image/jpeg',
      name: `product_${index}.jpg`
    });
  });

  const response = await fetch(`${API_BASE}/products/${productId}/images`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'multipart/form-data'
    },
    body: formData
  });
  
  return response.json();
};
```

## Testing

### Postman Collection
Import the provided Postman collection for comprehensive API testing:
- Authentication flows
- CRUD operations
- File uploads
- Error scenarios

### Test Data
Use the provided seed data for testing:
- Sample farmers, buyers, providers
- Product categories in EN/HI
- Mock payment scenarios
- Test AI analysis results

## Support

For API support and integration assistance:
- Email: api-support@agricultural-platform.com
- Documentation: https://docs.agricultural-platform.com
- GitHub Issues: https://github.com/agricultural-platform/api/issues
