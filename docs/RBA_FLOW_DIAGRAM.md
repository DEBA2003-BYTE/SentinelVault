# Risk-Based Authentication Flow Diagram

## Complete Login Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER LOGIN                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND CAPTURES                            │
│  • Email & Password                                             │
│  • GPS Location (lat, lon)                                      │
│  • Keystroke Dynamics (Inter-Key Intervals)                     │
│  • Device ID (fingerprint)                                      │
│  • Local Timestamp (for IST conversion)                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                  POST /api/auth/login                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND PROCESSING                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │  Find User in   │
                    │    MongoDB      │
                    └─────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │                   │
                    ▼                   ▼
            ┌──────────────┐    ┌──────────────┐
            │ User Found?  │    │ User Blocked?│
            │     NO       │    │     YES      │
            └──────────────┘    └──────────────┘
                    │                   │
                    ▼                   ▼
            ┌──────────────┐    ┌──────────────┐
            │ Return 401   │    │ Return 403   │
            │   Invalid    │    │   Blocked    │
            └──────────────┘    └──────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │ Verify Password │
                    └─────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │                   │
                    ▼                   ▼
            ┌──────────────┐    ┌──────────────┐
            │  Password    │    │  Password    │
            │   Valid?     │    │  Invalid?    │
            │     NO       │    │     YES      │
            └──────────────┘    └──────────────┘
                    │                   │
                    ▼                   ▼
            ┌──────────────┐    ┌──────────────┐
            │ Log Failed   │    │   Continue   │
            │  Attempt     │    │              │
            │ Return 401   │    │              │
            └──────────────┘    └──────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │  Is Admin User? │
                    │ (admin@gmail)   │
                    └─────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │                   │
                    ▼                   ▼
            ┌──────────────┐    ┌──────────────┐
            │     YES      │    │      NO      │
            │  Skip RBA    │    │  Compute RBA │
            └──────────────┘    └──────────────┘
                    │                   │
                    ▼                   ▼
            ┌──────────────┐    ┌──────────────────────────────┐
            │ Issue Token  │    │    RISK COMPUTATION          │
            │ Risk = 0     │    │                              │
            │ Return OK    │    │  1. Count Failed Attempts    │
            └──────────────┘    │     (last 15 min) × 10       │
                                │                              │
                                │  2. GPS Distance Score       │
                                │     (0-15 points)            │
                                │                              │
                                │  3. Typing Pattern Score     │
                                │     (0-12 points)            │
                                │                              │
                                │  4. Time of Day Score        │
                                │     (0-8 points, IST)        │
                                │                              │
                                │  5. Velocity Score           │
                                │     (0-10 points)            │
                                │                              │
                                │  6. New Device Score         │
                                │     (0-5 points)             │
                                │                              │
                                │  Total = Failed (max 50)     │
                                │        + Others (max 50)     │
                                └──────────────────────────────┘
                                              │
                                              ▼
                                ┌─────────────────────────┐
                                │   Risk Score: 0-100     │
                                └─────────────────────────┘
                                              │
                    ┌─────────────────────────┼─────────────────────────┐
                    │                         │                         │
                    ▼                         ▼                         ▼
        ┌───────────────────┐   ┌───────────────────┐   ┌───────────────────┐
        │   Risk 0-40       │   │   Risk 41-70      │   │   Risk 71-100     │
        │   LOW RISK        │   │   MEDIUM RISK     │   │   HIGH RISK       │
        └───────────────────┘   └───────────────────┘   └───────────────────┘
                    │                         │                         │
                    ▼                         ▼                         ▼
        ┌───────────────────┐   ┌───────────────────┐   ┌───────────────────┐
        │ Return:           │   │ Return:           │   │ Lock Account      │
        │ status: 'ok'      │   │ status:           │   │ isBlocked = true  │
        │ token: JWT        │   │ 'mfa_required'    │   │ lockReason: risk  │
        │ risk: score       │   │ risk: score       │   │                   │
        │ breakdown: {...}  │   │ breakdown: {...}  │   │ Return:           │
        └───────────────────┘   └───────────────────┘   │ status: 'blocked' │
                    │                         │           │ risk: score       │
                    │                         │           │ breakdown: {...}  │
                    │                         │           └───────────────────┘
                    │                         │                         │
                    ▼                         ▼                         ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         FRONTEND RECEIVES RESPONSE                      │
