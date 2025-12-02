# Risk Popup Flow - Complete Test Guide

## ✅ Implementation Summary

The system now **always shows the Risk Score Popup** before any action (allow, MFA, or block). The popup acts as a mandatory checkpoint that users must acknowledge.

### Key Features

1. **Always Shows Popup** - Every login shows risk score popup
2. **5 Failed Attempts = Block** - Account blocked after 5 wrong passwords in 1 hour
3. **Clear Messages** - Specific messages for each scenario
4. **User Must Acknowledge** - Cannot proceed without clicking button

---

## 🎯 Flow Diagram

```
User Enters Credentials
         ↓
Backend Validates
         ↓
    ┌────┴────┐
    │         │
Wrong Pass  Correct Pass
    │         │
    ↓         ↓
Log Failed  Count Failed
Attempt     Attempts (1 hour)
    │         │
    ↓         ↓
Return      ≥5 Failed?
Error           │
            ┌───┴───┐
           YES      NO
            │        │
            ↓        ↓
        Block    Compute
        Account  Risk Score
            │        │
            └────┬───┘
                 ↓
         Return to Frontend
                 ↓
         SHOW RISK POPUP
         (MANDATORY)
                 ↓
         ┌───────┼───────┐
         │       │       │
    Risk 0-40  41-70  71-100
         │       │       │
         ↓       ↓       ↓
     Green    Amber    Red
     Popup    Popup   Popup
         │       │       │
         ↓       ↓       ↓
     ENTER    Give    Close
     Button   Finger  Button
         │    Print      │
         ↓       │       ↓
    Dashboard  MFA   Stay on
               Flow   Login
```

---

## 🧪 Test Scenarios

### Scenario 1: Normal Login (Low Risk) ✅

**Steps:**
1. Register a new user
2. Login immediately with correct credentials
3. Same device, same location, normal hours

**Expected Flow:**
```
1. User clicks "Sign In"
2. Backend validates credentials ✓
3. Backend counts failed attempts: 0
4. Backend computes risk score: 0-40
5. Backend returns: status: 'ok', risk: 15, token: 'xxx'
6. Frontend receives response
7. ✨ GREEN POPUP APPEARS ✨
   - Title: "Access Granted"
   - Message: "ALLOWED"
   - Risk Score: 15/100
   - Button: "ENTER"
8. User clicks "ENTER"
9. Token stored in localStorage
10. Redirect to dashboard
```

**Popup Details:**
- Color: Green
- Icon: ✓ CheckCircle
- Risk Score: 0-40
- Action: Click ENTER to proceed

---

### Scenario 2: Medium Risk Login (MFA Required) ⚠️

**Steps:**
1. Login from new device OR
2. Login from unusual location OR
3. Login outside normal hours

**Expected Flow:**
```
1. User clicks "Sign In"
2. Backend validates credentials ✓
3. Backend counts failed attempts: 0
4. Backend computes risk score: 41-70
5. Backend returns: status: 'mfa_required', risk: 55
6. Frontend receives response
7. ✨ AMBER POPUP APPEARS ✨
   - Title: "Additional Verification Required"
   - Message: "Please provide fingerprint authentication"
   - Risk Score: 55/100
   - Button: "Give FingerPrint"
8. User clicks "Give FingerPrint"
9. WebAuthn MFA flow initiated
10. After MFA success → Dashboard
```

**Popup Details:**
- Color: Amber/Orange
- Icon: ⚠ AlertTriangle
- Risk Score: 41-70
- Action: Click "Give FingerPrint" for MFA

---

### Scenario 3: High Risk Login (Blocked) 🚫

**Steps:**
1. Login with very distant location (>2000 km) OR
2. Impossible travel detected OR
3. Multiple risk factors combined

**Expected Flow:**
```
1. User clicks "Sign In"
2. Backend validates credentials ✓
3. Backend counts failed attempts: 0
4. Backend computes risk score: 71-100
5. Backend blocks account: isBlocked = true
6. Backend returns: status: 'blocked', risk: 85
7. Frontend receives response
8. ✨ RED POPUP APPEARS ✨
   - Title: "Access Blocked"
   - Message: "You are blocked — ask the Admin to unblock"
   - Risk Score: 85/100
   - Description: "Suspicious activity detected"
   - Button: "Close"
9. User clicks "Close"
10. Stays on login page
11. Account locked in database
```

**Popup Details:**
- Color: Red
- Icon: ✗ XCircle
- Risk Score: 71-100
- Action: Click "Close" (cannot proceed)

---

### Scenario 4: 5 Failed Password Attempts 🔒

**This is the key scenario you requested!**

