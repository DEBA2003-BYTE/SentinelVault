# 🧪 SentinelVault Testing Guide

## Quick Start

### 1. Start Backend
```bash
cd backend
bun run dev
```

### 2. Start Frontend
```bash
cd frontend
bun run dev
```

## Test Scenarios

### ✅ Admin Login (No Device Restrictions)
**Email**: `admin@gmail.com`  
**Password**: `Debarghya`

**Expected Result**: 
- ✅ Login successful from any device
- ✅ No device authentication errors
- ✅ Token generated
- ✅ Can access admin features

### ✅ User Registration (No Restrictions)
**Test User**: Any email  
**Password**: Any password (min 8 characters)

**Expected Result**:
- ✅ Registration successful from any device
- ✅ No device authentication required
- ✅ Token generated
- ✅ User created in database

### ⚠️ User Login (Device Authentication Required)
**Test User**: Previously registered user  
**Password**: User's password

**Expected Result**:
- ✅ First login: Success (device registered)
- ⚠️ Different device: May fail with "Device authentication failed"
- ⚠️ Different location: May fail with "Location anomaly detected"

## Frontend Testing

### Login Page
1. Navigate to `http://localhost:5173/login`
2. Enter credentials
3. Click "Sign In"

**Admin Test**:
- Email: `admin@gmail.com`
- Password: `Debarghya`
- Should work from any device ✅

**Regular User Test**:
- Email: `test@example.com`
- Password: `password123`
- May require device authentication ⚠️

### Registration Page
1. Navigate to `http://localhost:5173/register`
2. Enter new email and password
3. Click "Sign Up"

**Expected**: Success from any device ✅

## API Testing

### Test Admin Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@gmail.com",
    "password": "Debarghya"
  }'
```

**Expected Response**:
```json
{
  "message": "Login successful",
  "token": "eyJhbGc...",
  "user": {
    "id": "...",
    "email": "admin@gmail.com",
    "isAdmin": true
  }
}
```

### Test User Registration
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "password123"
  }'
```

**Expected Response**:
```json
{
  "message": "User registered successfully",
  "token": "eyJhbGc...",
  "user": {
    "id": "...",
    "email": "newuser@example.com",
    "isAdmin": false
  }
}
```

### Test User Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "password123"
  }'
```

**Expected Response** (First Login):
```json
{
  "message": "Login successful",
  "token": "eyJhbGc...",
  "user": {
    "id": "...",
    "email": "newuser@example.com",
    "isAdmin": false
  }
}
```

**Expected Response** (Different Device):
```json
{
  "error": "Device authentication failed",
  "reason": "Unrecognized device or location..."
}
```

## Common Issues

### Issue: "ZKP generation failed"
**Solution**: ZKP is now disabled by default. This error should not appear.

### Issue: "Device authentication failed" for admin
**Solution**: Admin should bypass device authentication. Check that:
- Email is exactly `admin@gmail.com`
- User has `isAdmin: true` in database

### Issue: "Device authentication failed" for regular user
**Solution**: This is expected behavior for security. User must:
- Login from the same device they registered with
- Or register the new device

### Issue: Backend not starting
**Solution**: 
```bash
cd backend
bun install
bun run dev
```

### Issue: Frontend not connecting
**Solution**: Check that:
- Backend is running on port 3000
- Frontend is running on port 5173
- VITE_API_URL is set correctly in frontend/.env

## Health Check

```bash
curl http://localhost:3000/health
```

**Expected Response**:
```json
{
  "status": "OK",
  "services": {
    "api": "running",
    "mongodb": {
      "status": "connected"
    }
  }
}
```

## Features Removed

❌ Password reset functionality  
❌ Email service  
❌ PIN-based recovery  
❌ Automatic ZKP generation  

## Features Active

✅ Admin bypass for device authentication  
✅ Open registration (no device restrictions)  
✅ Device authentication for regular user login  
✅ Location-based security  
✅ Risk scoring  
✅ JWT authentication  