# Testing the Risk Analysis Dashboard

## Prerequisites

### 1. Start the Servers

**Backend:**
```bash
cd backend
npm start
```
The backend should start on `http://localhost:3001`

**Frontend:**
```bash
cd frontend
npm run dev
```
The frontend should start on `http://localhost:5173`

### 2. Verify Services

Check backend health:
```bash
curl http://localhost:3001/health
```

Expected response:
```json
{
  "status": "OK",
  "services": {
    "api": "running",
    "mongodb": {"status": "connected"},
    "opa": {"status": "unhealthy", "required": false}
  }
}
```

## Testing the Risk Analysis Dashboard

### Step 1: Login as Admin

1. Navigate to `http://localhost:5173`
2. Login with admin credentials:
   - Email: `admin@gmail.com`
   - Password: `Debarghya`

### Step 2: Access Admin Dashboard

1. Click on "Admin" in the navigation menu
2. You should see three tabs:
   - Registered Users
   - User Feedback
   - **Access Logs** ← Click this tab

### Step 3: View Access Logs

In the Access Logs table, you'll see columns:
- Timestamp
- Action
- User Email
- IP Address
- Device Fingerprint
- Location
- Risk Score (color-coded: Red/Yellow/Green)
- Status (ALLOWED/BLOCKED)
- Reason
- **Actions** (with "View" button) ← This is new!

### Step 4: Open Risk Analysis Modal

1. Click the **"View"** button on any log entry
2. The Risk Analysis Dashboard modal will open

### Step 5: Explore the Dashboard

The modal displays:

#### 1. Overall Risk Score (Top Section)
- Large risk score number with color coding
- Access status (Granted/Denied)
- Timestamp of the access attempt

#### 2. Visual Analytics (Two Columns)

**Left: Overall Risk Distribution**
- Pie chart showing Risk Score vs Safe percentage
- Interactive tooltips on hover

**Right: Access Location**
- Interactive map with marker (if GPS data available)
- Location name and coordinates
- Falls back to text display if no GPS data

#### 3. Policy Risk Breakdown (Grid)

Each policy card shows:
- Policy name (e.g., "Device Trust", "Geo Location Anomaly")
- Status badge (Allowed/Blocked)
- Progress bar with color coding
- Risk score (0-100)
- Detailed reason

**Policies Displayed:**
1. Device Trust
2. Geo Location Anomaly
3. Impossible Travel
4. Suspicious IP
5. Failed Login Attempts
6. Privilege Escalation
7. Time Based Access
8. MFA Enforcement
9. Behavioral Anomaly

#### 4. Access Details (Three Cards)

**User Information:**
- Email address
- Action performed
- File name (if applicable)

**Security Status:**
- Access granted/denied icon
- ZKP verification status

**Location Details:**
- Location name
- GPS coordinates (if available)

#### 5. Decision Reason (Bottom)
- Yellow alert box with detailed explanation
- Shows why access was granted or denied

## Testing Different Scenarios

### Scenario 1: Low Risk Access (Score < 30)
- Should show green indicators
- All policies should show "Allowed"
- Map should display access location

### Scenario 2: Medium Risk Access (Score 30-70)
- Should show yellow indicators
- Some policies may show elevated risk
- May require MFA

### Scenario 3: High Risk Access (Score > 70)
- Should show red indicators
- Multiple policies showing high risk
- Access likely denied

## Troubleshooting

### Issue: "View" button doesn't show data

**Solution:** The log entry needs to have `riskAssessment` data. This is populated when:
1. OPA server is running
2. The access was evaluated through the risk evaluation endpoint
3. The login flow includes OPA evaluation

### Issue: No policy breakdown shown

**Possible causes:**
1. OPA server not running (optional - system works without it)
2. Old log entries created before the update
3. Access log doesn't have `riskAssessment` field

**Solution:** 
- Generate new access logs by logging in/out
- Start OPA server for detailed policy results:
  ```bash
  docker run -p 8181:8181 openpolicyagent/opa:latest run --server
  ```

### Issue: Map not displaying

**Possible causes:**
1. No GPS coordinates in the log
2. Location data in old format (string instead of GeoJSON)

**Solution:**
- The system handles both formats gracefully
- Falls back to text display if coordinates unavailable

### Issue: CORS errors

**Solution:** Backend CORS is configured for:
- `http://localhost:5173`
- `http://localhost:3000`
- `http://127.0.0.1:5173`
- `http://127.0.0.1:3000`

If using a different port, update `backend/index.ts`:
```typescript
app.use(cors({
  origin: ['http://localhost:YOUR_PORT'],
  credentials: true
}));
```

## Generating Test Data

To see the dashboard in action with policy data:

### 1. Start OPA Server
```bash
docker run -p 8181:8181 openpolicyagent/opa:latest run --server
```

### 2. Load Policies
The backend automatically loads policies from `backend/policies/bundle/` on startup.

### 3. Perform Actions
- Login/logout multiple times
- Upload/download files
- Access from different locations (use VPN to test)
- Try failed login attempts

### 4. View Results
Each action creates an access log with detailed risk assessment.

## API Endpoints

### Get Access Logs
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3001/api/admin/audit
```

Response includes:
```json
{
  "logs": [
    {
      "id": "...",
      "user": "user@example.com",
      "action": "login",
      "riskScore": 25,
      "allowed": true,
      "location": {
        "type": "Point",
        "coordinates": [77.1287, 13.3263],
        "name": "Bangalore, India"
      },
      "riskAssessment": {
        "policy_results": {
          "device_trust": {
            "policy": "device_trust",
            "allow": true,
            "risk_score": 0,
            "reason": "Device is trusted"
          },
          "geo_location_anomaly": {
            "policy": "geo_location_anomaly",
            "allow": true,
            "risk_score": 15,
            "reason": "Different country than usual"
          }
          // ... more policies
        },
        "weighted_scores": {
          "device_trust": 0,
          "geo_location": 15
          // ... more scores
        }
      }
    }
  ]
}
```

## Color Coding Reference

### Risk Scores
- **Green (Low)**: 0-29 - Safe access
- **Yellow (Medium)**: 30-70 - Elevated risk, may require MFA
- **Red (High)**: 71-100 - High risk, likely denied

### Status Badges
- **Green "Allowed"**: Policy passed
- **Red "Blocked"**: Policy failed

### Progress Bars
- Match the risk score color coding
- Width represents the risk percentage

## Next Steps

1. **Enable OPA** for full policy evaluation
2. **Generate diverse test data** with different risk scenarios
3. **Test with real GPS locations** using mobile devices
4. **Monitor policy effectiveness** through the dashboard
5. **Adjust policy weights** in `backend/policies/bundle/risk_aggregation.rego`

## Support

If you encounter issues:
1. Check browser console for errors
2. Check backend logs for API errors
3. Verify MongoDB connection
4. Ensure all dependencies are installed
5. Restart both frontend and backend servers