**Steps:**
1. Try to login with **wrong password** 5 times
2. Each attempt within 1 hour
3. Then try with **correct password**

**Expected Flow:**

**Attempt 1-4 (Wrong Password):**
```
1. User enters wrong password
2. Backend validates: Password incorrect ✗
3. Backend logs RiskEvent: action: 'failed-password'
4. Backend returns: 401 Unauthorized
5. Frontend shows error: "Invalid credentials"
6. User tries again...
```

**Attempt 5 (Wrong Password):**
```
1. User enters wrong password (5th time)
2. Backend validates: Password incorrect ✗
3. Backend logs RiskEvent: action: 'failed-password'
4. Backend counts failed attempts: 5
5. Backend returns: 401 Unauthorized
6. Frontend shows error: "Invalid credentials"
```

**Attempt 6 (Correct Password):**
```
1. User enters CORRECT password
2. Backend validates: Password correct ✓
3. Backend counts failed attempts in last hour: 5
4. ⚠️ AUTOMATIC BLOCK TRIGGERED ⚠️
5. Backend sets: user.isBlocked = true
6. Backend sets: user.lockReason = "5 failed login attempts in 1 hour"
7. Backend returns: status: 'blocked', risk: 100
8. Frontend receives response
9. ✨ RED POPUP APPEARS ✨
   - Title: "Access Blocked"
   - Message: "You are blocked — ask the Admin to unblock"
   - Risk Score: 100/100
   - Description: "Your account has been blocked due to multiple failed login attempts. Please contact your administrator to unblock your account."
   - Breakdown shows: failedAttempts: 50
   - Button: "Close"
10. User clicks "Close"
11. Stays on login page
12. Cannot login until admin unblocks
```

**Popup Details:**
- Color: Red
- Icon: ✗ XCircle
- Risk Score: 100/100
- Specific Message: "blocked due to multiple failed login attempts"
- Action: Must contact admin

**Database State:**
```javascript
{
  email: "user@example.com",
  isBlocked: true,
  lockReason: "5 failed login attempts in 1 hour"
}
```

---

### Scenario 5: Admin Exemption 👑

**Steps:**
1. Login as admin@gmail.com
2. Even with failed attempts or unusual factors

**Expected Flow:**
```
1. User enters admin credentials
2. Backend validates: Admin user detected
3. Backend SKIPS RBA (admin exemption)
4. Backend returns: status: 'ok', risk: 0, token: 'xxx'
5. Frontend receives response
6. ✨ GREEN POPUP APPEARS ✨
   - Title: "Access Granted"
   - Message: "ALLOWED"
   - Risk Score: 0/100
   - Button: "ENTER"
7. User clicks "ENTER"
8. Redirect to dashboard
```

**Note:** Admin always gets risk score 0 and bypasses RBA

---

## 📊 Popup Appearance Matrix

| Risk Score | Color | Icon | Title | Message | Button | Action |
|-----------|-------|------|-------|---------|--------|--------|
| 0-40 | Green | ✓ | Access Granted | ALLOWED | ENTER | Store token → Dashboard |
| 41-70 | Amber | ⚠ | Additional Verification | Provide fingerprint | Give FingerPrint | Initiate MFA |
| 71-100 | Red | ✗ | Access Blocked | Ask Admin to unblock | Close | Stay on login |
| 100 (5 fails) | Red | ✗ | Access Blocked | Multiple failed attempts | Close | Stay on login |

---

## 🔍 Verification Checklist

### Popup Always Shows
- [ ] Low risk login shows green popup
- [ ] Medium risk login shows amber popup
- [ ] High risk login shows red popup
- [ ] 5 failed attempts shows red popup
- [ ] Admin login shows green popup
- [ ] Popup appears BEFORE any navigation
- [ ] User must click button to proceed

### 5 Failed Attempts Block
- [ ] 1st wrong password: Error shown, not blocked
- [ ] 2nd wrong password: Error shown, not blocked
- [ ] 3rd wrong password: Error shown, not blocked
- [ ] 4th wrong password: Error shown, not blocked
- [ ] 5th wrong password: Error shown, not blocked
- [ ] 6th attempt (correct password): RED POPUP, account blocked
- [ ] Database shows: isBlocked = true
- [ ] Database shows: lockReason = "5 failed login attempts in 1 hour"
- [ ] Popup message mentions "multiple failed login attempts"
- [ ] User cannot login until admin unblocks

### Time Window
- [ ] Failed attempts counted in last 1 hour (60 minutes)
- [ ] Attempts older than 1 hour don't count
- [ ] After 1 hour, counter resets

