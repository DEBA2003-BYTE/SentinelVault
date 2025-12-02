# Risk Analysis Dashboard Implementation

## Overview
Added a comprehensive Risk Analysis Dashboard to the Admin panel that displays detailed risk breakdowns based on OPA (Open Policy Agent) Rego policies.

## Features Implemented

### 1. Enhanced Access Logs Table
- Added "Actions" column with "View" button
- Each log entry now has a detailed view option

### 2. Risk Analysis Modal
The modal displays:

#### Overall Risk Score
- Large risk score display with color coding (High/Medium/Low)
- Access status (Granted/Denied)
- Timestamp

#### Visual Analytics
- **Overall Risk Pie Chart**: Shows risk vs safe percentage
- **Interactive Map**: Displays access location with GPS coordinates
- **Policy Breakdown Cards**: Individual risk scores for each policy

#### Policy Risk Factors
The dashboard integrates all Rego policies:
1. **Device Trust** - Validates device fingerprint
2. **Geo Location Anomaly** - Detects unusual locations
3. **Impossible Travel** - Identifies impossible travel patterns
4. **Suspicious IP** - Checks IP reputation
5. **Failed Login Attempts** - Tracks authentication failures
6. **Privilege Escalation** - Monitors permission changes
7. **Time Based Access** - Validates access timing
8. **MFA Enforcement** - Checks multi-factor authentication
9. **Behavioral Anomaly** - Detects unusual behavior patterns

Each policy shows:
- Risk score (0-100)
- Status (Allowed/Blocked)
- Visual progress bar with color coding
- Detailed reason

#### Access Details
- User information and action performed
- Security status with ZKP verification
- Location details with coordinates
- Decision reason

## Backend Changes

### 1. AccessLog Model (`backend/models/AccessLog.ts`)
Added `riskAssessment` field to store:
- `policy_results`: Individual policy decisions
- `weighted_scores`: Weighted risk scores
- `details`: Additional context

### 2. Admin Routes (`backend/routes/admin.ts`)
Updated `/api/admin/audit` endpoint to include:
- `riskAssessment` data in response
- `fileId` with original filename
- `userEmail` for display

### 3. OPA Service (`backend/utils/opa.ts`)
Enhanced `evaluatePolicy` method to:
- Query `risk_aggregation/decision` endpoint first
- Return detailed policy results
- Include weighted scores and context

### 4. Risk Evaluation Route (`backend/routes/riskEvaluation.ts`)
Updated to store detailed policy results in access logs

### 5. Auth Route (`backend/routes/auth.ts`)
Updated login flow to include policy results in access logs

## Frontend Changes

### 1. Admin Component (`frontend/src/pages/Admin.tsx`)
- Added `ViewLogModal` component
- Added state management for modal
- Added `handleViewLog` handler
- Updated AccessLog interface with new fields
- Added "View" button in logs table

### 2. Dependencies
Added required packages:
- `recharts` - For pie charts
- `react-leaflet` & `leaflet` - For maps
- `date-fns` - For date formatting
- `lucide-react` - For icons

## Usage

1. Navigate to Admin Dashboard
2. Click on "Access Logs" tab
3. Click "View" button on any log entry
4. View comprehensive risk analysis with:
   - Overall risk score
   - Policy-by-policy breakdown
   - Location map
   - Security details

## Integration with OPA Policies

The dashboard automatically displays risk factors from all Rego policies in `backend/policies/bundle/`:
- Each policy contributes to the overall risk score
- Weighted scores are calculated based on policy importance
- Visual indicators show which policies triggered
- Detailed reasons explain each decision

## Color Coding

- **Red (High Risk)**: Score > 70
- **Yellow (Medium Risk)**: Score 30-70
- **Green (Low Risk)**: Score < 30

## Next Steps

To see the full policy breakdown:
1. Ensure OPA server is running
2. Policies are loaded from `backend/policies/bundle/`
3. Access logs will include detailed policy results
4. View button will show comprehensive analysis
