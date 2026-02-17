# Truncate User Data

This document explains how to clear all user-entered data from the in-memory database.

## ⚠️ Warning

This operation will **permanently delete** all user-entered data including:
- All registered users (farmers, buyers, providers)
- All OTPs
- All products
- All offers
- All orders
- All test results
- All machinery listings
- All transport listings
- All test providers
- All bids
- All suppliers
- All lands

**This action cannot be undone!**

## Methods to Truncate Data

### Method 1: Using the Script (Recommended)

```bash
./truncate-data.sh
```

### Method 2: Using cURL

```bash
curl -X DELETE http://localhost:3001/api/admin/truncate-all
```

### Method 3: Using Browser/Postman

1. Open your browser or Postman
2. Make a DELETE request to: `http://localhost:3001/api/admin/truncate-all`
3. No authentication required (for development only)

## Response

On success, you'll receive:

```json
{
  "success": true,
  "message": "All user-entered data has been truncated successfully",
  "truncated": {
    "users": 0,
    "otps": 0,
    "products": 0,
    "offers": 0,
    "orders": 0,
    "testResults": 0,
    "machinery": 0,
    "transport": 0,
    "testProviders": 0,
    "bids": 0,
    "suppliers": 0,
    "lands": 0
  }
}
```

## Notes

- This only clears **user-entered data**
- Mock/reference data (like LGD villages) is **not** affected
- The backend must be running for this to work
- After truncation, you'll need to re-register users and add data again

## Use Cases

- Development/testing: Reset the database to a clean state
- Demo preparation: Clear test data before a demo
- Troubleshooting: Start fresh when debugging data-related issues



