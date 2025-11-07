package mfa_enforcement

import rego.v1

# MFA Enforcement Policy
# Determines when Multi-Factor Authentication should be required

default allow := true
default risk_score := 0
default require_mfa := false

# Always require MFA for admin users
require_mfa := true if {
    input.user_id in data.admin_users
    not input.mfa_verified
}

# Require MFA for high-value actions
require_mfa := true if {
    input.action in [
        "delete_file", "admin_access", "password_change",
        "account_settings", "payment_method", "data_export"
    ]
    not input.mfa_verified
}

# Require MFA for new devices
require_mfa := true if {
    not input.device_fingerprint in data.trusted_devices
    not input.mfa_verified
}

# Require MFA for unusual locations
require_mfa := true if {
    user_baseline := data.user_baselines[input.user_id]
    user_baseline.usual_countries
    not input.location.country in user_baseline.usual_countries
    not input.mfa_verified
}

# Require MFA for high-risk IP addresses
require_mfa := true if {
    input.ip_address in data.high_risk_ips
    not input.mfa_verified
}

# Check if user has MFA configured
user_has_mfa if {
    user_mfa := data.user_mfa_status[input.user_id]
    user_mfa.enabled == true
}

# Block if MFA is required but user doesn't have it configured
allow := false if {
    require_mfa
    not user_has_mfa
}

# Block if MFA is required but not provided
allow := false if {
    require_mfa
    user_has_mfa
    not input.mfa_verified
}

# Calculate risk score based on MFA status
risk_score := 0 if {
    input.mfa_verified
}

risk_score := 10 if {
    not require_mfa
    not input.mfa_verified
    user_has_mfa
}

risk_score := 20 if {
    require_mfa
    user_has_mfa
    not input.mfa_verified
}

risk_score := 30 if {
    require_mfa
    not user_has_mfa
}

# Special handling for admin users
risk_score := 40 if {
    input.user_id in data.admin_users
    not input.mfa_verified
}

# Provide detailed decision information
decision := {
    "policy": "mfa_enforcement",
    "allow": allow,
    "risk_score": risk_score,
    "require_mfa": require_mfa,
    "reason": reason,
    "details": {
        "user_id": input.user_id,
        "is_admin": input.user_id in data.admin_users,
        "mfa_verified": input.mfa_verified,
        "user_has_mfa": user_has_mfa,
        "action": input.action,
        "device_trusted": input.device_fingerprint in data.trusted_devices,
        "location_usual": location_usual,
        "ip_high_risk": input.ip_address in data.high_risk_ips
    }
}

location_usual := true if {
    user_baseline := data.user_baselines[input.user_id]
    user_baseline.usual_countries
    input.location.country in user_baseline.usual_countries
}
location_usual := false if {
    user_baseline := data.user_baselines[input.user_id]
    user_baseline.usual_countries
    not input.location.country in user_baseline.usual_countries
}
location_usual := true if not data.user_baselines[input.user_id]

reason := "MFA verified successfully" if input.mfa_verified
reason := "MFA required for admin user" if {
    input.user_id in data.admin_users
    not input.mfa_verified
}
reason := "MFA required for high-value action" if {
    input.action in ["delete_file", "admin_access", "password_change", "account_settings", "payment_method", "data_export"]
    not input.mfa_verified
}
reason := "MFA required for new device" if {
    not input.device_fingerprint in data.trusted_devices
    not input.mfa_verified
}
reason := "MFA required for unusual location" if {
    not location_usual
    not input.mfa_verified
}
reason := "MFA required for high-risk IP" if {
    input.ip_address in data.high_risk_ips
    not input.mfa_verified
}
reason := "MFA not configured" if {
    require_mfa
    not user_has_mfa
}
reason := "No MFA required" if {
    not require_mfa
    not input.mfa_verified
}