└─────────────────────────────────────────────────────────────────────────┘
                    │                         │                         │
                    ▼                         ▼                         ▼
        ┌───────────────────┐   ┌───────────────────┐   ┌───────────────────┐
        │  Show Green       │   │  Show Amber       │   │  Show Red         │
        │  Popup            │   │  Popup            │   │  Popup            │
        │                   │   │                   │   │                   │
        │  ✓ ALLOWED        │   │  ⚠ MFA Required   │   │  ✗ BLOCKED        │
        │                   │   │                   │   │                   │
        │  Risk Score: 15   │   │  Risk Score: 55   │   │  Risk Score: 85   │
        │                   │   │                   │   │                   │
        │  [  ENTER  ]      │   │  [Give FingerPrint]│  │  You are blocked  │
        │                   │   │                   │   │  Contact admin    │
        └───────────────────┘   └───────────────────┘   │                   │
                    │                         │           │  [  Close  ]      │
                    ▼                         ▼           └───────────────────┘
        ┌───────────────────┐   ┌───────────────────┐             │
        │ User clicks       │   │ User clicks       │             ▼
        │ ENTER             │   │ Give FingerPrint  │   ┌───────────────────┐
        └───────────────────┘   └───────────────────┘   │ User clicks       │
                    │                         │           │ Close             │
                    ▼                         ▼           └───────────────────┘
        ┌───────────────────┐   ┌───────────────────┐             │
        │ Store Token       │   │ Initiate WebAuthn │             ▼
        │ localStorage      │   │ MFA Flow          │   ┌───────────────────┐
        └───────────────────┘   └───────────────────┘   │ Stay on Login     │
                    │                         │           │ Page              │
                    ▼                         ▼           │ Show Error        │
        ┌───────────────────┐   ┌───────────────────┐   └───────────────────┘
        │ Navigate to       │   │ If MFA Success:   │
        │ Dashboard         │   │ Store Token       │
        │                   │   │ Navigate to       │
        │ ✅ SUCCESS        │   │ Dashboard         │
        └───────────────────┘   │                   │
                                │ If MFA Fail:      │
                                │ Show Error        │
                                └───────────────────┘
```

---

## Risk Factor Calculation Detail

```
┌─────────────────────────────────────────────────────────────────┐
│                    RISK FACTOR BREAKDOWN                        │
└─────────────────────────────────────────────────────────────────┘

1. FAILED ATTEMPTS (Weight: 50)
   ┌────────────────────────────────────┐
   │ Count failed logins in last 15 min│
   │ Each attempt = 10 points           │
   │ Max: 50 points (5+ attempts)       │
   └────────────────────────────────────┘
   Example: 3 failed attempts = 30 points

2. GPS LOCATION (Weight: 15)
   ┌────────────────────────────────────┐
   │ Compare with location history      │
   │ Calculate distance (Haversine)     │
   │                                    │
   │ ≤ 50 km    → 0 points              │
   │ ≤ 500 km   → 5 points              │
   │ ≤ 2000 km  → 10 points             │
   │ > 2000 km  → 15 points             │
   │ Unknown    → 12 points (moderate)  │
   └────────────────────────────────────┘
   Example: 800 km away = 5 points

3. TYPING PATTERN (Weight: 12)
   ┌────────────────────────────────────┐
   │ Compare keystroke dynamics         │
   │ Calculate Z-score from baseline    │
   │                                    │
   │ Z < 1  → 0 points (normal)         │
   │ Z < 2  → 5 points (slight)         │
   │ Z < 3  → 10 points (moderate)      │
   │ Z ≥ 3  → 12 points (high)          │
   │ No baseline → 2 points             │
   └────────────────────────────────────┘
   Example: Z-score 1.5 = 5 points

4. TIME OF DAY (Weight: 8)
   ┌────────────────────────────────────┐
   │ Convert to IST timezone            │
   │ Check against activity hours       │
   │ Default: 8 AM - 8 PM IST           │
   │                                    │
   │ Within hours → 0 points            │
   │ ±2 hours     → 5 points            │
   │ Outside      → 8 points            │
   └────────────────────────────────────┘
   Example: 9 PM IST = 8 points

5. VELOCITY (Weight: 10)
   ┌────────────────────────────────────┐
   │ Calculate travel speed             │
   │ Distance / Time since last login   │
   │                                    │
   │ < 200 km/h → 0 points (normal)     │
   │ < 500 km/h → 6 points (suspicious) │
   │ ≥ 500 km/h → 10 points (impossible)│
   └────────────────────────────────────┘
   Example: 600 km/h = 10 points

6. NEW DEVICE (Weight: 5)
   ┌────────────────────────────────────┐
   │ Check device ID in knownDevices    │
   │                                    │
   │ Known device → 0 points            │
   │ New device   → 5 points            │
   └────────────────────────────────────┘
   Example: New device = 5 points

┌─────────────────────────────────────────────────────────────────┐
│                      TOTAL CALCULATION                          │
│                                                                 │
│  Failed Attempts: 0-50 points (capped)                          │
│  Other Factors:   0-50 points (capped)                          │
│  ────────────────────────────────────                           │
│  Total Risk:      0-100 points                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Database Interaction Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      DATABASE OPERATIONS                        │
└─────────────────────────────────────────────────────────────────┘

LOGIN ATTEMPT
     │
     ▼
┌─────────────────┐
│ Query User      │ ← db.users.findOne({ email })
└─────────────────┘
     │
     ▼
