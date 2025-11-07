# 🔧 Policy Data Management Guide

This guide explains how to update blocked IPs, trusted devices, and other policy data for the OPA Risk Engine.

## 📋 Overview

The OPA Risk Engine uses dynamic data stored in `backend/policies/data.json` and loaded into OPA at runtime. This data includes:

- Trusted devices
- Blocked countries
- Malicious IPs
- Admin users
- User baselines
- And more...

## 🔄 Methods to Update Policy Data

### Method 1: Direct API Updates (Recommended for Production)

#### Update Trusted Devices
```bash
# Add a new trusted device
curl -X PATCH "http://localhost:8181/v1/data/trusted_devices" \
  -H "Content-Type: application/json" \
  -d '["new_device_fingerprint_hash"]'

# Replace all trusted devices
curl -X PUT "http://localhost:8181/v1/data/trusted_devices" \
  -H "Content-Type: application/json" \
  -d '[
    "TW96aWxsYS81LjAgKE1hY2ludG9zaDsgSW50ZWwgTWFjIE9TIFggMTBfMTVfNykgQXBwbGVXZWJLaXQvNTM3LjM2",
    "TW96aWxsYS81LjAgKFdpbmRvd3MgTlQgMTAuMDsgV2luNjQ7IHg2NCkgQXBwbGVXZWJLaXQvNTM3LjM2",
    "new_device_fingerprint_hash"
  ]'
```

#### Update Blocked Countries
```bash
# Add a new blocked country
curl -X PATCH "http://localhost:8181/v1/data/blocked_countries" \
  -H "Content-Type: application/json" \
  -d '["AF"]'

# Replace all blocked countries
curl -X PUT "http://localhost:8181/v1/data/blocked_countries" \
  -H "Content-Type: application/json" \
  -d '["KP", "IR", "SY", "CU", "SD", "AF"]'
```

#### Update Malicious IPs
```bash
# Add new malicious IPs
curl -X PATCH "http://localhost:8181/v1/data/malicious_ips" \
  -H "Content-Type: application/json" \
  -d '["203.0.113.100", "198.51.100.50"]'

# Replace all malicious IPs
curl -X PUT "http://localhost:8181/v1/data/malicious_ips" \
  -H "Content-Type: application/json" \
  -d '[
    "192.168.1.100",
    "10.0.0.50",
    "203.0.113.0",
    "198.51.100.0",
    "203.0.113.100",
    "198.51.100.50"
  ]'
```

#### Update Admin Users
```bash
# Add a new admin user
curl -X PATCH "http://localhost:8181/v1/data/admin_users" \
  -H "Content-Type: application/json" \
  -d '["newadmin@company.com"]'

# Replace all admin users
curl -X PUT "http://localhost:8181/v1/data/admin_users" \
  -H "Content-Type: application/json" \
  -d '[
    "admin@gmail.com",
    "superadmin@sentinelvault.com",
    "security@sentinelvault.com",
    "newadmin@company.com"
  ]'
```

### Method 2: Backend API Refresh (Recommended for Development)

Use the backend API to refresh policy data from the database:

```bash
# Refresh all policy data from database
curl -X POST "http://localhost:3000/api/auth/refresh-policy-data" \
  -H "Authorization: Bearer <admin-token>"
```

This method:
- Rebuilds policy data from current database state
- Updates user baselines automatically
- Refreshes failed login attempts
- Updates user locations and MFA status

### Method 3: File-Based Updates (Development Only)

#### Update data.json File
1. Edit `backend/policies/data.json`
2. Restart OPA or reload data:

```bash
# Reload data from file
curl -X PUT "http://localhost:8181/v1/data" \
  -H "Content-Type: application/json" \
  -d @backend/policies/data.json
```

## 📊 Policy Data Structure

### Complete Data Schema
```json
{
  "trusted_devices": ["device_fingerprint_1", "device_fingerprint_2"],
  "blocked_countries": ["KP", "IR", "SY"],
  "malicious_ips": ["192.168.1.100", "10.0.0.50"],
  "high_risk_ips": ["185.220.100.240", "185.220.101.1"],
  "trusted_networks": ["192.168.1.0/24", "10.0.0.0/8"],
  "admin_users": ["admin@gmail.com", "security@company.com"],
  "user_locations": {
    "user_id": {
      "latitude": 40.7128,
      "longitude": -74.0060,
      "country": "US",
      "city": "New York"
    }
  },
  "last_logins": {
    "user_id": {
      "timestamp": "2024-11-06T10:30:00Z",
      "location": { "latitude": 40.7128, "longitude": -74.0060 }
    }
  },
  "failed_attempts": {
    "user_id": [
      {
        "timestamp": "2024-11-06T09:00:00Z",
        "ip_address": "192.168.1.50",
        "reason": "wrong_password"
      }
    ]
  },
  "user_baselines": {
    "user_id": {
      "usual_countries": ["US", "CA"],
      "usual_hours": [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18],
      "usual_days": [1, 2, 3, 4, 5],
      "usual_user_agents": ["Mozilla/5.0..."],
      "avg_session_duration": 3600,
      "avg_daily_logins": 3,
      "usual_file_types": ["pdf", "docx", "xlsx"],
      "avg_data_transfer": 50,
      "avg_actions_per_minute": 2
    }
  },
  "user_mfa_status": {
    "user_id": {
      "enabled": true,
      "methods": ["fingerprint", "face_recognition"],
      "backup_codes": 8
    }
  }
}
```

## 🔍 Monitoring Policy Data

