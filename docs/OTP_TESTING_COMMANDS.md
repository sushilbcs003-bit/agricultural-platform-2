# OTP Testing Commands

## For Buyer Login

### Step 1: Request OTP
```bash
curl -X POST http://localhost:3001/api/auth/login/buyer/request-otp \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+919768776656",
    "gst": "09AAACH7409R1ZR"
  }'
```

### Step 2: View OTP from Backend Logs
```bash
docker logs agricultural_backend | grep "Buyer OTP" | tail -1
```

Or to see all recent logs:
```bash
docker logs agricultural_backend --tail 50 | grep "OTP"
```

### Step 3: Verify OTP
```bash
curl -X POST http://localhost:3001/api/auth/login/buyer/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+919768776656",
    "gst": "09AAACH7409R1ZR",
    "otp": "123456"
  }'
```
*(Replace `123456` with the actual OTP from Step 2)*

---

## For Farmer Login

### Step 1: Request OTP
```bash
curl -X POST http://localhost:3001/api/auth/otp/request \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+919768776656",
    "purpose": "LOGIN"
  }'
```

### Step 2: View OTP from Backend Logs
```bash
docker logs agricultural_backend | grep "OTP for" | tail -1
```

### Step 3: Verify OTP
```bash
curl -X POST http://localhost:3001/api/auth/otp/verify \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+919768776656",
    "otp": "123456"
  }'
```
*(Replace `123456` with the actual OTP from Step 2)*

---

## For Supplier Login

### Step 1: Request OTP
```bash
curl -X POST http://localhost:3001/api/auth/login/supplier/request-otp \
  -H "Content-Type: application/json" \
  -d '{
    "gst": "09AAACH7409R1ZR"
  }'
```

### Step 2: View OTP from Backend Logs
```bash
docker logs agricultural_backend | grep "Supplier OTP" | tail -1
```

### Step 3: Verify OTP
```bash
curl -X POST http://localhost:3001/api/auth/login/supplier/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "gst": "09AAACH7409R1ZR",
    "otp": "123456"
  }'
```
*(Replace `123456` with the actual OTP from Step 2)*

---

## Quick One-Liner to Get Latest OTP

For Buyer:
```bash
docker logs agricultural_backend 2>&1 | grep "Buyer OTP" | tail -1 | grep -oP '\d{6}'
```

For Farmer:
```bash
docker logs agricultural_backend 2>&1 | grep "OTP for" | tail -1 | grep -oP '\d{6}'
```

For Supplier:
```bash
docker logs agricultural_backend 2>&1 | grep "Supplier OTP" | tail -1 | grep -oP '\d{6}'
```

---

## Watch Backend Logs in Real-Time

To see OTPs as they are generated:
```bash
docker logs -f agricultural_backend | grep --line-buffered "OTP"
```

Press `Ctrl+C` to stop watching.
