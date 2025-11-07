# 🛡️ OPA-Based Risk Engine Implementation

## Overview

This implementation provides a comprehensive OPA (Open Policy Agent) based risk engine for SentinelVault, featuring 10 sophisticated security policies, mandatory GPS location detection, and real-time risk assessment.

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │      OPA       │
│                 │    │                 │    │                 │
│ GPS Detection   │───▶│ Risk Evaluation │───▶│ Policy Bundle   │
│ Login Form      │    │ API Endpoint    │    │ 10 Policies     │
│ Location UI     │    │ Data Builder    │    │ Data Store      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📋 Features Implemented

### ✅ Core Requirements

1. **GPS Location Enforcement**
   - Mandatory GPS detection on login page
   - Blocks login if location access denied
   - Reverse geocoding for city/country detection
   - Clear user messaging and instructions

2. **10 OPA Policies Implemented**
   - Device Trust Policy
   - Geo-Location Anomaly Policy
   - Impossible Travel Detection
   - Suspicious IP/ASN Policy
   - Failed Login Attempt Policy
   - Privilege Escalation Policy
   - Time-Based Access Policy
   - MFA Enforcement Policy
   - Behavioral Anomaly Policy
   - Contextual Risk Score Aggregation Policy

3. **Risk Score Calculation**
   - Weighted scoring system
   - Three action levels: Allow (<30), Require MFA (30-70), Deny (>70)
   - Context-aware adjustments
   - Real-time evaluation

4. **Data Persistence**
   - User location tracking
   - Failed login attempt logging
   - Device fingerprint management
   - Behavioral baseline building

## 📁 File Structure

```
backend/
├── policies/
│   ├── bundle/
│   │   ├── device_trust.rego
│   │   ├── geo_location_anomaly.rego
│   │   ├── impossible_travel.rego
│   │   ├── suspicious_ip.rego
│   │   ├── failed_login_attempts.rego
│   │   ├── privilege_escalation.rego
│   │   ├── time_based_access.rego
│   │   ├── mfa_enforcement.rego
│   │   ├── behavioral_anomaly.rego
│   │   └── risk_aggregation.rego
│   ├── data.json
│   ├── input.json
│   └── config.yaml
├── routes/
│   └── riskEvaluation.ts
└── ...

frontend/
├── src/
│   └── components/
│       └── auth/
│           ├── GPSLocationDetector.tsx
│           └── LoginForm.tsx (updated)
└── ...

docker-compose.opa.yml
nginx-opa.conf
test-opa-policies.sh
```

## 🚀 Quick Start

### 1. Start Everything with One Command

```bash
# Start Backend + Frontend + OPA Risk Engine
./start-all.sh
```

This will automatically:
- ✅ Start OPA server with policy bundle
- ✅ Load policy data into OPA
- ✅ Start backend with risk evaluation API
- ✅ Start frontend with GPS location detection
- ✅ Verify all services are healthy

### 2. Check Service Status

```bash
# Check if all services are running
./status.sh
```

### 3. Test OPA Policies

```bash
# Run comprehensive policy tests
./test-opa-policies.sh

# Run individual policy examples
./test-policy-examples.sh
```

### 4. Stop All Services

```bash
# Stop everything cleanly
./stop-all.sh
```

### 4. Test GPS Location Flow

1. Navigate to login page
2. Allow location access when prompted
3. Complete login with location-based risk assessment

## 🔧 Policy Details

### 1. Device Trust Policy (`device_trust.rego`)

**Purpose**: Evaluates device fingerprint against known trusted devices

**Risk Factors**:
- Unknown device: +25 points
- Trusted device: 0 points

**Decision Logic**:
```rego
allow if {
    input.device_fingerprint in data.trusted_devices
}

risk_score := 25 if {
    not input.device_fingerprint in data.trusted_devices
}
```

### 2. Geo-Location Anomaly Policy (`geo_location_anomaly.rego`)

**Purpose**: Detects unusual geographic locations for user access

**Risk Factors**:
- Blocked country: +50 points (DENY)
- Different country: +15 points
- New user: +5 points
- Same country: 0 points

**Decision Logic**:
```rego
allow := false if {
    input.location.country in data.blocked_countries
}
```

### 3. Impossible Travel Detection (`impossible_travel.rego`)

**Purpose**: Detects physically impossible travel between login locations

**Risk Factors**:
- Impossible travel (>1000 km/h): +40 points (DENY)
- Long distance travel: +10 points
- Local travel: 0 points

**Algorithm**:
- Uses Haversine formula for distance calculation
- Considers maximum realistic travel speed
- Accounts for time differences between logins

### 4. Suspicious IP/ASN Policy (`suspicious_ip.rego`)

**Purpose**: Detects malicious IPs, VPNs, and suspicious network patterns

**Risk Factors**:
- Malicious IP: +50 points (DENY)
- Tor exit node: +30 points
- VPN/Proxy: +20 points
- High-risk country: +10 points
- Clean IP: 0 points

**Detection Methods**:
- Malicious IP blacklist
- ASN name pattern matching
- Known VPN provider detection

