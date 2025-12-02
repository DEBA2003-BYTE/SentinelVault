# Risk-Based Authentication (RBA) Implementation

## Overview

The application now implements a comprehensive Risk-Based Authentication system that evaluates user login attempts and takes appropriate actions based on calculated risk scores.

## Risk Score Bands

The system uses three risk bands to determine the appropriate action:

### 🟢 Low Risk (0-40)
- **Action**: ALLOWED
- **User Experience**: User sees a popup showing their risk score and can click "ENTER" to proceed to dashboard
- **Backend Response**: `status: 'ok'` with token

### 🟡 Medium Risk (41-70)
- **Action**: MFA REQUIRED
- **User Experience**: User sees a popup asking for fingerprint authentication (WebAuthn MFA)
- **Backend Response**: `status: 'mfa_required'` with risk breakdown

### 🔴 High Risk (71-100)
- **Action**: BLOCKED
- **User Experience**: User sees a popup stating they are blocked and must contact admin
- **Backend Response**: `status: 'blocked'`, user account is locked with `lockReason`

## Risk Factors

The risk score is calculated based on multiple factors:

### 1. Failed Login Attempts (Weight: 50)
- 10 points per failed attempt in the last 15 minutes
- Maximum: 50 points

### 2. GPS Location (Weight: 15)
- Compares current location with user's location history
- Distance-based scoring:
  - ≤50 km: 0 points
  - ≤500 km: ~5 points
  - ≤2000 km: ~10 points
  - >2000 km: 15 points

### 3. Typing Pattern (Weight: 12)
- Analyzes keystroke dynamics (Inter-Key Intervals)
- Compares with user's baseline typing pattern
- Z-score based scoring

### 4. Time of Day (Weight: 8)
- Default activity hours: 8:00 AM - 8:00 PM IST
- Outside hours: 8 points
- Within 2 hours of edges: ~5 points

### 5. Velocity (Weight: 10)
- Detects impossible travel (speed > 500 km/h)
- Suspicious travel (speed > 200 km/h): ~6 points

### 6. New Device (Weight: 5)
- Unknown device: 5 points
- Known device: 0 points

## Admin Exemption

Users with email `admin@gmail.com` or `isAdmin: true` are **exempt from RBA**:
- No risk computation
- Immediate token issuance
- Risk score always 0
- Action logged as `login-admin-exempt`

## Frontend Implementation

### RiskScorePopup Component

Located at: `frontend/src/components/security/RiskScorePopup.tsx`

Features:
- Beautiful modal UI with risk score visualization
- Color-coded based on risk level (green/amber/red)
- Shows detailed risk factor breakdown
- Action buttons based on risk band:
  - "ENTER" for allowed
  - "Give FingerPrint" for MFA required
  - "Close" for blocked

### Integration in LoginForm

The login flow now:
1. Submits credentials with GPS, keystroke data, device ID
2. Receives risk assessment from backend
3. Shows RiskScorePopup with appropriate action
4. Stores token only after user confirms (clicks ENTER)
5. Navigates to dashboard or initiates MFA flow

## Backend Implementation

### Scoring Service

Located at: `backend/services/scoring.service.ts`

Functions:
- `computeRisk(user, event)`: Main risk calculation
- `scoreFailedLogins(fails)`: Failed attempt scoring
- `scoreGPS(locations, current)`: Location-based scoring
- `scoreTyping(baseline, sample)`: Keystroke dynamics
- `scoreTimeOfDay(hours, timestamp)`: Time-based scoring (IST)
- `scoreVelocity(lastLogin, now, gps)`: Impossible travel detection
- `scoreNewDevice(devices, deviceId)`: Device recognition

### Auth Route Updates

Located at: `backend/routes/auth.ts`

Key changes:
1. Admin exemption check before RBA
2. Failed password attempts logged to RiskEvent
3. Risk computation using `computeRisk()`
4. Three-band response handling:
   - ≥71: Block user, set `isBlocked: true`
   - ≥41: Return `mfa_required` status
   - <41: Return `ok` status with token
5. Response includes `risk`, `breakdown`, and `popup` fields

### RiskEvent Model

Located at: `backend/models/RiskEvent.ts`

Stores:
- userId, timestamp
- IP, user agent, GPS coordinates
- Device ID, keystroke sample
- Computed risk score and breakdown
- Action taken (normal, mfa_required, blocked, failed-password, login-admin-exempt)

