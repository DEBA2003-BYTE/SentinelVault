#!/bin/bash

# Example curl commands to test each OPA policy individually
# Make sure OPA is running: docker-compose -f docker-compose.opa.yml up -d

OPA_URL="http://localhost:8181"

echo "🧪 OPA Policy Testing Examples"
echo "=============================="
echo ""

# Load policy data first
echo "📋 Loading policy data..."
curl -X PUT "$OPA_URL/v1/data" \
  -H "Content-Type: application/json" \
  -d @backend/policies/data.json > /dev/null

echo "✅ Policy data loaded"
echo ""

echo "1️⃣  DEVICE TRUST POLICY"
echo "======================"
echo ""

echo "🔹 Test 1.1: Trusted Device (should allow, risk score 0)"
curl -s -X POST "$OPA_URL/v1/data/device_trust/decision" \
  -H "Content-Type: application/json" \
  -d '{
    "input": {
      "device_fingerprint": "TW96aWxsYS81LjAgKE1hY2ludG9zaDsgSW50ZWwgTWFjIE9TIFggMTBfMTVfNykgQXBwbGVXZWJLaXQvNTM3LjM2"
    }
  }' | jq '.result | {allow, risk_score, reason}'

echo ""
echo "🔹 Test 1.2: Unknown Device (should allow, risk score 25)"
curl -s -X POST "$OPA_URL/v1/data/device_trust/decision" \
  -H "Content-Type: application/json" \
  -d '{
    "input": {
      "device_fingerprint": "unknown_device_fingerprint_12345"
    }
  }' | jq '.result | {allow, risk_score, reason}'

echo ""
echo "2️⃣  GEO-LOCATION ANOMALY POLICY"
echo "==============================="
echo ""

echo "🔹 Test 2.1: Same Country (should allow, low risk)"
curl -s -X POST "$OPA_URL/v1/data/geo_location_anomaly/decision" \
  -H "Content-Type: application/json" \
  -d '{
    "input": {
      "user_id": "user123",
      "location": {
        "country": "US",
        "city": "New York"
      }
    }
  }' | jq '.result | {allow, risk_score, reason}'

echo ""
echo "🔹 Test 2.2: Blocked Country (should deny, risk score 50)"
curl -s -X POST "$OPA_URL/v1/data/geo_location_anomaly/decision" \
  -H "Content-Type: application/json" \
  -d '{
    "input": {
      "user_id": "user123",
      "location": {
        "country": "KP",
        "city": "Pyongyang"
      }
    }
  }' | jq '.result | {allow, risk_score, reason}'

echo ""
echo "3️⃣  IMPOSSIBLE TRAVEL DETECTION"
echo "==============================="
echo ""

echo "🔹 Test 3.1: Reasonable Travel (should allow, low risk)"
curl -s -X POST "$OPA_URL/v1/data/impossible_travel/decision" \
  -H "Content-Type: application/json" \
  -d '{
    "input": {
      "user_id": "user123",
      "timestamp": "2024-11-06T16:00:00Z",
      "location": {
        "latitude": 40.7589,
        "longitude": -73.9851,
        "country": "US",
        "city": "New York"
      }
    }
  }' | jq '.result | {allow, risk_score, reason, details}'

echo ""
echo "🔹 Test 3.2: Impossible Travel (would deny if distance/time impossible)"
curl -s -X POST "$OPA_URL/v1/data/impossible_travel/decision" \
  -H "Content-Type: application/json" \
  -d '{
    "input": {
      "user_id": "user123",
      "timestamp": "2024-11-06T10:35:00Z",
      "location": {
        "latitude": 35.6762,
        "longitude": 139.6503,
        "country": "JP",
        "city": "Tokyo"
      }
    }
  }' | jq '.result | {allow, risk_score, reason, details}'

echo ""
echo "4️⃣  SUSPICIOUS IP/ASN POLICY"
echo "============================"
echo ""

echo "🔹 Test 4.1: Clean IP (should allow, risk score 0)"
curl -s -X POST "$OPA_URL/v1/data/suspicious_ip/decision" \
  -H "Content-Type: application/json" \
  -d '{
    "input": {
      "ip_address": "8.8.8.8",
      "asn_name": "Google LLC",
      "location": {
        "country": "US"
      }
    }
  }' | jq '.result | {allow, risk_score, reason}'

echo ""
echo "🔹 Test 4.2: Malicious IP (should deny, risk score 50)"
curl -s -X POST "$OPA_URL/v1/data/suspicious_ip/decision" \
  -H "Content-Type: application/json" \
  -d '{
    "input": {
      "ip_address": "192.168.1.100",
      "asn_name": "Unknown ASN",
      "location": {
        "country": "US"
      }
    }
  }' | jq '.result | {allow, risk_score, reason}'

echo ""
echo "🔹 Test 4.3: VPN Detection (should allow, risk score 20)"
curl -s -X POST "$OPA_URL/v1/data/suspicious_ip/decision" \
  -H "Content-Type: application/json" \
  -d '{
    "input": {
      "ip_address": "185.220.100.240",
      "asn_name": "NordVPN",
      "location": {
        "country": "US"
      }
    }
  }' | jq '.result | {allow, risk_score, reason}'

