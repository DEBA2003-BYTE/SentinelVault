# 🔐 SentinelVault Authentication Rules

## Overview
This document outlines the authentication and device verification rules for SentinelVault.

## Authentication Rules

### 1. **Admin Account (admin@gmail.com)**
- ✅ **All devices allowed** - No device authentication required
- ✅ **All locations allowed** - No location verification
- ✅ **Fixed password** - Can use password from .env file
- 🎯 **Purpose**: Administrative access from any device/location

### 2. **User Registration (Sign Up)**
- ✅ **All users allowed** - No restrictions
- ✅ **No device authentication** - Can register from any device
- ✅ **No location verification** - Can register from any location
- 📝 **Device info stored** - For future reference only
- 🎯 **Purpose**: Easy onboarding for new users

### 3. **User Login (Sign In) - Non-Admin**
- ⚠️ **Device authentication required**
- ⚠️ **Location verification required**
- 🔒 **Must match registered device/location**
- ❌ **Blocked if device not recognized**
- ❌ **Blocked if location anomaly detected**
- 🎯 **Purpose**: Enhanced security for regular user accounts

## Implementation Details

### Admin Bypass Logic
```typescript
// In login route - Skip device authentication for admin
if (!user.isAdmin && req.deviceInfo && !req.deviceInfo.isRecognized) {
  // Block non-admin users with unrecognized devices
  return res.status(403).json({ error: 'Device authentication failed' });
}
// Admin users bypass this check
```

### Registration Flow
```typescript
// No device authentication middleware
router.post('/register', checkDatabaseConnection, assessRisk, async (req, res) => {
  // All users can register without device restrictions
});
```

### Login Flow
```typescript
// Device authentication middleware active
router.post('/login', checkDatabaseConnection, deviceAuthentication, logDeviceAccess, assessRisk, async (req, res) => {
  // Admin: bypass device check
  // Regular users: enforce device authentication
});
```

## Security Features

### For Admin
- Fixed credentials in environment variables
- Unrestricted access from any device/location
- Higher risk tolerance (70 vs 50 for regular users)

### For Regular Users
- Device fingerprinting
- Location-based authentication
- Risk scoring
- Automatic blocking on device mismatch
- Automatic blocking on location anomaly

## Removed Features
- ❌ Password reset functionality
- ❌ Email service integration
- ❌ PIN-based password recovery
- ❌ SMTP configuration

## Testing

### Test Admin Login (Any Device)
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@gmail.com","password":"Debarghya"}'
```

### Test User Registration (No Restrictions)
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'
```

### Test User Login (Device Auth Required)
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'
```

## Configuration

### Environment Variables
```env
ADMIN_EMAIL=admin@gmail.com
ADMIN_PASSWORD=Debarghya
```

### No Email Configuration Needed
Email service has been completely removed from the system.