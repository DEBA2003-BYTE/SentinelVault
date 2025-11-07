# 🔒 OPA-Based Comprehensive Risk Assessment System

## Overview
This document describes the implementation of a comprehensive 10-factor risk assessment system using Open Policy Agent (OPA) for SentinelVault. The system evaluates user login attempts against multiple risk factors and provides detailed explanations for access decisions.

## 🎯 Risk Factors & Scoring

### 1. Device Fingerprint Mismatch (Weight: 20/100)
- **New Device**: +20 points
- **Known Device**: +0 points
- **Detection**: Compares current device fingerprint with registered fingerprint
- **Impact**: Highest weight due to strong identity correlation

### 2. Location Anomaly (Weight: 15/100)
- **New Country**: +15 points
- **New City (Same Country)**: +10 points
- **Same Location**: +0 points
- **Detection**: IP geolocation comparison with registered location
- **Impact**: High weight due to geographic security implications

### 3. Login Time Deviation (Weight: 10/100)
- **Outside Normal Hours** (before 9 AM or after 9 PM): +10 points
- **Normal Hours**: +0 points
- **Detection**: Time-based analysis of login attempts
- **Impact**: Moderate weight for behavioral pattern analysis

### 4. Typing Speed Variance (Weight: 10/100)
- **>30% Deviation**: +10 points
- **15-30% Deviation**: +5 points
- **<15% Deviation**: +0 points
- **Detection**: Keystroke dynamics analysis comparing to baseline
- **Impact**: Biometric behavioral authentication

### 5. Failed Login Attempts (Weight: 15/100)
- **3+ Attempts**: +15 points
- **2 Attempts**: +8 points
- **1 Attempt**: +4 points
- **0 Attempts**: +0 points
- **Detection**: Session-based failed attempt tracking
- **Impact**: High weight due to brute force indication

### 6. Browser/OS Anomaly (Weight: 10/100)
- **New Browser/OS**: +10 points
- **Known Configuration**: +0 points
- **Detection**: User-Agent string comparison
- **Impact**: Moderate weight for environment consistency

### 7. Network Reputation (Weight: 10/100)
- **Known VPN/Tor**: +10 points
- **Suspicious IP**: +7 points
- **Clean IP**: +0 points
- **Detection**: IP reputation analysis and VPN/Tor detection
- **Impact**: Moderate weight for network security

### 8. Behavioral Pattern (Weight: 10/100)
- **Unusual Navigation**: +10 points
- **Normal Pattern**: +0 points
- **Detection**: Navigation pattern analysis
- **Impact**: Moderate weight for user behavior consistency

### 9. Account Age (Weight: 5/100)
- **<24 Hours**: +5 points
- **>7 Days**: +0 points
- **Detection**: Account creation timestamp analysis
- **Impact**: Low weight but important for new account security

### 10. Recent Activity (Weight: 5/100)
- **Multiple Logins in Short Time**: +5 points
- **Normal Activity**: +0 points
- **Detection**: Login frequency analysis within time windows
- **Impact**: Low weight for activity pattern monitoring

## 🚦 Risk Thresholds

### Low Risk (0-30 points)
- **Action**: Grant full access
- **Description**: Normal user behavior with minimal risk indicators
- **Response**: Standard authentication flow

### Medium Risk (31-70 points)
- **Action**: Require Multi-Factor Authentication
- **Description**: Elevated risk requiring additional verification
- **Response**: Prompt for MFA (fingerprint, face recognition, etc.)

### High Risk (71-100 points)
- **Action**: Block access and require admin verification
- **Description**: High-risk behavior indicating potential security threat
- **Response**: Access denied with detailed explanation

## 🧠 OPA Policy Implementation

### Policy Structure
```rego
package risk_assessment

# Individual risk calculations
device_risk := 20 if input.device_fingerprint != input.user.registered_device_fingerprint
location_risk := 15 if input.location.country != input.user.registered_location.country
# ... additional factors

# Total risk score
risk_score := device_risk + location_risk + ... + recent_activity_risk

# Risk level determination
risk_level := "low" if risk_score <= 30
risk_level := "medium" if risk_score > 30; risk_score <= 70
risk_level := "high" if risk_score > 70

# Access decision
allow := true if risk_level == "low"
allow := false if risk_level == "high"
```

### Policy Evaluation Endpoint
- **URL**: `POST /v1/data/risk_assessment`
- **Input**: Comprehensive risk context
- **Output**: Risk score, level, reasons, and suggested action

## 📊 Risk Context Collection

### Backend Risk Assessment Service
The `RiskAssessmentService` collects comprehensive context:

```typescript
interface RiskContext {
  user: {
    id: string;
    email: string;
    registered_device_fingerprint?: string;
    registered_location?: LocationInfo;
    baseline_typing_speed?: number;
    created_at: string;
  };
  device_fingerprint?: string;
  location?: LocationInfo;
  typing_speed?: number;
  failed_login_attempts: number;
  network?: NetworkInfo;
  behavioral_score: number;
  recent_login_count: number;
  // ... additional context
}
```

