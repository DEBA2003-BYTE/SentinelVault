# Complete Debug Guide - 5 Failed Attempts Block

## 🔍 Debug Steps

### Step 1: Check Backend Logs

**Start backend and watch the logs:**
```bash
cd backend
npm start
```

**When you try to login, you should see:**

**Attempt 1-5 (Wrong Password):**
```
[RBA] User test@example.com has 0 failed attempts in last hour
[RBA] Logging failed password attempt for user test@example.com
[RBA] Failed attempt logged for user test@example.com
```

**Attempt 6 (Correct Password after 5 failures):**
```
[RBA] User test@example.com has 5 failed attempts in last hour
[RBA] BLOCKING user test@example.com due to 5 failed attempts
```

---

### Step 2: Check Frontend Console

**Open browser DevTools (F12) → Console tab**

**When blocked, you should see:**
```
Login response: {
  status: 403,
  ok: false,
  data: {
    status: 'blocked',
    risk: 100,
    message: '...'
  }
}
User is blocked, showing popup
```

---

### Step 3: Check Database

**Connect to MongoDB and check RiskEvents:**

```javascript
// In MongoDB shell or Compass
use sentinel-vault

// Check failed attempts for a user
db.riskevents.find({
  userEmail: "test@example.com",  // or use userId
  action: "failed-password"
}).sort({ timestamp: -1 })

// Count failed attempts in last hour
db.riskevents.countDocuments({
  action: "failed-password",
  timestamp: { $gte: new Date(Date.now() - 3600000) }
})
```

**Expected:** Should see 5 documents with `action: "failed-password"`

---

### Step 4: Manual Test Script

Create a test file to check the database directly:

```javascript
// backend/test-failed-attempts.js
const mongoose = require('mongoose');
require('dotenv').config();

async function checkFailedAttempts(email) {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const User = require('./models/User').User;
  const RiskEvent = require('./models/RiskEvent').RiskEvent;
  
  const user = await User.findOne({ email });
  if (!user) {
    console.log('User not found');
    return;
  }
  
  const count = await RiskEvent.countDocuments({
    userId: user._id,
    action: 'failed-password',
    timestamp: { $gte: new Date(Date.now() - 3600000) }
  });
  
  console.log(`User ${email} has ${count} failed attempts in last hour`);
  
  const events = await RiskEvent.find({
    userId: user._id,
    action: 'failed-password'
  }).sort({ timestamp: -1 }).limit(10);
  
  console.log('Recent failed attempts:');
  events.forEach((e, i) => {
    console.log(`${i+1}. ${e.timestamp} - ${e.action}`);
  });
  
  await mongoose.disconnect();
}

checkFailedAttempts('test@example.com');
```

**Run it:**
```bash
cd backend
node test-failed-attempts.js
```

---

## 🐛 Common Issues

### Issue 1: RiskEvents Not Being Created

**Symptom:** Backend logs show "Logging failed password attempt" but count is always 0

**Check:**
```javascript
// In MongoDB
db.riskevents.find().sort({ timestamp: -1 }).limit(5)
```

**If empty:** RiskEvent model might not be saving correctly

**Fix:** Check if timestamp field is being set:
```typescript
// In auth.ts, make sure timestamp is set
await RiskEvent.create({
  userId: user._id,
  action: 'failed-password',
  timestamp: new Date(), // ← Make sure this is here
  // ... other fields
});
```

---

### Issue 2: Wrong User ID

**Symptom:** Failed attempts are logged but not counted for the right user

**Check:**
```javascript
// In MongoDB
db.riskevents.find({ action: 'failed-password' })
```

**Look at:** `userId` field - should match the user's `_id`

---

### Issue 3: Timestamp Issue

**Symptom:** Failed attempts exist but count is 0

**Check:**
```javascript
// In MongoDB
db.riskevents.find({
  action: 'failed-password',
  timestamp: { $exists: true }
})
```

**If timestamps are missing or wrong format:** Update the schema

---

### Issue 4: Frontend Not Showing Popup

**Symptom:** Backend blocks user but frontend shows "Invalid credentials"

**Check Frontend Console:**
```javascript
// Should see:
Login response: { status: 403, ok: false, data: {...} }
User is blocked, showing popup
```