### 5. Failed Login Attempt Policy (`failed_login_attempts.rego`)

**Purpose**: Tracks and evaluates failed login attempts for brute force detection

**Risk Factors**:
- ≥5 failed attempts (user): +40 points (DENY)
- ≥10 failed attempts (IP): +35 points (DENY)
- Distributed attack: +50 points (DENY)
- 3-4 failed attempts: +25 points
- 1-2 failed attempts: +15 points

**Features**:
- Time-based analysis (1-hour window)
- IP-based tracking
- Distributed attack detection

### 6. Privilege Escalation Policy (`privilege_escalation.rego`)

**Purpose**: Detects attempts to access admin functions or escalate privileges

**Risk Factors**:
- Non-admin accessing admin endpoints: +50 points (DENY)
- Suspicious admin access patterns: +25 points
- Normal admin access: +15 points
- Regular user access: 0 points

**Detection**:
- Admin endpoint pattern matching
- Unusual admin access times/locations
- Action-based privilege checks

### 7. Time-Based Access Policy (`time_based_access.rego`)

**Purpose**: Enforces time-based access controls and detects unusual access times

**Risk Factors**:
- Night + weekend + unusual time: +30 points
- Unusual day access: +25 points
- Unusual time access: +20 points
- Night access: +15 points
- Weekend access: +10 points
- Extended hours: +5 points
- Business hours: 0 points

**Features**:
- Business hours detection (9 AM - 6 PM, Mon-Fri)
- User baseline comparison
- Admin flexible access

### 8. MFA Enforcement Policy (`mfa_enforcement.rego`)

**Purpose**: Determines when Multi-Factor Authentication should be required

**MFA Required For**:
- Admin users without MFA
- High-value actions
- New devices
- Unusual locations
- High-risk IP addresses

**Risk Factors**:
- Admin without MFA: +40 points (DENY if no MFA configured)
- Required but not configured: +30 points (DENY)
- Required but not provided: +20 points (DENY)
- Optional but available: +10 points

### 9. Behavioral Anomaly Policy (`behavioral_anomaly.rego`)

**Purpose**: Detects unusual user behavior patterns

**Anomaly Detection**:
- Unusual user agent: +5 points
- Unusual session patterns: +10 points
- Unusual activity frequency: +15 points
- Unusual file access: +10 points
- Unusual data volume: +20 points
- Velocity anomaly: +25 points
- Unusual navigation: +15 points

**Severe Anomalies** (DENY):
- Velocity + data volume + 3+ anomalies: +45 points

### 10. Risk Aggregation Policy (`risk_aggregation.rego`)

**Purpose**: Combines all policy results into final risk assessment

**Weighted Scoring**:
- Privilege escalation: 2.0x weight
- Impossible travel: 1.5x weight
- Failed attempts: 1.4x weight
- Suspicious IP: 1.3x weight
- Device trust: 1.2x weight
- MFA enforcement: 1.1x weight
- Others: 1.0x weight

**Context Adjustments**:
- Admin in business hours: -5 points
- New user: +10 points
- Trusted network: -10 points
- Business hours: -5 points

**Final Actions**:
- Risk < 30: Allow
- Risk 30-70: Require MFA
- Risk > 70: Deny
- Any policy DENY: Deny

## 🌐 GPS Location Implementation

### Frontend Component (`GPSLocationDetector.tsx`)

**Features**:
- Mandatory GPS permission request
- Real-time location detection status
- Reverse geocoding for readable locations
- Clear error messages and instructions
- Privacy-friendly explanations

**User Experience**:
```typescript
// Location detection states
'requesting' → 'detecting' → 'success' | 'denied' | 'error'

// User guidance
- Why location is needed
- How to enable location access
- Privacy assurances (city-level only)
- Fallback instructions
```

### Backend Integration

**Risk Evaluation Endpoint**: `POST /api/risk-evaluation/evaluate-risk`

**Request Format**:
```json
{
  "user_id": "user123",
  "action": "login",
  "timestamp": "2024-11-06T15:30:00Z",
  "ip_address": "192.168.1.10",
  "location": {
    "latitude": 40.7128,
    "longitude": -74.0060,
    "country": "US",
    "city": "New York"
  },
  "device_fingerprint": "device_hash",
  "mfa_verified": false
}
```

**Response Format**:
```json
{
  "decision": "require_mfa",
  "allow": false,
  "risk_score": 45,
  "reason": "MFA required due to elevated risk",
  "require_mfa": true,
  "policy_results": { /* detailed policy results */ },
  "details": { /* additional context */ }
}
```

## 🧪 Testing

### Automated Testing

```bash
# Run all policy tests
./test-opa-policies.sh

# Test specific policy
curl -X POST "http://localhost:8181/v1/data/device_trust/decision" \
  -H "Content-Type: application/json" \
  -d '{"input": {"device_fingerprint": "test_device"}}'
```

### Manual Testing Scenarios

1. **Trusted Device Login**
   - Use known device fingerprint
   - Expected: Low risk, allow access

2. **New Location Login**
   - Login from different country
   - Expected: Medium risk, require MFA

