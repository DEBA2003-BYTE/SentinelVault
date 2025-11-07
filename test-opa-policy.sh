#!/bin/bash

# Test OPA Policy - Risk Score Logic
# This script tests that LOW risk scores are ALLOWED and HIGH risk scores are DENIED

echo "🧪 Testing OPA Policy - Risk Score Logic"
echo "=========================================="
echo ""

OPA_URL="http://localhost:8181"

# Test 1: Low Risk Score (0) - Should ALLOW
echo "Test 1: Risk Score 0 (Very Low Risk)"
curl -s -X POST "$OPA_URL/v1/data/accesscontrol/evaluate" \
  -H "Content-Type: application/json" \
  -d '{
    "input": {
      "user": {
        "id": "test123",
        "email": "test@example.com",
        "verified": true,
        "isAdmin": false,
        "zkpVerified": false
      },
      "action": "login",
      "riskScore": 0,
      "ipAddress": "127.0.0.1",
      "timestamp": "2024-01-01T00:00:00Z"
    }
  }' | jq '.result.allow'
echo "Expected: true"
echo ""

# Test 2: Low Risk Score (30) - Should ALLOW
echo "Test 2: Risk Score 30 (Low Risk)"
curl -s -X POST "$OPA_URL/v1/data/accesscontrol/evaluate" \
  -H "Content-Type: application/json" \
  -d '{
    "input": {
      "user": {
        "id": "test123",
        "email": "test@example.com",
        "verified": true,
        "isAdmin": false,
        "zkpVerified": false
      },
      "action": "login",
      "riskScore": 30,
      "ipAddress": "127.0.0.1",
      "timestamp": "2024-01-01T00:00:00Z"
    }
  }' | jq '.result.allow'
echo "Expected: true"
echo ""

# Test 3: Medium Risk Score (50) - Should ALLOW
echo "Test 3: Risk Score 50 (Medium Risk)"
curl -s -X POST "$OPA_URL/v1/data/accesscontrol/evaluate" \
  -H "Content-Type: application/json" \
  -d '{
    "input": {
      "user": {
        "id": "test123",
        "email": "test@example.com",
        "verified": true,
        "isAdmin": false,
        "zkpVerified": false
      },
      "action": "login",
      "riskScore": 50,
      "ipAddress": "127.0.0.1",
      "timestamp": "2024-01-01T00:00:00Z"
    }
  }' | jq '.result.allow'
echo "Expected: true"
echo ""

# Test 4: High Risk Score (85) - Should DENY
echo "Test 4: Risk Score 85 (High Risk)"
curl -s -X POST "$OPA_URL/v1/data/accesscontrol/evaluate" \
  -H "Content-Type: application/json" \
  -d '{
    "input": {
      "user": {
        "id": "test123",
        "email": "test@example.com",
        "verified": true,
        "isAdmin": false,
        "zkpVerified": false
      },
      "action": "login",
      "riskScore": 85,
      "ipAddress": "127.0.0.1",
      "timestamp": "2024-01-01T00:00:00Z"
    }
  }' | jq '.result.allow'
echo "Expected: false"
echo ""

# Test 5: High Risk Score (85) with Admin - Should ALLOW
echo "Test 5: Risk Score 85 (High Risk) - Admin User"
curl -s -X POST "$OPA_URL/v1/data/accesscontrol/evaluate" \
  -H "Content-Type: application/json" \
  -d '{
    "input": {
      "user": {
        "id": "admin123",
        "email": "admin@example.com",
        "verified": true,
        "isAdmin": true,
        "zkpVerified": false
      },
      "action": "login",
      "riskScore": 85,
      "ipAddress": "127.0.0.1",
      "timestamp": "2024-01-01T00:00:00Z"
    }
  }' | jq '.result.allow'
echo "Expected: true (Admin bypass)"
echo ""

# Test 6: Medium-High Risk (65) with ZKP - Should ALLOW
echo "Test 6: Risk Score 65 (Medium-High Risk) - ZKP Verified"
curl -s -X POST "$OPA_URL/v1/data/accesscontrol/evaluate" \
  -H "Content-Type: application/json" \
  -d '{
    "input": {
      "user": {
        "id": "test123",
        "email": "test@example.com",
        "verified": true,
        "isAdmin": false,
        "zkpVerified": true
      },
      "action": "login",
      "riskScore": 65,
      "ipAddress": "127.0.0.1",
      "timestamp": "2024-01-01T00:00:00Z"
    }
  }' | jq '.result.allow'
echo "Expected: true (ZKP verified)"
echo ""

echo "=========================================="
echo "✅ OPA Policy Test Complete"
echo ""
echo "Summary:"
echo "- Low risk scores (0-50): Should be ALLOWED"
echo "- Medium risk scores (51-60): Should be ALLOWED"
echo "- High risk scores (61-80): DENIED for regular users, ALLOWED for ZKP/Admin"
echo "- Very high risk scores (81+): DENIED for all except Admin"
