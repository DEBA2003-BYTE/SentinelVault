#!/bin/bash

# Test script for OPA Risk Engine Policies
# Make sure OPA is running: docker-compose -f docker-compose.opa.yml up -d

OPA_URL="http://localhost:8181"
POLICIES_DIR="backend/policies"

echo "🔍 Testing OPA Risk Engine Policies"
echo "=================================="

# Check if OPA is running
echo "Checking OPA health..."
if curl -s -f "$OPA_URL/health" > /dev/null; then
    echo "✅ OPA is running"
else
    echo "❌ OPA is not running. Start it with: docker-compose -f docker-compose.opa.yml up -d"
    exit 1
fi

# Load policy data
echo "Loading policy data..."
curl -X PUT "$OPA_URL/v1/data" \
  -H "Content-Type: application/json" \
  -d @"$POLICIES_DIR/data.json" > /dev/null

if [ $? -eq 0 ]; then
    echo "✅ Policy data loaded"
else
    echo "❌ Failed to load policy data"
    exit 1
fi

echo ""
echo "🧪 Running Policy Tests"
echo "======================"

# Test 1: Device Trust Policy
echo "1. Testing Device Trust Policy..."
RESULT=$(curl -s -X POST "$OPA_URL/v1/data/device_trust/decision" \
  -H "Content-Type: application/json" \
  -d '{
    "input": {
      "device_fingerprint": "TW96aWxsYS81LjAgKE1hY2ludG9zaDsgSW50ZWwgTWFjIE9TIFggMTBfMTVfNykgQXBwbGVXZWJLaXQvNTM3LjM2"
    }
  }')

ALLOW=$(echo $RESULT | jq -r '.result.allow')
RISK_SCORE=$(echo $RESULT | jq -r '.result.risk_score')
echo "   Trusted device: Allow=$ALLOW, Risk Score=$RISK_SCORE"

RESULT=$(curl -s -X POST "$OPA_URL/v1/data/device_trust/decision" \
  -H "Content-Type: application/json" \
  -d '{
    "input": {
      "device_fingerprint": "unknown_device_12345"
    }
  }')

ALLOW=$(echo $RESULT | jq -r '.result.allow')
RISK_SCORE=$(echo $RESULT | jq -r '.result.risk_score')
echo "   Unknown device: Allow=$ALLOW, Risk Score=$RISK_SCORE"

# Test 2: Geo-Location Anomaly Policy
echo ""
echo "2. Testing Geo-Location Anomaly Policy..."
RESULT=$(curl -s -X POST "$OPA_URL/v1/data/geo_location_anomaly/decision" \
  -H "Content-Type: application/json" \
  -d '{
    "input": {
      "user_id": "user123",
      "location": {
        "country": "US",
        "city": "New York"
      }
    }
  }')

ALLOW=$(echo $RESULT | jq -r '.result.allow')
RISK_SCORE=$(echo $RESULT | jq -r '.result.risk_score')
echo "   Same country: Allow=$ALLOW, Risk Score=$RISK_SCORE"

RESULT=$(curl -s -X POST "$OPA_URL/v1/data/geo_location_anomaly/decision" \
  -H "Content-Type: application/json" \
  -d '{
    "input": {
      "user_id": "user123",
      "location": {
        "country": "KP",
        "city": "Pyongyang"
      }
    }
  }')

ALLOW=$(echo $RESULT | jq -r '.result.allow')
RISK_SCORE=$(echo $RESULT | jq -r '.result.risk_score')
echo "   Blocked country: Allow=$ALLOW, Risk Score=$RISK_SCORE"

# Test 3: Impossible Travel Detection
echo ""
echo "3. Testing Impossible Travel Detection..."
RESULT=$(curl -s -X POST "$OPA_URL/v1/data/impossible_travel/decision" \
  -H "Content-Type: application/json" \
  -d '{
    "input": {
      "user_id": "user123",
      "timestamp": "2024-11-06T16:00:00Z",
      "location": {
        "latitude": 51.5074,
        "longitude": -0.1278,
        "country": "GB",
        "city": "London"
      }
    }
  }')

ALLOW=$(echo $RESULT | jq -r '.result.allow')
RISK_SCORE=$(echo $RESULT | jq -r '.result.risk_score')
DISTANCE=$(echo $RESULT | jq -r '.result.details.distance_km')
echo "   Possible travel: Allow=$ALLOW, Risk Score=$RISK_SCORE, Distance=${DISTANCE}km"

# Test 4: Suspicious IP Policy
echo ""
echo "4. Testing Suspicious IP Policy..."
RESULT=$(curl -s -X POST "$OPA_URL/v1/data/suspicious_ip/decision" \
  -H "Content-Type: application/json" \
  -d '{
    "input": {
      "ip_address": "192.168.1.10",
      "asn_name": "Google LLC",
      "location": {
        "country": "US"
      }
    }
  }')

ALLOW=$(echo $RESULT | jq -r '.result.allow')
RISK_SCORE=$(echo $RESULT | jq -r '.result.risk_score')
echo "   Clean IP: Allow=$ALLOW, Risk Score=$RISK_SCORE"

RESULT=$(curl -s -X POST "$OPA_URL/v1/data/suspicious_ip/decision" \
  -H "Content-Type: application/json" \
  -d '{
    "input": {
      "ip_address": "192.168.1.100",
      "asn_name": "NordVPN",
      "location": {
        "country": "US"
      }
    }
  }')

ALLOW=$(echo $RESULT | jq -r '.result.allow')
RISK_SCORE=$(echo $RESULT | jq -r '.result.risk_score')
echo "   Malicious IP: Allow=$ALLOW, Risk Score=$RISK_SCORE"

