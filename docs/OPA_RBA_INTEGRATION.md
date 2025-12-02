# OPA-Based Risk-Based Authentication Integration

## Overview

The Risk-Based Authentication (RBA) system now uses **Open Policy Agent (OPA)** with Rego policies to compute risk scores, as specified in Risk.md. This provides a declarative, auditable, and centralized policy enforcement mechanism.

## Architecture

```
┌─────────────────┐
│  Login Request  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Auth Route     │
│  (auth.ts)      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐      ┌──────────────────┐
│  Prepare OPA    │─────▶│  OPA Server      │
│  Input Data     │      │  (Port 8181)     │
└─────────────────┘      └────────┬─────────┘
                                  │
                                  ▼
                         ┌──────────────────┐
                         │  rba_scoring.rego│
                         │  Policy          │
                         └────────┬─────────┘
                                  │
                                  ▼
                         ┌──────────────────┐
                         │  Risk Score      │
                         │  Calculation     │
                         │  (0-100)         │
                         └────────┬─────────┘
                                  │
                                  ▼
                         ┌──────────────────┐
                         │  Return Result   │
                         │  - risk_score    │
                         │  - breakdown     │
                         │  - action        │
                         │  - risk_level    │
                         └────────┬─────────┘
                                  │
         ┌────────────────────────┘
         │
         ▼
┌─────────────────┐
│  Auth Route     │
│  Processes      │
│  Response       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Show Risk      │
│  Popup to User  │
└─────────────────┘
```

## OPA Policy: rba_scoring.rego

### Location
`backend/policies/rba_scoring.rego`

### Package
`package rba_scoring`

### Key Components

#### 1. Risk Factor Weights
```rego
weights := {
    "failed_attempts": 50,
    "gps": 15,
    "typing": 12,
    "time_of_day": 8,
    "velocity": 10,
    "new_device": 5
}
```

#### 2. Risk Scoring Functions

**Failed Attempts** (0-50 points)
- 10 points per failed attempt in last 15 minutes
- Maximum: 50 points (5+ attempts)

**GPS Location** (0-15 points)
- Compares with location history using Haversine formula
- ≤50 km: 0 points
- ≤500 km: 5 points
- ≤2000 km: 10 points
- >2000 km: 15 points

**Typing Pattern** (0-12 points)
- Z-score based on keystroke baseline
- Z < 1: 0 points
- Z < 2: 5 points
- Z < 3: 10 points
- Z ≥ 3: 12 points

**Time of Day** (0-8 points)
- IST timezone (Asia/Kolkata)
- Default hours: 8 AM - 8 PM
- Within hours: 0 points
- ±2 hours: 5 points
- Outside: 8 points

**Velocity** (0-10 points)
- Calculates travel speed from last login
- ≤200 km/h: 0 points
- ≤500 km/h: 6 points
- >500 km/h: 10 points (impossible travel)

**New Device** (0-5 points)
- Known device: 0 points
- New device: 5 points

#### 3. Risk Bands

```rego
risk_level := "low" if risk_score <= 40
risk_level := "medium" if { risk_score > 40; risk_score <= 70 }
risk_level := "high" if risk_score > 70

action := "normal" if risk_score <= 40
action := "mfa_required" if { risk_score > 40; risk_score <= 70 }
action := "blocked" if risk_score > 70
```

#### 4. Output Structure

```json
{
  "risk_score": 45,
  "risk_level": "medium",
  "action": "mfa_required",
  "allow": false,
  "breakdown": {
    "failedAttempts": 10,
    "gps": 5,
    "typing": 2,
    "timeOfDay": 8,
    "velocity": 0,
    "newDevice": 5,
    "otherTotal": 20
  },
  "reasons": [
    "Failed login attempts: 1 × 10 = 10 points",
    "GPS location anomaly: 5 points",
    "Typing pattern deviation: 2 points",
    "Unusual time of day: 8 points",
    "New device: 5 points"
  ],
  "suggested_action": "Require MFA verification"
}
```

## Backend Integration

### Auth Route (backend/routes/auth.ts)

The login endpoint now calls OPA for risk assessment:

```typescript
// Prepare input for OPA
const opaInput = {
  failed_count: failedEventsCount,
  gps: req.body.gps || null,
  keystroke_sample: req.body.keystroke || {},
  timestamp: req.body.localTimestamp || new Date().toISOString(),
  device_id: req.body.deviceId || req.body.deviceFingerprint || null,
  user: {
    keystroke_baseline: user.keystrokeBaseline || null,
    location_history: user.locationHistory || [],
    known_devices: user.knownDevices || [],
    activity_hours: user.activityHours || { start: 8, end: 20, tz: 'Asia/Kolkata' },
    last_login_details: user.lastLoginDetails || null
  }
};

// Call OPA
const opaResponse = await fetch('http://localhost:8181/v1/data/rba_scoring', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ input: opaInput })
});

const opaData = await opaResponse.json();
const riskScore = opaData.result.risk_score;
const breakdown = opaData.result.breakdown;
```

### Fallback Mechanism

If OPA is unavailable, the system falls back to TypeScript-based scoring:

```typescript
try {
  // Try OPA first
  const opaResponse = await fetch(...);
  // Use OPA result
} catch (opaError) {
  // Fallback to TypeScript scoring
  const fallback = computeRisk(user, event);
  riskScore = fallback.total;
  breakdown = fallback.breakdown;
}
```

## Setup Instructions

### 1. Start OPA Server

**Using Docker:**
```bash
docker run -d \
  --name sentinelvault-opa \
  -p 8181:8181 \
  openpolicyagent/opa:latest \
  run --server
```

**Using Binary:**
```bash
# Download OPA
curl -L -o opa https://openpolicyagent.org/downloads/latest/opa_linux_amd64
chmod +x opa

# Run OPA server
./opa run --server --addr :8181
```