### Admin Unblock
- [ ] Admin can see blocked users in admin panel
- [ ] Admin can unblock user
- [ ] After unblock, user can login normally
- [ ] Failed attempt counter resets after unblock

---

## 🧪 Manual Testing Steps

### Test 1: Normal Login
```bash
1. Open http://localhost:5173
2. Register: test1@example.com
3. Login with correct password
4. ✓ Green popup appears
5. Click ENTER
6. ✓ Redirected to dashboard
```

### Test 2: 5 Failed Attempts
```bash
1. Open http://localhost:5173
2. Register: test2@example.com
3. Logout
4. Try login with WRONG password (1st time)
   ✓ Error: "Invalid credentials"
5. Try login with WRONG password (2nd time)
   ✓ Error: "Invalid credentials"
6. Try login with WRONG password (3rd time)
   ✓ Error: "Invalid credentials"
7. Try login with WRONG password (4th time)
   ✓ Error: "Invalid credentials"
8. Try login with WRONG password (5th time)
   ✓ Error: "Invalid credentials"
9. Try login with CORRECT password (6th attempt)
   ✓ RED POPUP appears
   ✓ Message: "blocked due to multiple failed login attempts"
   ✓ Risk Score: 100
   ✓ Button: "Close"
10. Click Close
    ✓ Stays on login page
11. Try login again with correct password
    ✓ Still blocked
```

### Test 3: Check Database
```javascript
// MongoDB query
db.users.findOne({ email: "test2@example.com" })

// Expected result:
{
  email: "test2@example.com",
  isBlocked: true,
  lockReason: "5 failed login attempts in 1 hour"
}

// Check failed attempts
db.riskevents.find({ 
  userId: ObjectId("..."),
  action: "failed-password",
  timestamp: { $gte: new Date(Date.now() - 3600000) }
}).count()

// Expected: 5
```

### Test 4: Admin Unblock
```bash
1. Login as admin@gmail.com
2. Go to Admin Dashboard
3. Find blocked user: test2@example.com
4. Click "Unblock"
5. ✓ User unblocked
6. Logout
7. Login as test2@example.com with correct password
8. ✓ Green popup appears
9. ✓ Can login successfully
```

---

## 📝 Backend Response Examples

### Low Risk (0-40)
```json
{
  "status": "ok",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "risk": 15,
  "breakdown": {
    "failedAttempts": 0,
    "gps": 5,
    "typing": 2,
    "timeOfDay": 0,
    "velocity": 0,
    "newDevice": 5,
    "otherTotal": 12
  }
}
```

### Medium Risk (41-70)
```json
{
  "status": "mfa_required",
  "method": "webauthn",
  "risk": 55,
  "breakdown": {
    "failedAttempts": 30,
    "gps": 5,
    "typing": 5,
    "timeOfDay": 8,
    "velocity": 0,
    "newDevice": 5,
    "otherTotal": 23
  },
  "message": "Please provide fingerprint authentication"
}
```

### High Risk (71-100)
```json
{
  "status": "blocked",
  "risk": 85,
  "breakdown": {
    "failedAttempts": 50,
    "gps": 15,
    "typing": 12,
    "timeOfDay": 8,
    "velocity": 0,
    "newDevice": 5,
    "otherTotal": 40
  },
  "message": "Account blocked due to suspicious activity"
}
```

### 5 Failed Attempts
```json
{
  "status": "blocked",
  "message": "Your account has been blocked due to multiple failed login attempts. Please contact the administrator to unblock your account.",
  "risk": 100,
  "breakdown": {
    "failedAttempts": 50,
    "gps": 0,
    "typing": 0,
    "timeOfDay": 0,
    "velocity": 0,
    "newDevice": 0,
    "otherTotal": 0
  },
  "failedAttempts": 5
}
```

---

## ✅ Success Criteria

All must pass:

1. ✅ Popup shows for EVERY login (low, medium, high risk)
2. ✅ Popup shows BEFORE any navigation or token storage
3. ✅ User must click button to proceed
4. ✅ 5 wrong passwords in 1 hour = account blocked
5. ✅ Blocked popup shows specific message about failed attempts
6. ✅ User cannot login until admin unblocks
7. ✅ Admin can unblock users
8. ✅ After unblock, user can login normally

---

## 🎯 Key Points

1. **Popup is Mandatory** - Always shows, user must acknowledge
2. **5 Failed = Block** - Automatic block after 5 wrong passwords in 1 hour
3. **Clear Messages** - Specific message for failed attempts block
4. **Admin Control** - Only admin can unblock
5. **Time Window** - 1 hour (60 minutes) for counting failed attempts

---

**Status:** ✅ Implementation complete and ready for testing!