## Testing the System

### Test Low Risk Login
1. Login with correct credentials
2. From known device and location
3. During normal hours (8 AM - 8 PM IST)
4. Expected: Risk score 0-40, ALLOWED popup

### Test Medium Risk Login
1. Login from new device OR
2. Login from unusual location OR
3. Login outside normal hours
4. Expected: Risk score 41-70, MFA REQUIRED popup

### Test High Risk Login
1. Make 5+ failed login attempts, then login correctly OR
2. Login from very distant location (>2000 km) with other factors OR
3. Impossible travel detected
4. Expected: Risk score 71-100, BLOCKED popup, account locked

### Test Admin Exemption
1. Login as `admin@gmail.com`
2. Even with failed attempts or unusual factors
3. Expected: Risk score 0, immediate access, no RBA

## Database Schema Updates

### User Model Additions
```typescript
keystrokeBaseline?: {
  meanIKI: number;
  stdIKI: number;
  samples: number;
};
locationHistory?: Array<{
  lat: number;
  lon: number;
  timestamp: Date;
}>;
knownDevices?: Array<{
  deviceIdHash: string;
  firstSeen: Date;
  lastSeen: Date;
}>;
activityHours?: {
  start: number;
  end: number;
  tz: string;
};
lastLoginDetails?: {
  timestamp: Date;
  ip?: string;
  gps?: { lat: number; lon: number };
};
```

## Future Enhancements

1. **WebAuthn MFA Integration**: Complete the MFA flow for medium-risk logins
2. **Machine Learning**: Train models on user behavior patterns
3. **Adaptive Thresholds**: Adjust risk bands based on user role/sensitivity
4. **Notification System**: Alert admins when accounts are blocked
5. **Risk Dashboard**: Admin view of risk events and trends
6. **Geofencing**: Define allowed geographic regions per user
7. **Behavioral Biometrics**: Mouse movement, scroll patterns
8. **Session Risk**: Continuous authentication during session

## API Response Format

### Successful Login (Low Risk)
```json
{
  "status": "ok",
  "token": "jwt_token_here",
  "risk": 15,
  "breakdown": {
    "failedAttempts": 0,
    "gps": 5,
    "typing": 2,
    "timeOfDay": 0,
    "velocity": 0,
    "newDevice": 5,
    "otherTotal": 12
  },
  "popup": { "risk": 15, "action": "continue" }
}
```

### MFA Required (Medium Risk)
```json
{
  "status": "mfa_required",
  "method": "webauthn",
  "risk": 55,
  "breakdown": { ... },
  "message": "Please provide fingerprint authentication"
}
```

### Blocked (High Risk)
```json
{
  "status": "blocked",
  "risk": 85,
  "breakdown": { ... },
  "message": "Account blocked due to suspicious activity. Contact admin to unblock."
}
```

## Configuration

### Environment Variables
- `JWT_SECRET`: Token signing secret
- `ADMIN_EMAIL`: Admin account email (default: admin@gmail.com)
- `ADMIN_PASSWORD`: Admin password

### Default Settings
- Activity hours: 8:00 - 20:00 IST
- Failed attempt window: 15 minutes
- Location history: Last 10 locations
- Risk bands: 0-40 (allow), 41-70 (MFA), 71-100 (block)

## Security Considerations

1. **Rate Limiting**: Prevent brute force attacks
2. **Token Expiry**: 24-hour JWT expiration
3. **Secure Storage**: Passwords hashed with bcrypt (12 rounds)
4. **GPS Validation**: Required for non-admin users
5. **Device Fingerprinting**: Auto-generated from browser headers
6. **Audit Logging**: All login attempts logged to AccessLog and RiskEvent
7. **Admin Protection**: Strong password required, consider additional MFA

## Monitoring

Monitor these metrics:
- Average risk scores per user
- Blocked account frequency
- MFA challenge rate
- Failed login patterns
- Geographic anomalies
- Time-of-day patterns

## Support

For issues or questions:
1. Check backend logs for risk computation details
2. Review RiskEvent collection for historical data
3. Verify GPS location is being captured correctly
4. Ensure keystroke data is being sent from frontend
5. Check timezone configuration for time-of-day scoring