┌─────────────────┐
│ Count Failed    │ ← db.riskevents.countDocuments({
│ Attempts        │     action: 'failed-password',
└─────────────────┘     timestamp: { $gte: 15min ago }
     │                })
     ▼
┌─────────────────┐
│ Compute Risk    │ ← Use user.keystrokeBaseline
│ Score           │   Use user.locationHistory
└─────────────────┘   Use user.knownDevices
     │                Use user.lastLoginDetails
     ▼
┌─────────────────┐
│ Log RiskEvent   │ ← db.riskevents.create({
└─────────────────┘     userId, risk, breakdown, action
     │                })
     ▼
┌─────────────────┐
│ Update User     │ ← db.users.updateOne({
│ - lastLogin     │     Update keystrokeBaseline (EMA)
│ - baseline      │     Push to locationHistory
│ - history       │     Update knownDevices
│ - devices       │     Update lastLoginDetails
└─────────────────┘   })
     │
     ▼
┌─────────────────┐
│ Log AccessLog   │ ← db.accesslogs.create({
└─────────────────┘     userId, action, riskScore, allowed
                      })
```

---

## State Management (Frontend)

```
┌─────────────────────────────────────────────────────────────────┐
│                    REACT STATE FLOW                             │
└─────────────────────────────────────────────────────────────────┘

LoginForm Component
     │
     ├─ [email, setEmail]
     ├─ [password, setPassword]
     ├─ [gpsLocation, setGpsLocation]
     ├─ [keystrokes, setKeystrokes]
     ├─ [loading, setLoading]
     ├─ [error, setError]
     ├─ [showRiskPopup, setShowRiskPopup]
     ├─ [riskData, setRiskData]
     └─ [pendingToken, setPendingToken]
          │
          ▼
     handleSubmit()
          │
          ├─ Capture GPS
          ├─ Capture Keystrokes
          ├─ POST /api/auth/login
          │
          ▼
     Response Handler
          │
          ├─ status: 'ok'
          │   ├─ setRiskData({ score, breakdown, status: 'allowed' })
          │   ├─ setPendingToken(token)
          │   └─ setShowRiskPopup(true)
          │
          ├─ status: 'mfa_required'
          │   ├─ setRiskData({ score, breakdown, status: 'mfa_required' })
          │   └─ setShowRiskPopup(true)
          │
          └─ status: 'blocked'
              ├─ setRiskData({ score, breakdown, status: 'blocked' })
              └─ setShowRiskPopup(true)
          │
          ▼
     RiskScorePopup
          │
          ├─ onContinue() → Store token, navigate to dashboard
          ├─ onStartMFA() → Initiate WebAuthn flow
          └─ onClose() → Close popup, stay on login page
```

---

## Security Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      SECURITY LAYERS                            │
└─────────────────────────────────────────────────────────────────┘

Layer 1: Input Validation
     │
     ├─ Email format validation
     ├─ Password strength check
     ├─ GPS coordinates validation
     └─ Device ID format check
          │
          ▼
Layer 2: Authentication
     │
     ├─ User exists check
     ├─ Password hash comparison (bcrypt)
     ├─ Account blocked check
     └─ Admin exemption check
          │
          ▼
Layer 3: Risk Assessment
     │
     ├─ Failed attempt counting
     ├─ Behavioral analysis
     ├─ Contextual analysis
     └─ Risk score computation
          │
          ▼
Layer 4: Policy Enforcement
     │
     ├─ Risk < 41  → Allow
     ├─ Risk 41-70 → Require MFA
     └─ Risk ≥ 71  → Block account
          │
          ▼
Layer 5: Audit Logging
     │
     ├─ Log to RiskEvent
     ├─ Log to AccessLog
     └─ Update user profile
          │
          ▼
Layer 6: Token Issuance
     │
     ├─ Generate JWT
     ├─ Set expiration (24h)
     └─ Return to client
```

---

## Error Handling Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      ERROR SCENARIOS                            │
└─────────────────────────────────────────────────────────────────┘

User Not Found
     │
     └─ Return 401 Unauthorized
        "Invalid credentials"

Invalid Password
     │
     ├─ Log failed attempt to RiskEvent
     ├─ Increment failed count
     └─ Return 401 Unauthorized
        "Invalid credentials"

Account Blocked
     │
     └─ Return 403 Forbidden
        "Account blocked"

High Risk Score (≥71)
     │
     ├─ Set user.isBlocked = true
     ├─ Set user.lockReason = "risk:XX"
     ├─ Log to RiskEvent
     └─ Return 403 Forbidden
        status: 'blocked'

GPS Not Available
     │
     └─ Return 400 Bad Request
        "GPS location is required"

Database Error
     │
     └─ Return 500 Internal Server Error
        "Login failed"

Network Error (Frontend)
     │
     └─ Show error message
        "Could not connect to server"
```

This comprehensive flow diagram shows every step of the RBA system from user input to final response!
