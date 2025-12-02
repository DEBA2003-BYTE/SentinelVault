# Risk-Based Authentication Testing Guide

## Quick Start

1. **Start the backend**:
   ```bash
   cd backend
   npm start
   ```

2. **Start the frontend**:
   ```bash
   cd frontend
   npm run dev
   ```

3. **Access the application**: http://localhost:5173

## Test Scenarios

### Scenario 1: Low Risk Login (Score 0-40) ✅

**Steps:**
1. Register a new user with GPS location enabled
2. Immediately login with the same credentials
3. Use the same device and location
4. Login during normal hours (8 AM - 8 PM IST)

**Expected Result:**
- Risk score: 0-40
- Green popup appears with "ALLOWED" message
- "ENTER" button to proceed
- Click ENTER → redirected to dashboard

**Risk Factors:**
- Failed attempts: 0
- GPS: 0 (same location)
- Typing: 0-2 (baseline not established yet)
- Time of day: 0 (during normal hours)
- Velocity: 0
- New device: 0 (same device)

---

### Scenario 2: Medium Risk Login (Score 41-70) ⚠️

**Option A: New Device**
1. Login with correct credentials
2. Clear browser cache/use incognito mode (simulates new device)
3. Expected: +5 points for new device

**Option B: Unusual Time**
1. Login outside 8 AM - 8 PM IST
2. Expected: +8 points for time of day

**Option C: Location Change**
1. Use VPN or change location significantly
2. Expected: +5 to +15 points for GPS anomaly

**Expected Result:**
- Risk score: 41-70
- Amber popup appears with "Additional Verification Required"
- "Give FingerPrint" button
- MFA flow initiated (WebAuthn)

---

### Scenario 3: High Risk Login (Score 71-100) 🚫

**Option A: Multiple Failed Attempts**
1. Try to login with wrong password 5 times
2. Each failed attempt adds 10 points
3. Then login with correct password
4. Expected: 50+ points from failed attempts

**Option B: Extreme Location Change**
1. Login from very distant location (>2000 km)
2. Combined with other factors (new device, unusual time)
3. Expected: 15 (GPS) + 5 (device) + 8 (time) = 28+ points

**Option C: Impossible Travel**
1. Login from Location A
2. Immediately login from Location B (>1000 km away)
3. Expected: High velocity score (10 points)

**Expected Result:**
- Risk score: 71-100
- Red popup appears with "Access Blocked"
- Message: "You are blocked — ask the Admin to unblock"
- User account locked (`isBlocked: true`)
- "Close" button only
- Admin must unblock the account

---

### Scenario 4: Admin Exemption 👑

**Steps:**
1. Login as `admin@gmail.com`
2. Even with failed attempts or unusual factors
3. Admin is always exempt from RBA

**Expected Result:**
- Risk score: 0 (always)
- Green popup with "ALLOWED"
- Immediate access granted
- Action logged as `login-admin-exempt`

---

## Testing Tools

### Browser DevTools

**Check Network Tab:**
```json
// POST /api/auth/login response
{
  "status": "ok" | "mfa_required" | "blocked",
  "risk": 45,
  "breakdown": {
    "failedAttempts": 10,
    "gps": 5,
    "typing": 2,
    "timeOfDay": 8,
    "velocity": 0,
    "newDevice": 5,
    "otherTotal": 20
  }
}
```

**Check Console Logs:**
- GPS location detection
- Keystroke capture
- Risk score calculation

### MongoDB Queries

**Check RiskEvent collection:**
```javascript
db.riskevents.find({ userId: ObjectId("...") }).sort({ timestamp: -1 })
```

**Check User document:**
```javascript
db.users.findOne({ email: "test@example.com" })
// Check: isBlocked, lockReason, keystrokeBaseline, locationHistory, knownDevices
```

**Check AccessLog:**
```javascript
db.accesslogs.find({ userEmail: "test@example.com" }).sort({ timestamp: -1 })
```