3. **Suspicious IP Login**
   - Use VPN or malicious IP
   - Expected: High risk, deny access

4. **Failed Login Attempts**
   - Make 5+ failed attempts
   - Expected: Account blocked

5. **Admin Access**
   - Non-admin accessing admin endpoints
   - Expected: Privilege escalation detected, deny

6. **Impossible Travel**
   - Login from distant location too quickly
   - Expected: Impossible travel detected, deny

## 📊 Monitoring and Analytics

### Policy Status Endpoint

```bash
GET /api/risk-evaluation/policy-status
```

**Response**:
```json
{
  "opa_healthy": true,
  "opa_url": "http://localhost:8181",
  "policies_loaded": true,
  "last_data_refresh": "2024-11-06T15:30:00Z"
}
```

### Refresh Policy Data

```bash
POST /api/risk-evaluation/refresh-policy-data
Authorization: Bearer <admin-token>
```

### Access Logs

All risk evaluations are logged to `AccessLog` collection:
```typescript
{
  userId: ObjectId,
  action: string,
  riskScore: number,
  allowed: boolean,
  reason: string,
  policyResults: object,
  timestamp: Date
}
```

## 🔧 Configuration

### Environment Variables

```env
# OPA Configuration
OPA_URL=http://localhost:8181

# Risk Thresholds
RISK_THRESHOLD_LOW=30
RISK_THRESHOLD_HIGH=70

# GPS Location
GPS_REQUIRED=true
GPS_TIMEOUT=15000
```

### Policy Data Updates

**Trusted Devices**:
```bash
# Add trusted device
curl -X PATCH "http://localhost:8181/v1/data/trusted_devices" \
  -d '["new_device_fingerprint"]'
```

**Blocked Countries**:
```bash
# Update blocked countries
curl -X PUT "http://localhost:8181/v1/data/blocked_countries" \
  -d '["KP", "IR", "SY", "CU", "SD", "AF"]'
```

**Malicious IPs**:
```bash
# Add malicious IP
curl -X PATCH "http://localhost:8181/v1/data/malicious_ips" \
  -d '["new.malicious.ip"]'
```

## 🚨 Security Considerations

### Data Privacy
- Only city/country level location stored
- GPS coordinates not persisted
- User consent required for location access
- Clear privacy policy explanations

### Policy Security
- Policies are read-only from application
- OPA server should be secured in production
- Policy data encrypted in transit
- Regular security audits recommended

### Performance
- Policies evaluated in parallel
- Caching for frequently accessed data
- Optimized Rego code for speed
- Monitoring for policy evaluation times

## 🔄 Maintenance

### Regular Tasks

1. **Update Policy Data**
   - Refresh trusted devices weekly
   - Update malicious IP lists daily
   - Review blocked countries monthly

2. **Monitor Policy Performance**
   - Check evaluation times
   - Review false positive rates
   - Analyze user feedback

3. **Security Reviews**
   - Audit policy logic quarterly
   - Review risk thresholds
   - Update threat intelligence

### Troubleshooting

**OPA Not Responding**:
```bash
# Check OPA health
curl http://localhost:8181/health

# Restart OPA
docker-compose -f docker-compose.opa.yml restart opa
```

**High False Positive Rate**:
- Review risk thresholds
- Adjust policy weights
- Update user baselines

**GPS Detection Issues**:
- Ensure HTTPS for production
- Check browser permissions
- Verify reverse geocoding API

## 📈 Future Enhancements

### Planned Features
1. **Machine Learning Integration**
   - Behavioral anomaly detection with ML
   - Dynamic risk threshold adjustment
   - Predictive threat modeling

2. **Advanced Biometrics**
   - Voice pattern analysis
   - Keystroke dynamics
   - Mouse movement patterns

3. **Threat Intelligence**
   - Real-time IP reputation feeds
   - Automated threat indicator updates
   - Community threat sharing

4. **Enhanced Analytics**
   - Risk trend analysis
   - User behavior insights
   - Security dashboard

### Integration Opportunities
- SIEM system integration
- Threat intelligence platforms
- Identity providers (SAML, OAuth)
- Mobile device management

## 📚 Resources

### Documentation
- [OPA Documentation](https://www.openpolicyagent.org/docs/)
- [Rego Language Guide](https://www.openpolicyagent.org/docs/latest/policy-language/)
- [Risk Assessment Best Practices](https://owasp.org/www-community/controls/Risk_Assessment)

### Tools
- [OPA Playground](https://play.openpolicyagent.org/)
- [Rego Testing Framework](https://www.openpolicyagent.org/docs/latest/policy-testing/)
- [Policy Performance Profiler](https://www.openpolicyagent.org/docs/latest/policy-performance/)

---

## 🎉 Implementation Complete!

This comprehensive OPA-based risk engine provides enterprise-grade security with:

- ✅ 10 sophisticated security policies
- ✅ Mandatory GPS location detection
- ✅ Real-time risk assessment
- ✅ Comprehensive testing suite
- ✅ Production-ready deployment
- ✅ Detailed documentation

The system is now ready for production deployment with robust security policies, user-friendly GPS location detection, and comprehensive risk assessment capabilities.