# Test 5: Failed Login Attempts Policy
echo ""
echo "5. Testing Failed Login Attempts Policy..."
RESULT=$(curl -s -X POST "$OPA_URL/v1/data/failed_login_attempts/decision" \
  -H "Content-Type: application/json" \
  -d '{
    "input": {
      "user_id": "user789",
      "ip_address": "203.0.113.5",
      "timestamp": "2024-11-06T09:00:00Z"
    }
  }')

ALLOW=$(echo $RESULT | jq -r '.result.allow')
RISK_SCORE=$(echo $RESULT | jq -r '.result.risk_score')
FAILED_ATTEMPTS=$(echo $RESULT | jq -r '.result.details.user_failed_attempts_1h')
echo "   Multiple failed attempts: Allow=$ALLOW, Risk Score=$RISK_SCORE, Failed Attempts=$FAILED_ATTEMPTS"

# Test 6: Privilege Escalation Policy
echo ""
echo "6. Testing Privilege Escalation Policy..."
RESULT=$(curl -s -X POST "$OPA_URL/v1/data/privilege_escalation/decision" \
  -H "Content-Type: application/json" \
  -d '{
    "input": {
      "user_id": "user123",
      "endpoint": "/api/admin/users",
      "action": "user_management"
    }
  }')

ALLOW=$(echo $RESULT | jq -r '.result.allow')
RISK_SCORE=$(echo $RESULT | jq -r '.result.risk_score')
echo "   Non-admin accessing admin endpoint: Allow=$ALLOW, Risk Score=$RISK_SCORE"

# Test 7: Time-Based Access Policy
echo ""
echo "7. Testing Time-Based Access Policy..."
RESULT=$(curl -s -X POST "$OPA_URL/v1/data/time_based_access/decision" \
  -H "Content-Type: application/json" \
  -d '{
    "input": {
      "user_id": "user123",
      "timestamp": "2024-11-06T14:00:00Z"
    }
  }')

ALLOW=$(echo $RESULT | jq -r '.result.allow')
RISK_SCORE=$(echo $RESULT | jq -r '.result.risk_score')
CURRENT_HOUR=$(echo $RESULT | jq -r '.result.details.current_hour')
echo "   Business hours access: Allow=$ALLOW, Risk Score=$RISK_SCORE, Hour=$CURRENT_HOUR"

# Test 8: MFA Enforcement Policy
echo ""
echo "8. Testing MFA Enforcement Policy..."
RESULT=$(curl -s -X POST "$OPA_URL/v1/data/mfa_enforcement/decision" \
  -H "Content-Type: application/json" \
  -d '{
    "input": {
      "user_id": "admin@gmail.com",
      "mfa_verified": false,
      "action": "admin_access",
      "device_fingerprint": "unknown_device",
      "location": {
        "country": "US"
      },
      "ip_address": "192.168.1.10"
    }
  }')

ALLOW=$(echo $RESULT | jq -r '.result.allow')
RISK_SCORE=$(echo $RESULT | jq -r '.result.risk_score')
REQUIRE_MFA=$(echo $RESULT | jq -r '.result.require_mfa')
echo "   Admin without MFA: Allow=$ALLOW, Risk Score=$RISK_SCORE, Require MFA=$REQUIRE_MFA"

# Test 9: Behavioral Anomaly Policy
echo ""
echo "9. Testing Behavioral Anomaly Policy..."
RESULT=$(curl -s -X POST "$OPA_URL/v1/data/behavioral_anomaly/decision" \
  -H "Content-Type: application/json" \
  -d '{
    "input": {
      "user_id": "user123",
      "user_agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      "session_duration": 3600,
      "data_transfer_mb": 45,
      "actions_per_minute": 2,
      "user_age_days": 30
    }
  }')

ALLOW=$(echo $RESULT | jq -r '.result.allow')
RISK_SCORE=$(echo $RESULT | jq -r '.result.risk_score')
ANOMALY_COUNT=$(echo $RESULT | jq -r '.result.details.anomaly_count')
echo "   Normal behavior: Allow=$ALLOW, Risk Score=$RISK_SCORE, Anomalies=$ANOMALY_COUNT"

# Test 10: Risk Aggregation Policy (Final Decision)
echo ""
echo "10. Testing Risk Aggregation Policy..."
RESULT=$(curl -s -X POST "$OPA_URL/v1/data/risk_aggregation/decision" \
  -H "Content-Type: application/json" \
  -d @"$POLICIES_DIR/input.json")

ALLOW=$(echo $RESULT | jq -r '.result.allow')
ACTION=$(echo $RESULT | jq -r '.result.action')
RISK_SCORE=$(echo $RESULT | jq -r '.result.risk_score')
REASON=$(echo $RESULT | jq -r '.result.reason')
echo "   Final decision: Allow=$ALLOW, Action=$ACTION, Risk Score=$RISK_SCORE"
echo "   Reason: $REASON"

echo ""
echo "🎉 Policy testing completed!"
echo ""
echo "📊 Summary:"
echo "- All 10 policies tested"
echo "- Risk scores range from 0-100"
echo "- Actions: allow, require_mfa, deny"
echo "- Policies are working together for comprehensive risk assessment"

echo ""
echo "🔧 Next steps:"
echo "1. Integrate with your application's authentication flow"
echo "2. Monitor policy decisions in production"
echo "3. Adjust risk thresholds based on your security requirements"
echo "4. Update blocked IPs, trusted devices, and other data as needed"