---

## Debugging Tips

### Risk Score Too Low?

1. **Check failed attempts**: Make sure RiskEvent is logging failed passwords
2. **Verify GPS**: Ensure location is being captured and sent
3. **Check time**: Verify IST timezone calculation
4. **Device tracking**: Confirm deviceId is consistent

### Risk Score Too High?

1. **Check baseline data**: New users have minimal baseline
2. **Verify location history**: First login has no history to compare
3. **Check time window**: Failed attempts older than 15 minutes don't count

### Popup Not Showing?

1. **Check response format**: Ensure backend returns `status` field
2. **Verify state**: Check `showRiskPopup` and `riskData` in React DevTools
3. **Check CSS**: Ensure RiskScorePopup.css is loaded

### Admin Not Exempt?

1. **Verify email**: Must be exactly `admin@gmail.com`
2. **Check isAdmin flag**: User document should have `isAdmin: true`
3. **Check backend logs**: Should see "ADMIN EXEMPTION" message

---

## Manual Risk Score Calculation

**Example:**
- Failed attempts: 3 × 10 = 30 points
- GPS distance: 800 km = 5 points
- Typing variance: Z-score 1.5 = 5 points
- Time: 9 PM (outside hours) = 8 points
- Velocity: Normal = 0 points
- New device: Yes = 5 points

**Total:** 30 + 5 + 5 + 8 + 0 + 5 = 53 points → **MFA Required**

---

## Reset Test Data

### Clear Failed Attempts
```javascript
db.riskevents.deleteMany({ action: "failed-password" })
```

### Unblock User
```javascript
db.users.updateOne(
  { email: "test@example.com" },
  { $set: { isBlocked: false }, $unset: { lockReason: "" } }
)
```

### Reset User Baseline
```javascript
db.users.updateOne(
  { email: "test@example.com" },
  { 
    $set: { 
      keystrokeBaseline: { meanIKI: 0, stdIKI: 0, samples: 0 },
      locationHistory: [],
      knownDevices: []
    }
  }
)
```

---

## Performance Testing

### Load Test
```bash
# Install artillery
npm install -g artillery

# Create test config
artillery quick --count 10 --num 5 http://localhost:3001/api/auth/login
```

### Measure Response Time
- Low risk: < 200ms
- Medium risk: < 300ms
- High risk: < 400ms (includes DB write for blocking)

---

## Security Checklist

- [ ] GPS location required for non-admin users
- [ ] Failed attempts logged correctly
- [ ] Account locked at risk ≥ 71
- [ ] Admin exempt from RBA
- [ ] Tokens only issued after user confirmation
- [ ] Risk events logged to database
- [ ] Keystroke data captured securely
- [ ] Device fingerprints hashed
- [ ] Location history limited to 10 entries
- [ ] Failed attempt window is 15 minutes

---

## Common Issues

### Issue: Risk score always 0
**Solution:** Check if user is admin or if risk computation is being called

### Issue: GPS not detected
**Solution:** Enable location permissions in browser, use HTTPS in production

### Issue: Keystroke data empty
**Solution:** Type password slowly to capture key intervals

### Issue: Popup doesn't close
**Solution:** Check onClick handlers and state management

### Issue: Token not stored
**Solution:** Verify localStorage.setItem is called after ENTER click

---

## Next Steps

After testing:
1. Implement WebAuthn MFA for medium-risk logins
2. Add admin dashboard for risk monitoring
3. Set up email notifications for blocked accounts
4. Configure custom activity hours per user
5. Add geofencing rules
6. Implement continuous authentication
7. Train ML models on user behavior

---

## Support

For issues:
1. Check backend console for risk computation logs
2. Check frontend console for GPS and keystroke data
3. Query MongoDB for RiskEvent and AccessLog entries
4. Review RBA_IMPLEMENTATION.md for architecture details