### Check Current Data
```bash
# View all policy data
curl -s "http://localhost:8181/v1/data" | jq '.'

# View specific data sections
curl -s "http://localhost:8181/v1/data/trusted_devices" | jq '.'
curl -s "http://localhost:8181/v1/data/blocked_countries" | jq '.'
curl -s "http://localhost:8181/v1/data/malicious_ips" | jq '.'
curl -s "http://localhost:8181/v1/data/admin_users" | jq '.'
```

### Verify Policy Status
```bash
# Check OPA health
curl "http://localhost:8181/health"

# Check policy status via backend
curl "http://localhost:3000/api/auth/policy-status" \
  -H "Authorization: Bearer <token>"
```

## 🚨 Security Best Practices

### 1. Access Control
- Only admin users can refresh policy data
- Use strong authentication for OPA API access
- Implement IP whitelisting for OPA server in production

### 2. Data Validation
- Validate IP addresses before adding to malicious_ips
- Verify country codes (ISO 3166-1 alpha-2)
- Check device fingerprint format consistency

### 3. Backup and Recovery
```bash
# Backup current policy data
curl -s "http://localhost:8181/v1/data" > policy_data_backup_$(date +%Y%m%d_%H%M%S).json

# Restore from backup
curl -X PUT "http://localhost:8181/v1/data" \
  -H "Content-Type: application/json" \
  -d @policy_data_backup_20241106_153000.json
```

### 4. Change Logging
- Log all policy data changes
- Track who made changes and when
- Implement approval workflow for critical changes

## 🔄 Automated Updates

### Threat Intelligence Integration
```bash
#!/bin/bash
# Example script to update malicious IPs from threat feed

# Fetch latest malicious IPs from threat intelligence feed
MALICIOUS_IPS=$(curl -s "https://threat-intel-api.com/malicious-ips" | jq -r '.ips[]')

# Update OPA data
curl -X PUT "http://localhost:8181/v1/data/malicious_ips" \
  -H "Content-Type: application/json" \
  -d "$(echo $MALICIOUS_IPS | jq -R -s -c 'split("\n")[:-1]')"

echo "Updated malicious IPs from threat intelligence feed"
```

### Database Sync Script
```bash
#!/bin/bash
# Sync policy data with database every hour

while true; do
  echo "Refreshing policy data from database..."
  
  curl -X POST "http://localhost:3000/api/auth/refresh-policy-data" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json"
  
  echo "Policy data refreshed at $(date)"
  sleep 3600  # Wait 1 hour
done
```

## 📈 Performance Optimization

### 1. Data Size Management
- Keep malicious_ips list under 10,000 entries
- Rotate old failed_attempts data (keep last 7 days)
- Archive old user_baselines for inactive users

### 2. Update Frequency
- **Critical data** (malicious_ips): Update every 15 minutes
- **User baselines**: Update daily
- **Admin users**: Update on demand
- **Blocked countries**: Update monthly or as needed

### 3. Caching Strategy
- OPA caches policy data in memory
- Use ETags for conditional updates
- Implement client-side caching for frequently accessed data

## 🛠️ Troubleshooting

### Common Issues

#### 1. Policy Data Not Updating
```bash
# Check OPA logs
docker logs sentinelvault-opa

# Verify data was loaded
curl -s "http://localhost:8181/v1/data/trusted_devices" | jq 'length'

# Force reload
curl -X PUT "http://localhost:8181/v1/data" \
  -H "Content-Type: application/json" \
  -d @backend/policies/data.json
```

#### 2. Invalid JSON Format
```bash
# Validate JSON before updating
cat backend/policies/data.json | jq '.' > /dev/null
echo "JSON is valid"

# Fix common JSON issues
jq '.' backend/policies/data.json > temp.json && mv temp.json backend/policies/data.json
```

#### 3. Policy Evaluation Errors
```bash
# Test policy with sample data
curl -X POST "http://localhost:8181/v1/data/device_trust/decision" \
  -H "Content-Type: application/json" \
  -d '{"input": {"device_fingerprint": "test"}}'

# Check for policy syntax errors
opa fmt backend/policies/bundle/
```

## 📚 Additional Resources

### OPA Documentation
- [OPA Data API](https://www.openpolicyagent.org/docs/latest/rest-api/#data-api)
- [Policy Testing](https://www.openpolicyagent.org/docs/latest/policy-testing/)
- [Performance Tuning](https://www.openpolicyagent.org/docs/latest/policy-performance/)

### Security Resources
- [OWASP Threat Intelligence](https://owasp.org/www-community/Threat_Modeling)
- [IP Reputation Services](https://www.abuseipdb.com/)
- [Country Code Reference](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2)

---

## 🎯 Quick Reference Commands

```bash
# Most common operations

# Add malicious IP
curl -X PATCH "http://localhost:8181/v1/data/malicious_ips" \
  -H "Content-Type: application/json" \
  -d '["new.malicious.ip"]'

# Add trusted device
curl -X PATCH "http://localhost:8181/v1/data/trusted_devices" \
  -H "Content-Type: application/json" \
  -d '["new_device_fingerprint"]'

# Refresh from database
curl -X POST "http://localhost:3000/api/auth/refresh-policy-data" \
  -H "Authorization: Bearer <admin-token>"

# Check policy status
curl "http://localhost:3000/api/auth/policy-status" \
  -H "Authorization: Bearer <token>"

# Backup policy data
curl -s "http://localhost:8181/v1/data" > policy_backup.json
```

This guide provides comprehensive instructions for managing policy data in your OPA Risk Engine. Regular updates and monitoring ensure optimal security posture.