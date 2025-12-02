# Test: Unblock Resets Failed Attempts to Zero

## Overview
This test verifies that when an admin unblocks a user, the failed attempt counter is completely reset to 0, allowing the user to login normally.

## Test Flow

### Step 1: Create Test User and Make 5 Failed Attempts
```bash
# 1. Register a test user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "resettest@example.com",
    "password": "CorrectPassword123!",
    "location": {
      "type": "Point",
      "coordinates": [77.5946, 12.9716],
      "name": "Bangalore"
    }
  }'

# 2. Make 5 failed login attempts (wrong password)
for i in {1..5}; do
  echo "Failed attempt $i"
  curl -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{
      "email": "resettest@example.com",
      "password": "WrongPassword123!",
      "location": {
        "type": "Point",
        "coordinates": [77.5946, 12.9716]
      }
    }'
  sleep 1
done
```

**Expected Result:**
- User should be blocked after 5 failed attempts
- Response should show: `"status": "blocked"`

### Step 2: Verify User is Blocked
```bash
# Try to login with CORRECT password
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "resettest@example.com",
    "password": "CorrectPassword123!",
    "location": {
      "type": "Point",
      "coordinates": [77.5946, 12.9716]
    }
  }'
```

**Expected Result:**
- Should return 403 status
- Message: "You have been blocked"
- Even with correct password, login is denied

### Step 3: Check Database - Failed Attempts Count
```javascript
// In MongoDB shell or Compass
use your_database_name;

// Find the user
const user = db.users.findOne({ email: "resettest@example.com" });
console.log("User ID:", user._id);
console.log("Is Blocked:", user.isBlocked);

// Count failed attempts
const failedCount = db.riskevents.countDocuments({
  userId: user._id,
  action: "failed-password"
});
console.log("Failed Attempts Count:", failedCount);
```

**Expected Result:**
- `isBlocked: true`
- `failedCount: 5`

### Step 4: Admin Unblocks User
```bash
# First, login as admin to get token
ADMIN_TOKEN=$(curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@gmail.com",
    "password": "admin123"
  }' | jq -r '.token')

# Get user ID
USER_ID=$(curl -X GET http://localhost:3000/api/admin/users \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq -r '.users[] | select(.email=="resettest@example.com") | .id')

# Unblock the user
curl -X POST "http://localhost:3000/api/admin/users/$USER_ID/block" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"blocked": false}'
```

**Expected Result:**
- Response: `"message": "User unblocked successfully"`
- Response includes: `"failedAttemptsReset": true`
- Console log: `"✅ RESET: Cleared 5 failed attempts for user resettest@example.com - Counter now at 0"`

### Step 5: Verify Failed Attempts Reset in Database
```javascript
// In MongoDB shell or Compass
const user = db.users.findOne({ email: "resettest@example.com" });

// Count failed attempts AFTER unblock
const failedCountAfter = db.riskevents.countDocuments({
  userId: user._id,
  action: "failed-password"
});

console.log("User Is Blocked:", user.isBlocked);
console.log("Failed Attempts After Unblock:", failedCountAfter);
console.log("Lock Reason:", user.lockReason);
```

**Expected Result:**
- `isBlocked: false`
- `failedCountAfter: 0` ← **CRITICAL: Must be 0**
- `lockReason: undefined` or `null`

### Step 6: User Can Login Normally
```bash
# Try to login with correct password
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "resettest@example.com",
    "password": "CorrectPassword123!",
    "location": {
      "type": "Point",
      "coordinates": [77.5946, 12.9716]
    }
  }'
```

**Expected Result:**
- Status: 200 OK
- Response includes: `"status": "ok"`
- Response includes: `"token": "..."`
- User can access the system normally

### Step 7: Test Fresh Failed Attempts Counter
```bash
# Make 3 failed attempts with wrong password
for i in {1..3}; do
  echo "New failed attempt $i"
  curl -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{
      "email": "resettest@example.com",
      "password": "WrongPassword456!",
      "location": {
        "type": "Point",
        "coordinates": [77.5946, 12.9716]
      }
    }'
  sleep 1
done

# Check count
```

**Expected Result:**
- Counter should be at 3 (not 8)
- User should NOT be blocked yet
- Can still login with correct password

### Step 8: Verify Counter Continues from 0
```javascript
// In MongoDB
const user = db.users.findOne({ email: "resettest@example.com" });
const newFailedCount = db.riskevents.countDocuments({
  userId: user._id,
  action: "failed-password"
});

console.log("New Failed Attempts Count:", newFailedCount);
console.log("User Is Blocked:", user.isBlocked);
```

**Expected Result:**
- `newFailedCount: 3` (only the new attempts)
- `isBlocked: false` (not blocked yet)

### Step 9: Test Re-blocking After 5 New Attempts
```bash
# Make 2 more failed attempts (total will be 5)
for i in {4..5}; do
  echo "Failed attempt $i"
  curl -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{
      "email": "resettest@example.com",
      "password": "WrongPassword789!",
      "location": {
        "type": "Point",
        "coordinates": [77.5946, 12.9716]
      }
    }'
  sleep 1
done
```

**Expected Result:**
- After 5th attempt, user should be blocked again
- Response: `"status": "blocked"`

## Success Criteria

✅ **All checks must pass:**

1. After 5 failed attempts → User is blocked
2. Admin unblocks user → `isBlocked` becomes `false`
3. Admin unblocks user → Failed attempts counter reset to **0**
4. Admin unblocks user → `lockReason` is cleared
5. After unblock → User can login with correct password
6. After unblock → New failed attempts start counting from 0
7. After unblock + 5 new failed attempts → User is blocked again
8. System works in a cycle: Block → Unblock → Reset → Normal access

## Backend Code Verification

### Admin Route (backend/routes/admin.ts)
```typescript
// When unblocking (blocked = false)
if (!blocked) {
  user.lockReason = undefined;
  
  // Delete ALL failed password attempts
  const deletedCount = await RiskEvent.deleteMany({
    userId: user._id,
    action: 'failed-password'
  });
  
  console.log(`✅ RESET: Cleared ${deletedCount.deletedCount} failed attempts`);
}
```

### Login Route (backend/routes/auth.ts)
```typescript
// Count failed attempts in last 1 hour
const failedEventsCount = await RiskEvent.countDocuments({
  userId: user._id,
  action: 'failed-password',
  timestamp: { $gte: new Date(Date.now() - (60 * 60 * 1000)) }
});

// Block if >= 5 attempts
if (failedEventsCount >= 5) {
  user.isBlocked = true;
  user.lockReason = `5 failed login attempts in 1 hour`;
  // ... return blocked response
}

// On wrong password
if (!isValidPassword) {
  await RiskEvent.create({
    userId: user._id,
    action: 'failed-password',
    timestamp: new Date()
  });
}
```

## Troubleshooting

### If failed attempts don't reset:
1. Check if RiskEvent.deleteMany is being called
2. Verify the userId matches
3. Check MongoDB logs for deletion confirmation

### If user can't login after unblock:
1. Verify `isBlocked` is `false` in database
2. Check if `lockReason` is cleared
3. Verify password is correct

### If counter doesn't start from 0:
1. Check timestamp filter (1 hour window)
2. Verify old RiskEvents were deleted
3. Check if new RiskEvents are being created correctly

## Cleanup
```javascript
// Remove test user
db.users.deleteOne({ email: "resettest@example.com" });
db.riskevents.deleteMany({ /* userId of test user */ });
db.accesslogs.deleteMany({ userEmail: "resettest@example.com" });
```