echo ""
echo "5️⃣  FAILED LOGIN ATTEMPTS POLICY"
echo "================================"
echo ""

echo "🔹 Test 5.1: No Failed Attempts (should allow, risk score 0)"
curl -s -X POST "$OPA_URL/v1/data/failed_login_attempts/decision" \
  -H "Content-Type: application/json" \
  -d '{
    "input": {
      "user_id": "user456",
      "ip_address": "192.168.1.20",
      "timestamp": "2024-11-06T15:00:00Z"
    }
  }' | jq '.result | {allow, risk_score, reason}'

echo ""
echo "🔹 Test 5.2: Multiple Failed Attempts (should deny, high risk)"
curl -s -X POST "$OPA_URL/v1/data/failed_login_attempts/decision" \
  -H "Content-Type: application/json" \
  -d '{
    "input": {
      "user_id": "user789",
      "ip_address": "203.0.113.5",
      "timestamp": "2024-11-06T09:00:00Z"
    }
  }' | jq '.result | {allow, risk_score, reason, details}'

echo ""
echo "6️⃣  PRIVILEGE ESCALATION POLICY"
echo "==============================="
echo ""

echo "🔹 Test 6.1: Regular User Access (should allow, risk score 0)"
curl -s -X POST "$OPA_URL/v1/data/privilege_escalation/decision" \
  -H "Content-Type: application/json" \
  -d '{
    "input": {
      "user_id": "user123",
      "endpoint": "/api/files",
      "action": "file_upload"
    }
  }' | jq '.result | {allow, risk_score, reason}'

echo ""
echo "🔹 Test 6.2: Non-Admin Accessing Admin Endpoint (should deny, risk score 50)"
curl -s -X POST "$OPA_URL/v1/data/privilege_escalation/decision" \
  -H "Content-Type: application/json" \
  -d '{
    "input": {
      "user_id": "user123",
      "endpoint": "/api/admin/users",
      "action": "user_management"
    }
  }' | jq '.result | {allow, risk_score, reason}'

echo ""
echo "🔹 Test 6.3: Admin User Access (should allow, risk score 15)"
curl -s -X POST "$OPA_URL/v1/data/privilege_escalation/decision" \
  -H "Content-Type: application/json" \
  -d '{
    "input": {
      "user_id": "admin@gmail.com",
      "endpoint": "/api/admin/users",
      "action": "user_management"
    }
  }' | jq '.result | {allow, risk_score, reason}'

echo ""
echo "7️⃣  TIME-BASED ACCESS POLICY"
echo "============================"
echo ""

echo "🔹 Test 7.1: Business Hours Access (should allow, risk score 0)"
curl -s -X POST "$OPA_URL/v1/data/time_based_access/decision" \
  -H "Content-Type: application/json" \
  -d '{
    "input": {
      "user_id": "user123",
      "timestamp": "2024-11-06T14:00:00Z"
    }
  }' | jq '.result | {allow, risk_score, reason, details}'

echo ""
echo "🔹 Test 7.2: Night Access (should allow, risk score 15)"
curl -s -X POST "$OPA_URL/v1/data/time_based_access/decision" \
  -H "Content-Type: application/json" \
  -d '{
    "input": {
      "user_id": "user123",
      "timestamp": "2024-11-06T02:00:00Z"
    }
  }' | jq '.result | {allow, risk_score, reason, details}'

echo ""
echo "8️⃣  MFA ENFORCEMENT POLICY"
echo "=========================="
echo ""

echo "🔹 Test 8.1: MFA Verified (should allow, risk score 0)"
curl -s -X POST "$OPA_URL/v1/data/mfa_enforcement/decision" \
  -H "Content-Type: application/json" \
  -d '{
    "input": {
      "user_id": "user123",
      "mfa_verified": true,
      "action": "login",
      "device_fingerprint": "TW96aWxsYS81LjAgKE1hY2ludG9zaDsgSW50ZWwgTWFjIE9TIFggMTBfMTVfNykgQXBwbGVXZWJLaXQvNTM3LjM2",
      "location": {
        "country": "US"
      },
      "ip_address": "192.168.1.10"
    }
  }' | jq '.result | {allow, risk_score, require_mfa, reason}'

echo ""
echo "🔹 Test 8.2: Admin Without MFA (should require MFA, risk score 40)"
curl -s -X POST "$OPA_URL/v1/data/mfa_enforcement/decision" \
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
  }' | jq '.result | {allow, risk_score, require_mfa, reason}'

echo ""
echo "🔹 Test 8.3: New Device (should require MFA)"
curl -s -X POST "$OPA_URL/v1/data/mfa_enforcement/decision" \
  -H "Content-Type: application/json" \
  -d '{
    "input": {
      "user_id": "user123",
      "mfa_verified": false,
      "action": "login",
      "device_fingerprint": "new_unknown_device_12345",
      "location": {
        "country": "US"
      },
      "ip_address": "192.168.1.10"
    }
  }' | jq '.result | {allow, risk_score, require_mfa, reason}'

