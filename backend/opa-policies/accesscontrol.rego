package accesscontrol

default allow = false

# Allow if user is verified and risk is low
allow {
  input.user.verified == true
  input.riskScore < 50
}

# Allow admin users with slightly higher risk tolerance
allow {
  input.user.isAdmin == true
  input.riskScore < 70
}

# Allow ZKP verified users with lower risk threshold
allow {
  input.user.zkpVerified == true
  input.riskScore < 40
}

# Deny reasons for transparency
deny_reason["High risk score"] {
  input.riskScore >= 50
  not input.user.isAdmin
}

deny_reason["Device fingerprint mismatch"] {
  input.deviceFingerprint != input.registeredFingerprint
  input.registeredFingerprint != null
}

deny_reason["Location anomaly detected"] {
  input.location != input.registeredLocation
  input.registeredLocation != null
  input.action == "login"
}

deny_reason["Unverified user account"] {
  input.user.verified == false
}

# Risk factors for analysis
risk_factors["suspicious_location"] {
  input.location != input.registeredLocation
}

risk_factors["device_mismatch"] {
  input.deviceFingerprint != input.registeredFingerprint
}

risk_factors["high_risk_score"] {
  input.riskScore >= 60
}