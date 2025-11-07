# Testing Device & Location Auto-Assignment

## Test Steps

### 1. Test Registration with Device Fingerprint

**Start the servers:**
```bash
./start-all.sh
```

**Test Registration:**
1. Open browser to `http://localhost:5173/register`
2. Fill in registration form:
   - Email: `testuser@example.com`
   - Password: `password123`
   - Confirm Password: `password123`
3. Click "Create Account"
4. **Expected**: Registration succeeds and device fingerprint is automatically captured

**Verify in Database:**
```bash
# Connect to MongoDB
mongosh mongodb://localhost:27017/zkp-cloud-storage

# Check the user
db.users.findOne({ email: "testuser@example.com" })
```

**Expected Output:**
```javascript
{
  _id: ObjectId("..."),
  email: "testuser@example.com",
  deviceFingerprint: "a1b2c3d4e5f6g7h8...", // Should NOT be "unknown"
  registeredLocation: "New York, US", // Or "Unknown" if geolocation unavailable
  lastKnownLocation: "New York, US",
  lastDeviceFingerprint: "a1b2c3d4e5f6g7h8...",
  // ... other fields
}
```

### 2. Test Device & Identity Status Card

1. Login with the test user
2. Go to Dashboard
3. Look at the right side for "Device & Identity Status" card

**Expected Display:**
```
┌─────────────────────────────────────┐
│ 🛡️ Device & Identity Status         │
├─────────────────────────────────────┤
│ Registered Device                   │
│ 📱 Device Fingerprint:              │
│    a1b2c3d4e5f6g7h8...              │
│ 📍 Location:                        │
│    New York, US                     │
│                                     │
│ ✗ ZKP Not Verified                  │
│   Optional: Complete ZKP            │
│   verification for enhanced         │
│   security                          │
└─────────────────────────────────────┘
```

**Key Points:**
- ✅ Device fingerprint is ALWAYS shown (not "Identity Not Verified")
- ✅ Location is ALWAYS shown
- ✅ ZKP status is shown below as optional

### 3. Test Admin View of User Emails

1. Login as admin:
   - Email: `admin@example.com`
   - Password: `admin123`

2. Go to Admin Dashboard

**Test Registered Users Tab:**
1. Click "👥 Registered Users" tab
2. **Expected**: See table with columns:
   - Email (shows full email addresses)
   - Role (Admin/User)
   - Device Fingerprint (first 12 chars + "...")
   - Registered Location
   - Registered At
   - Last Login

**Test Access Logs Tab:**
1. Click "📋 Access Logs" tab
2. **Expected**: See table with "User Email" column showing full email addresses
3. Email should be styled in brand color and bold

### 4. Test Registration Without Device Fingerprint (Error Case)

**Simulate missing device fingerprint:**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "nodevice@example.com",
    "password": "password123"
  }'
```

**Expected Response:**
```json
{
  "error": "Device fingerprint is required",
  "message": "Please enable JavaScript and allow device fingerprinting for registration"
}
```

## Success Criteria

✅ Device fingerprint is automatically captured during registration
✅ Device fingerprint is never "unknown" (registration fails if missing)
✅ Location is captured (or set to "Unknown" if unavailable)
✅ Dashboard shows device info prominently in "Device & Identity Status" card
✅ Admin can see all user emails in both Users and Logs tabs
✅ No more confusing "Identity Not Verified" message for device info

## Troubleshooting

**If device fingerprint is still "unknown":**
1. Check browser console for errors
2. Ensure JavaScript is enabled
3. Check that `deviceFingerprint.ts` is working correctly
4. Verify the registration form is sending device info

**If admin can't see emails:**
1. Verify admin is logged in (check `user.isAdmin` in console)
2. Check network tab for API responses
3. Verify backend is returning email in audit logs

**If location is "Unknown":**
- This is normal if geolocation is blocked or unavailable
- The system will still work, just showing "Unknown" as location