### 2. Load RBA Policy

```bash
cd backend
npm run load-rba-policies
```

This will:
- Load `rba_scoring.rego` into OPA
- Verify the policy is loaded correctly
- Run test cases to validate scoring

### 3. Verify OPA Health

```bash
npm run opa-health
```

Expected output:
```
✓ - OPA is healthy
```

### 4. Start Backend

```bash
npm start
```

The backend will automatically use OPA for risk scoring if available.

## Testing OPA Policies

### Manual Testing

**Test Low Risk:**
```bash
curl -X POST http://localhost:8181/v1/data/rba_scoring \
  -H 'Content-Type: application/json' \
  -d '{
    "input": {
      "failed_count": 0,
      "gps": {"lat": 28.6139, "lon": 77.2090},
      "keystroke_sample": {"meanIKI": 150},
      "timestamp": "2024-01-15T14:30:00Z",
      "device_id": "device123",
      "user": {
        "keystroke_baseline": {"meanIKI": 150, "stdIKI": 20, "samples": 10},
        "location_history": [{"lat": 28.6139, "lon": 77.2090}],
        "known_devices": [{"deviceIdHash": "device123"}],
        "activity_hours": {"start": 8, "end": 20, "tz": "Asia/Kolkata"}
      }
    }
  }'
```

**Expected Response:**
```json
{
  "result": {
    "risk_score": 0,
    "risk_level": "low",
    "action": "normal",
    "allow": true,
    "breakdown": {
      "failedAttempts": 0,
      "gps": 0,
      "typing": 0,
      "timeOfDay": 0,
      "velocity": 0,
      "newDevice": 0,
      "otherTotal": 0
    }
  }
}
```

### Automated Testing

Run the test script:
```bash
npm run load-rba-policies
```

This runs multiple test cases:
- Low risk (normal login)
- Medium risk (new device)
- High risk (multiple failed attempts)

## Monitoring OPA

### Check Loaded Policies

```bash
curl http://localhost:8181/v1/policies
```

### View Specific Policy

```bash
curl http://localhost:8181/v1/policies/rba_scoring
```

### Query Policy Data

```bash
curl -X POST http://localhost:8181/v1/data/rba_scoring \
  -H 'Content-Type: application/json' \
  -d '{"input": {...}}'
```

### OPA Logs

**Docker:**
```bash
docker logs sentinelvault-opa
```

**Binary:**
Check console output where OPA is running

## Advantages of OPA-Based RBA

### 1. Declarative Policy Definition
- Policies written in Rego (declarative language)
- Easy to read and understand
- Self-documenting

### 2. Centralized Policy Management
- All risk logic in one place
- Version controlled
- Easy to audit

### 3. Policy as Code
- Policies can be tested independently
- CI/CD integration
- Automated validation

### 4. Separation of Concerns
- Business logic (risk scoring) separate from application code
- Policy changes don't require code deployment
- Different teams can manage policies

### 5. Flexibility
- Easy to add new risk factors
- Adjust weights without code changes
- A/B testing of different policies

### 6. Auditability
- All policy decisions are traceable
- Policy versions tracked
- Compliance-friendly

### 7. Performance
- OPA is highly optimized
- Caching built-in
- Scales horizontally

## Troubleshooting

### OPA Not Running

**Symptom:** Backend logs show "OPA unavailable, using fallback scoring"

**Solution:**
```bash
# Check if OPA is running
npm run opa-health

# Start OPA if not running
docker run -d -p 8181:8181 openpolicyagent/opa:latest run --server

# Or use npm script
npm run start-opa
```

### Policy Not Loaded

**Symptom:** OPA returns empty result or error

**Solution:**
```bash
# Reload the policy
npm run load-rba-policies

# Verify policy is loaded
curl http://localhost:8181/v1/policies/rba_scoring
```

### Incorrect Risk Scores

**Symptom:** Risk scores don't match expectations

**Solution:**
1. Check input data format
2. Verify user baseline data exists
3. Test policy with curl
4. Check OPA logs for errors

### OPA Connection Timeout

**Symptom:** Backend hangs on login

**Solution:**
- Check OPA_URL environment variable
- Verify network connectivity
- Increase timeout in fetch call
- Use fallback scoring

## Configuration

### Environment Variables

```bash
# .env
OPA_URL=http://localhost:8181
```

### Policy Configuration

Edit `backend/policies/rba_scoring.rego` to adjust:
- Risk factor weights
- Risk band thresholds
- Activity hours
- Distance thresholds

After changes:
```bash
npm run load-rba-policies
```

## Migration from TypeScript Scoring

The system now uses OPA by default but maintains TypeScript scoring as fallback:

1. **OPA Available**: Uses Rego policy for scoring
2. **OPA Unavailable**: Falls back to TypeScript `scoring.service.ts`

This ensures zero downtime during OPA deployment or maintenance.

## Future Enhancements

1. **Policy Versioning**: Track policy changes over time
2. **A/B Testing**: Test different policies on subset of users
3. **Dynamic Weights**: Adjust weights based on threat intelligence
4. **Policy Bundles**: Load multiple policies for different user segments
5. **Real-time Updates**: Hot-reload policies without restart
6. **Policy Analytics**: Track policy decision patterns
7. **Integration**: Connect with SIEM, threat feeds, etc.

## References

- [OPA Documentation](https://www.openpolicyagent.org/docs/latest/)
- [Rego Language Guide](https://www.openpolicyagent.org/docs/latest/policy-language/)
- [OPA REST API](https://www.openpolicyagent.org/docs/latest/rest-api/)
- Risk.md - Original RBA specification
- RBA_IMPLEMENTATION.md - Implementation details