### Data Collection Methods
1. **Device Fingerprinting**: Browser characteristics, screen resolution, timezone
2. **Geolocation**: IP-based location detection using geoip-lite
3. **Network Analysis**: VPN/Tor detection, IP reputation checking
4. **Behavioral Analysis**: Navigation patterns, keystroke dynamics
5. **Temporal Analysis**: Login time patterns, account age calculation

## 🔍 Detailed Risk Response

### Example High-Risk Response
```json
{
  "allowed": false,
  "risk_score": 75,
  "risk_level": "high",
  "reasons": [
    "New device detected (+20)",
    "Login from new country (+15)",
    "Using VPN (+10)",
    "Outside normal hours (+10)",
    "Typing speed variance (+10)",
    "Multiple login attempts (+10)"
  ],
  "suggested_action": "Block access and require admin verification",
  "detailed_factors": {
    "device_fingerprint": true,
    "location_anomaly": true,
    "typing_speed_variance": 35.2,
    "failed_attempts": 3,
    "behavioral_score": 75,
    "network_reputation": "suspicious",
    "account_age_hours": 2.5
  }
}
```

## 🎨 Frontend Risk Visualization

### Risk Assessment Modal
The `RiskAssessmentModal` component provides:
- **Overall Risk Score**: Visual gauge with color coding
- **Factor Breakdown**: Individual risk factor analysis
- **Detailed Explanations**: User-friendly descriptions
- **Actionable Insights**: Clear next steps for users

### Risk Factor Display
Each factor shows:
- **Risk Score Contribution**: Points added to total
- **Status Indicator**: Safe/Warning/Danger classification
- **Description**: Human-readable explanation
- **Icon**: Visual representation of the factor

## 🔧 API Integration

### Comprehensive Login Endpoint
- **URL**: `POST /api/auth/login-comprehensive`
- **Features**:
  - Full risk assessment integration
  - Keystroke dynamics capture
  - Detailed risk response
  - MFA requirement handling

### Request Format
```json
{
  "email": "user@example.com",
  "password": "password123",
  "keystrokes": [
    {"timestamp": 1699123456789, "key": "p"},
    {"timestamp": 1699123456889, "key": "a"}
  ],
  "deviceFingerprint": "device_hash_123",
  "location": "New York, NY, USA"
}
```

### Response Handling
- **Success (200)**: Low risk - access granted
- **MFA Required (202)**: Medium risk - additional authentication needed
- **Access Denied (403)**: High risk - detailed explanation provided

## 🧪 Testing & Validation

### Test Interface
The `test-comprehensive-risk.html` provides:
- **Risk Factor Simulation**: Configure individual risk factors
- **Real-time Calculation**: See risk scores update dynamically
- **Threshold Testing**: Validate risk level boundaries
- **Response Analysis**: Examine detailed OPA responses

### Test Scenarios
1. **Clean Login**: All factors normal (0 points)
2. **New Device**: Device mismatch (+20 points)
3. **Location Change**: Geographic anomaly (+15 points)
4. **Combined Risks**: Multiple factors triggering
5. **Threshold Testing**: Boundary conditions (30, 70 points)

## 🔒 Security Considerations

### Privacy Protection
- **Local Processing**: Biometric data processed client-side
- **Hash Storage**: Only cryptographic hashes stored
- **Data Minimization**: Collect only necessary risk factors
- **Audit Trails**: Comprehensive logging for security analysis

### Performance Optimization
- **Caching**: Risk context caching for repeated evaluations
- **Async Processing**: Non-blocking risk assessment
- **Fallback Mechanisms**: Graceful degradation if OPA unavailable
- **Rate Limiting**: Prevent abuse of risk assessment endpoints

## 📈 Monitoring & Analytics

### Risk Metrics
- **Average Risk Scores**: Track risk distribution
- **Factor Frequency**: Most common risk triggers
- **Threshold Effectiveness**: Access decision accuracy
- **False Positive Rates**: Legitimate users blocked

### Admin Dashboard Integration
- **Risk Trends**: Historical risk score analysis
- **Factor Analysis**: Individual factor performance
- **User Risk Profiles**: Per-user risk patterns
- **Policy Effectiveness**: OPA rule performance metrics

## 🚀 Future Enhancements

### Advanced Risk Factors
1. **Machine Learning Integration**: Behavioral pattern learning
2. **Threat Intelligence**: Real-time threat feed integration
3. **Biometric Liveness**: Advanced biometric verification
4. **Social Engineering Detection**: Communication pattern analysis

### Policy Evolution
1. **Dynamic Thresholds**: Adaptive risk thresholds
2. **User-Specific Baselines**: Personalized risk profiles
3. **Contextual Policies**: Time/location-based rules
4. **Risk Decay**: Time-based risk score reduction

This comprehensive risk assessment system provides enterprise-grade security with complete transparency, enabling users to understand and trust the authentication decisions while maintaining the highest levels of security.