# Risk-Based Authentication - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Start the Backend

```bash
cd backend
npm start
```

Wait for:
```
✅ Connected to MongoDB successfully
✅ OPA policies loaded successfully
Server running on port 3001
```

### Step 2: Start the Frontend

```bash
cd frontend
npm run dev
```

Access: http://localhost:5173

### Step 3: Test Low Risk Login

1. Click "Sign up" and register a new user
2. **Allow GPS location** when prompted
3. Wait for green "GPS Ready" indicator
4. Complete registration
5. Login immediately with same credentials
6. **See the Risk Score Popup** (green, score 0-40)
7. Click "ENTER" to proceed to dashboard

✅ **Success!** You've completed a low-risk login.

---

## 🧪 Test Different Risk Levels

### Test Medium Risk (MFA Required)

**Option 1: New Device**
```bash
# Open in incognito/private window
# Or clear browser data
```

**Option 2: Unusual Time**
```bash
# Login outside 8 AM - 8 PM IST
# (2:00 AM - 7:59 AM or 8:01 PM - 1:59 AM IST)
```

**Expected:** Amber popup, "Give FingerPrint" button

---

### Test High Risk (Blocked)

**Option 1: Failed Attempts**
1. Try wrong password 5 times
2. Then login with correct password
3. **Expected:** Red popup, account blocked

**Option 2: Extreme Location**
1. Use VPN to change location significantly
2. Login from new device + unusual time
3. **Expected:** Red popup, account blocked

---

### Test Admin Exemption

1. Login as `admin@gmail.com`
2. Use password from `.env` file
3. **Expected:** Green popup, risk score 0, immediate access

---

## 📊 View Risk Data

### MongoDB Queries

```javascript
// Connect to MongoDB
mongosh

// Use database
use sentinel-vault

// View risk events
db.riskevents.find().sort({ timestamp: -1 }).limit(5).pretty()

// View blocked users
db.users.find({ isBlocked: true }).pretty()

// View access logs
db.accesslogs.find().sort({ timestamp: -1 }).limit(5).pretty()
```

### Browser DevTools

**Network Tab:**
- Filter: `/api/auth/login`
- Check response for `risk`, `breakdown`, `status`

**Console Tab:**
- GPS location detection logs
- Keystroke capture logs
- Risk score calculation

---

## 🎯 Understanding the Popup

### Green Popup (Risk 0-40)
```
┌─────────────────────────┐
│    ✓ Access Granted     │
│                         │
│      Risk Score: 15     │
│                         │
│       ALLOWED           │
│                         │
│    [ ENTER ]            │
└─────────────────────────┘
```

### Amber Popup (Risk 41-70)
```
┌─────────────────────────┐
│  ⚠ Additional Verify    │
│                         │
│      Risk Score: 55     │
│                         │
│  Please provide         │
│  fingerprint auth       │
│                         │
│  [ Give FingerPrint ]   │
└─────────────────────────┘
```

### Red Popup (Risk 71-100)
```
┌─────────────────────────┐
│    ✗ Access Blocked     │
│                         │
│      Risk Score: 85     │
│                         │
│  You are blocked —      │
│  ask Admin to unblock   │
│                         │
│    [ Close ]            │
└─────────────────────────┘
```

---

## 🔧 Troubleshooting

### Popup Not Showing?

**Check:**
1. Backend is running on port 3001
2. Frontend is running on port 5173
3. GPS location is enabled
4. Browser console for errors

**Fix:**
```bash
# Restart backend
cd backend && npm start

# Restart frontend
cd frontend && npm run dev
```

---

### GPS Not Detected?

**Check:**
1. Browser location permissions
2. HTTPS (required in production)
3. Green "GPS Ready" indicator

**Fix:**
```
1. Click browser address bar
2. Click location icon
3. Select "Allow"
4. Refresh page
```

---

### Risk Score Always 0?

**Possible Reasons:**
1. You're logged in as admin
2. First-time login (no baseline)
3. Same device, location, time

**To Increase Risk:**
- Try wrong password first
- Use VPN/different location
- Login at unusual time
- Clear browser cache (new device)

---

### Account Blocked?

**Unblock via MongoDB:**
```javascript
db.users.updateOne(
  { email: "your@email.com" },
  { $set: { isBlocked: false }, $unset: { lockReason: "" } }
)
```

**Or via Backend:**
```bash
# Create unblock script
node backend/scripts/unblock-user.js your@email.com
```

---

## 📱 Mobile Testing

### iOS Safari
1. Settings → Safari → Location Services → Allow
2. Open http://localhost:5173 (use ngrok for remote)
3. Allow location when prompted

### Android Chrome
1. Settings → Site Settings → Location → Allow
2. Open http://localhost:5173
3. Allow location when prompted

---

## 🎓 Learn More

- **Architecture**: See `docs/RBA_IMPLEMENTATION.md`
- **Testing Guide**: See `docs/RBA_TESTING_GUIDE.md`
- **Full Summary**: See `RBA_SUMMARY.md`

---

## 💡 Tips

1. **First Login**: Risk score will be low (no baseline data)
2. **Keystroke Data**: Type password slowly to capture dynamics
3. **GPS Accuracy**: Wait for green indicator before login
4. **Admin Testing**: Use admin account to bypass RBA
5. **Reset Data**: Clear MongoDB collections to start fresh

---

## ✅ Checklist

Before testing:
- [ ] Backend running on port 3001
- [ ] Frontend running on port 5173
- [ ] MongoDB connected
- [ ] GPS location enabled in browser
- [ ] Admin credentials in `.env` file

During testing:
- [ ] GPS location detected (green indicator)
- [ ] Login successful
- [ ] Risk popup appears
- [ ] Risk score displayed
- [ ] Appropriate action button shown
- [ ] Can proceed after clicking button

---

## 🎉 Success Criteria

You've successfully implemented RBA when:

✅ Low-risk login shows green popup with ENTER button
✅ Medium-risk login shows amber popup with MFA button
✅ High-risk login shows red popup and blocks account
✅ Admin login bypasses RBA (risk = 0)
✅ Risk factors are calculated correctly
✅ Risk events are logged to database
✅ User can proceed after confirming popup

---

## 📞 Need Help?

1. Check backend console logs
2. Check browser console logs
3. Query MongoDB for risk events
4. Review documentation files
5. Check Network tab in DevTools

---

**Ready to test? Start with Step 1 above! 🚀**