**If you see:**
```javascript
Login response: { status: 401, ok: false, data: {error: 'Invalid credentials'} }
```

**Then:** Backend is not blocking the user (check backend logs)

---

## 🧪 Complete Test Procedure

### Test 1: Fresh Start

```bash
# 1. Clear all failed attempts
# In MongoDB:
db.riskevents.deleteMany({ action: 'failed-password' })

# 2. Unblock user
db.users.updateOne(
  { email: 'test@example.com' },
  { $set: { isBlocked: false }, $unset: { lockReason: '' } }
)

# 3. Restart backend
cd backend
npm start

# 4. Open frontend with DevTools
# Browser: http://localhost:5173
# Press F12 → Console tab

# 5. Try wrong password 5 times
# Watch backend logs for:
[RBA] User test@example.com has 0 failed attempts
[RBA] Logging failed password attempt
[RBA] Failed attempt logged

# After 5 attempts, check database:
db.riskevents.countDocuments({ action: 'failed-password' })
# Should return: 5

# 6. Try correct password (6th attempt)
# Backend should show:
[RBA] User test@example.com has 5 failed attempts in last hour
[RBA] BLOCKING user test@example.com due to 5 failed attempts

# Frontend console should show:
Login response: {status: 403, ok: false, data: {status: 'blocked'}}
User is blocked, showing popup

# 7. Popup should appear
✅ Red popup
✅ Risk Score: 100
✅ Message: "You have been blocked"
```

---

## 📊 Expected vs Actual

### Expected Behavior

| Attempt | Password | Backend Log | Frontend Display |
|---------|----------|-------------|------------------|
| 1 | Wrong | "has 0 failed attempts" → "Logging failed" | Error: "Invalid credentials" |
| 2 | Wrong | "has 1 failed attempts" → "Logging failed" | Error: "Invalid credentials" |
| 3 | Wrong | "has 2 failed attempts" → "Logging failed" | Error: "Invalid credentials" |
| 4 | Wrong | "has 3 failed attempts" → "Logging failed" | Error: "Invalid credentials" |
| 5 | Wrong | "has 4 failed attempts" → "Logging failed" | Error: "Invalid credentials" |
| 6 | Correct | "has 5 failed attempts" → "BLOCKING user" | Popup: "You have been blocked" |

---

## 🔧 Quick Fixes

### Fix 1: Ensure Timestamp is Set

```typescript
// backend/routes/auth.ts
await RiskEvent.create({
  userId: user._id,
  action: 'failed-password',
  timestamp: new Date(), // ← Add this if missing
  // ... other fields
});
```

### Fix 2: Check Model Schema

```typescript
// backend/models/RiskEvent.ts
timestamp: {
  type: Date,
  default: Date.now,
  required: true
}
```

### Fix 3: Verify Query

```typescript
// backend/routes/auth.ts
const failedEventsCount = await RiskEvent.countDocuments({
  userId: user._id,
  action: 'failed-password',
  timestamp: { $gte: new Date(Date.now() - (60 * 60 * 1000)) }
});

console.log(`Found ${failedEventsCount} failed attempts`);
```

---

## ✅ Success Checklist

After trying 5 wrong passwords and 1 correct:

- [ ] Backend logs show "has 5 failed attempts"
- [ ] Backend logs show "BLOCKING user"
- [ ] Database has 5 RiskEvent documents with action: 'failed-password'
- [ ] User document has isBlocked: true
- [ ] Frontend console shows "User is blocked, showing popup"
- [ ] Red popup appears with risk score 100
- [ ] Popup shows "You have been blocked"
- [ ] NO "Invalid credentials" error alert

---

## 🚨 If Still Not Working

1. **Restart backend** - Make sure latest code is running
2. **Clear browser cache** - Hard refresh (Ctrl+Shift+R)
3. **Check MongoDB connection** - Ensure database is accessible
4. **Verify user exists** - Check user is in database
5. **Check console for errors** - Both backend and frontend
6. **Try different user** - Test with fresh account

---

**Status:** 🔍 **Debug mode enabled - Check logs!**

Run the test and watch both backend terminal and browser console for the log messages.
