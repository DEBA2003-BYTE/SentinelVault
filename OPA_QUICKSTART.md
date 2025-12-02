# OPA-Based RBA Quick Start

## 🚀 Get Started with OPA Risk Scoring

### Step 1: Start OPA Server

**Option A: Using Docker (Recommended)**
```bash
docker run -d \
  --name sentinelvault-opa \
  -p 8181:8181 \
  openpolicyagent/opa:latest \
  run --server
```

**Option B: Using Binary**
```bash
# Download OPA
curl -L -o opa https://openpolicyagent.org/downloads/latest/opa_linux_amd64
chmod +x opa

# Run OPA
./opa run --server --addr :8181
```

### Step 2: Verify OPA is Running

```bash
curl http://localhost:8181/health
```

Expected output:
```json
{}
```

Or use npm script:
```bash
cd backend
npm run opa-health
```

### Step 3: Load RBA Policies

```bash
cd backend
npm run load-rba-policies
```

Expected output:
```
🔄 Loading RBA Scoring Policy into OPA...
✅ RBA Scoring Policy loaded successfully
✅ Policy verification successful

🧪 Testing RBA Policy...

✅ Low Risk - Normal Login
   Risk Score: 0/100
   Risk Level: low
   Action: normal
   ✓ Expected risk level matched

✅ Medium Risk - New Device
   Risk Score: 5/100
   Risk Level: low
   Action: normal
   ✓ Expected risk level matched

✅ High Risk - Multiple Failed Attempts
   Risk Score: 50/100
   Risk Level: medium
   Action: mfa_required
   ✓ Expected risk level matched

✅ RBA Policy testing complete
```

### Step 4: Start Backend

```bash
npm start
```

Look for:
```
✅ Connected to MongoDB successfully
✅ OPA policies loaded successfully
Server running on port 3001
```

### Step 5: Test Login with OPA

1. Open frontend: http://localhost:5173
2. Register a new user
3. Login - you'll see the risk popup
4. Check backend logs for OPA risk assessment

Backend logs will show:
```
OPA Risk Assessment: {
  riskScore: 5,
  breakdown: { failedAttempts: 0, gps: 0, typing: 2, ... },
  action: 'normal'
}
```

---

## 🧪 Test OPA Directly

### Test Low Risk Login

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
  }' | jq
```

Expected:
```json
{
  "result": {
    "risk_score": 0,
    "risk_level": "low",
    "action": "normal",
    "allow": true
  }
}
```

### Test High Risk (Failed Attempts)

```bash
curl -X POST http://localhost:8181/v1/data/rba_scoring \
  -H 'Content-Type: application/json' \
  -d '{
    "input": {
      "failed_count": 5,
      "gps": {"lat": 28.6139, "lon": 77.2090},
      "device_id": "device123",
      "user": {
        "location_history": [{"lat": 28.6139, "lon": 77.2090}],
        "known_devices": [{"deviceIdHash": "device123"}]
      }
    }
  }' | jq
```

Expected:
```json
{
  "result": {
    "risk_score": 50,
    "risk_level": "medium",
    "action": "mfa_required",
    "allow": false
  }
}
```

---

## 🔧 Common Commands

### Check OPA Health
```bash
npm run opa-health
```

### Reload Policies
```bash
npm run load-rba-policies
```

### View Loaded Policies
```bash
curl http://localhost:8181/v1/policies
```

### View RBA Policy
```bash
curl http://localhost:8181/v1/policies/rba_scoring
```

### Stop OPA
```bash
docker stop sentinelvault-opa
# or
npm run stop-opa
```

### Start OPA
```bash
docker start sentinelvault-opa
# or
npm run start-opa
```

---

## 🐛 Troubleshooting

### OPA Not Running

**Check:**
```bash
docker ps | grep opa
```

**Fix:**
```bash
docker run -d -p 8181:8181 --name sentinelvault-opa openpolicyagent/opa:latest run --server
```

### Policy Not Loaded

**Check:**
```bash
curl http://localhost:8181/v1/policies/rba_scoring
```

**Fix:**
```bash
npm run load-rba-policies
```

### Backend Using Fallback

**Symptom:** Backend logs show "OPA unavailable, using fallback scoring"

**Fix:**
1. Check OPA is running: `npm run opa-health`
2. Check OPA_URL in .env: `OPA_URL=http://localhost:8181`
3. Reload policies: `npm run load-rba-policies`

### Wrong Risk Scores

**Check Input Data:**
```bash
# Add console.log in auth.ts to see OPA input
console.log('OPA Input:', JSON.stringify(opaInput, null, 2));
```

**Test Policy Directly:**
```bash
# Use the logged input to test OPA directly
curl -X POST http://localhost:8181/v1/data/rba_scoring \
  -H 'Content-Type: application/json' \
  -d '{"input": <paste_logged_input>}' | jq
```

---

## 📊 Understanding OPA Responses

### Low Risk (0-40)
```json
{
  "risk_score": 15,
  "risk_level": "low",
  "action": "normal",
  "allow": true,
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
→ User sees green popup, clicks ENTER

### Medium Risk (41-70)
```json
{
  "risk_score": 55,
  "risk_level": "medium",
  "action": "mfa_required",
  "allow": false,
  "breakdown": {
    "failedAttempts": 30,
    "gps": 5,
    "typing": 5,
    "timeOfDay": 8,
    "velocity": 0,
    "newDevice": 5,
    "otherTotal": 23
  }
}
```
→ User sees amber popup, clicks "Give FingerPrint"

### High Risk (71-100)
```json
{
  "risk_score": 85,
  "risk_level": "high",
  "action": "blocked",
  "allow": false,
  "breakdown": {
    "failedAttempts": 50,
    "gps": 15,
    "typing": 12,
    "timeOfDay": 8,
    "velocity": 0,
    "newDevice": 5,
    "otherTotal": 40
  }
}
```
→ User sees red popup, account blocked

---

## 🎯 Benefits of OPA

✅ **Declarative** - Policies written in Rego, easy to read
✅ **Centralized** - All risk logic in one place
✅ **Testable** - Policies can be tested independently
✅ **Auditable** - All decisions are traceable
✅ **Flexible** - Change policies without code deployment
✅ **Scalable** - OPA is highly optimized
✅ **Fallback** - TypeScript scoring if OPA unavailable

---

## 📚 Next Steps

1. **Customize Policies**: Edit `backend/policies/rba_scoring.rego`
2. **Adjust Weights**: Change risk factor weights
3. **Add Factors**: Implement new risk factors
4. **Test Policies**: Use `npm run load-rba-policies`
5. **Monitor**: Check OPA logs and backend logs
6. **Scale**: Deploy OPA in production with HA

---

## 📖 Documentation

- **OPA Integration**: See `docs/OPA_RBA_INTEGRATION.md`
- **RBA Implementation**: See `docs/RBA_IMPLEMENTATION.md`
- **Testing Guide**: See `docs/RBA_TESTING_GUIDE.md`
- **Full Summary**: See `RBA_SUMMARY.md`

---

**Status**: ✅ OPA-based RBA is ready to use!
