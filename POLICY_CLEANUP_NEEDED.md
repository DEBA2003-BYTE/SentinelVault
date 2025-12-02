# 🧹 OPA Policy Cleanup - Unused Files

## Summary
You have **TWO** OPA Rego policy files, but only **ONE** is actually being used.

## Current Status

### ✅ ACTIVE POLICY (Being Used)
**File:** `backend/policies/rba_scoring.rego`
- **Package:** `rba_scoring`
- **Used by:** Main login endpoint `/api/auth/login`
- **Called from:** `backend/routes/auth.ts` (line 467)
- **Frontend uses:** All login forms call this endpoint
- **Status:** ✅ **ACTIVE AND WORKING**

```typescript
// backend/routes/auth.ts (line 467)
const opaResponse = await fetch(`${process.env.OPA_URL}/v1/data/rba_scoring`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ input: opaInput })
});
```

### ❌ UNUSED POLICY (Not Being Used)
**File:** `backend/policies/risk_assessment.rego`
- **Package:** `risk_assessment`
- **Used by:** Comprehensive login endpoint `/api/auth/login-comprehensive`
- **Called from:** `backend/utils/opa.ts` (line 65)
- **Frontend uses:** ❌ **NONE** - This endpoint is not called by any frontend code
- **Status:** ❌ **UNUSED - CAN BE DELETED**

```typescript
// backend/utils/opa.ts (line 65)
const response = await fetch(`${this.opaUrl}/v1/data/risk_assessment`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ input }),
});
```

## Comparison

| Feature | rba_scoring.rego (ACTIVE) | risk_assessment.rego (UNUSED) |
|---------|---------------------------|-------------------------------|
| Package | `rba_scoring` | `risk_assessment` |
| Endpoint | `/api/auth/login` | `/api/auth/login-comprehensive` |
| Frontend Usage | ✅ Used by all login forms | ❌ Not used |
| Risk Factors | 6 factors (failed attempts, GPS, typing, time, velocity, device) | 10 factors (device, location, time, typing, failed attempts, browser, network, behavioral, account age, activity) |
| Implementation | Complete with Haversine, Z-score, IST timezone | Incomplete (truncated at line 50) |
| Documentation | ✅ Fully documented | ❌ No documentation |
| Testing | ✅ Tested and working | ❌ Not tested |

## Recommendation

### Option 1: Delete Unused Files (Recommended)
Delete these files as they are not being used:
- ❌ `backend/policies/risk_assessment.rego`
- ❌ `backend/utils/opa.ts` (only used by unused endpoint)
- ❌ `/api/auth/login-comprehensive` endpoint in `backend/routes/auth.ts`

### Option 2: Keep for Future Use
If you plan to use the comprehensive login endpoint in the future, keep the files but:
1. Complete the `risk_assessment.rego` implementation
2. Update it to match the same risk factors as `rba_scoring.rego`
3. Add documentation
4. Add tests

## What to Delete

### Files to Delete:
```bash
# Delete unused policy
rm backend/policies/risk_assessment.rego

# Optionally delete unused utility (if not used elsewhere)
# Check first if opa.ts is used for anything else
rm backend/utils/opa.ts
```

### Code to Remove from `backend/routes/auth.ts`:
Remove the entire `/login-comprehensive` endpoint (lines ~850-1050) as it's not being used by the frontend.

## What to Keep

### Keep These (ACTIVE):
- ✅ `backend/policies/rba_scoring.rego` - Main policy
- ✅ `backend/scripts/loadRBAPolicies.ts` - Loads rba_scoring.rego
- ✅ `backend/routes/auth.ts` - Main `/login` endpoint
- ✅ All frontend login forms

## Verification

### Check Frontend Usage:
```bash
# Search for login-comprehensive in frontend
grep -r "login-comprehensive" frontend/
# Result: No matches (not used)

# Search for /login in frontend
grep -r "auth/login" frontend/
# Result: Multiple matches (actively used)
```

### Check Backend Usage:
```bash
# Check which policy is loaded
curl http://localhost:8181/v1/policies/rba_scoring
# Should return: Policy content (active)

curl http://localhost:8181/v1/policies/risk_assessment
# Should return: 404 or empty (not loaded)
```

## Current System Architecture

```
Frontend Login Forms
    ↓
POST /api/auth/login
    ↓
backend/routes/auth.ts
    ↓
OPA Server: http://localhost:8181/v1/data/rba_scoring
    ↓
backend/policies/rba_scoring.rego
    ↓
Risk Score (0-100) + Action
    ↓
Response to Frontend
```

## Unused Architecture (Can be Deleted)

```
❌ No Frontend Usage
    ↓
❌ POST /api/auth/login-comprehensive
    ↓
❌ backend/utils/opa.ts
    ↓
❌ OPA Server: http://localhost:8181/v1/data/risk_assessment
    ↓
❌ backend/policies/risk_assessment.rego
    ↓
❌ Never executed
```

## Action Items

1. **Immediate:** You can safely delete `risk_assessment.rego` - it's not being used
2. **Optional:** Remove `/login-comprehensive` endpoint from auth.ts
3. **DO NOT DELETE:** `backend/utils/opa.ts` - it IS used by other parts of the system:
   - `backend/index.ts` - OPA health checks and initialization
   - `backend/routes/policy.ts` - Policy evaluation
   - `backend/routes/riskEvaluation.ts` - Risk evaluation
   - `backend/middleware/opaPolicy.ts` - OPA policy middleware
4. **Keep:** Everything related to `rba_scoring.rego` - this is your active system

## Conclusion

**Answer to your question:** 
- ❌ **NO**, we are **NOT** using `risk_assessment.rego`
- ✅ **YES**, we are using `rba_scoring.rego` (the main one)

The `risk_assessment.rego` file is leftover code that was never integrated with the frontend. You can safely delete it.