echo ""
echo "9️⃣  BEHAVIORAL ANOMALY POLICY"
echo "============================="
echo ""

echo "🔹 Test 9.1: Normal Behavior (should allow, low risk)"
curl -s -X POST "$OPA_URL/v1/data/behavioral_anomaly/decision" \
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
  }' | jq '.result | {allow, risk_score, reason, details}'

echo ""
echo "🔹 Test 9.2: Unusual Behavior (should allow, higher risk)"
curl -s -X POST "$OPA_URL/v1/data/behavioral_anomaly/decision" \
  -H "Content-Type: application/json" \
  -d '{
    "input": {
      "user_id": "user123",
      "user_agent": "Unknown Browser/1.0",
      "session_duration": 15000,
      "data_transfer_mb": 500,
      "actions_per_minute": 10,
      "user_age_days": 30
    }
  }' | jq '.result | {allow, risk_score, reason, details}'

echo ""
echo "🔟 RISK AGGREGATION POLICY (FINAL DECISION)"
echo "==========================================="
echo ""

echo "🔹 Test 10.1: Low Risk Scenario (should allow)"
curl -s -X POST "$OPA_URL/v1/data/risk_aggregation/decision" \
  -H "Content-Type: application/json" \
  -d '{
    "input": {
      "user_id": "user123",
      "email": "user@example.com",
      "action": "login",
      "timestamp": "2024-11-06T15:30:00Z",
      "ip_address": "192.168.1.10",
      "user_agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      "device_fingerprint": "TW96aWxsYS81LjAgKE1hY2ludG9zaDsgSW50ZWwgTWFjIE9TIFggMTBfMTVfNykgQXBwbGVXZWJLaXQvNTM3LjM2",
      "location": {
        "latitude": 40.7128,
        "longitude": -74.0060,
        "country": "US",
        "city": "New York"
      },
      "asn_name": "Google LLC",
      "mfa_verified": true,
      "session_duration": 3600,
      "user_age_days": 30
    }
  }' | jq '.result | {allow, action, risk_score, reason}'

echo ""
echo "🔹 Test 10.2: Medium Risk Scenario (should require MFA)"
curl -s -X POST "$OPA_URL/v1/data/risk_aggregation/decision" \
  -H "Content-Type: application/json" \
  -d '{
    "input": {
      "user_id": "user123",
      "email": "user@example.com",
      "action": "login",
      "timestamp": "2024-11-06T02:30:00Z",
      "ip_address": "185.220.100.240",
      "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      "device_fingerprint": "unknown_device_fingerprint",
      "location": {
        "latitude": 51.5074,
        "longitude": -0.1278,
        "country": "GB",
        "city": "London"
      },
      "asn_name": "NordVPN",
      "mfa_verified": false,
      "session_duration": 1800,
      "user_age_days": 30
    }
  }' | jq '.result | {allow, action, risk_score, reason}'

echo ""
echo "🔹 Test 10.3: High Risk Scenario (should deny)"
curl -s -X POST "$OPA_URL/v1/data/risk_aggregation/decision" \
  -H "Content-Type: application/json" \
  -d '{
    "input": {
      "user_id": "user123",
      "email": "user@example.com",
      "action": "admin_access",
      "timestamp": "2024-11-06T03:00:00Z",
      "ip_address": "192.168.1.100",
      "user_agent": "Unknown Browser/1.0",
      "device_fingerprint": "malicious_device_fingerprint",
      "location": {
        "latitude": 39.9042,
        "longitude": 116.4074,
        "country": "CN",
        "city": "Beijing"
      },
      "asn_name": "Suspicious ASN",
      "mfa_verified": false,
      "session_duration": 30,
      "user_age_days": 1
    }
  }' | jq '.result | {allow, action, risk_score, reason}'

echo ""
echo "🎉 Policy Testing Complete!"
echo ""
echo "📊 Summary of Test Results:"
echo "- Device Trust: Tests trusted vs unknown devices"
echo "- Geo-Location: Tests same country vs blocked countries"
echo "- Impossible Travel: Tests reasonable vs impossible travel patterns"
echo "- Suspicious IP: Tests clean vs malicious vs VPN IPs"
echo "- Failed Attempts: Tests clean vs multiple failed attempts"
echo "- Privilege Escalation: Tests regular vs admin access attempts"
echo "- Time-Based: Tests business hours vs night access"
echo "- MFA Enforcement: Tests verified vs unverified MFA scenarios"
echo "- Behavioral Anomaly: Tests normal vs unusual behavior patterns"
echo "- Risk Aggregation: Tests low vs medium vs high risk scenarios"
echo ""
echo "🔧 Next Steps:"
echo "1. Integrate these policies with your authentication flow"
echo "2. Monitor policy decisions in production"
echo "3. Adjust risk thresholds based on your requirements"
echo "4. Update policy data (blocked IPs, trusted devices) as needed"