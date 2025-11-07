package device_trust

import rego.v1

# Device Trust Policy
# Evaluates device fingerprint against known trusted devices

default allow := false
default risk_score := 0

# Allow if device is in trusted devices list
allow if {
    input.device_fingerprint in data.trusted_devices
}

# Calculate risk score based on device trust
risk_score := score if {
    input.device_fingerprint in data.trusted_devices
    score := 0
}

risk_score := score if {
    not input.device_fingerprint in data.trusted_devices
    score := 25
}

# Provide detailed decision information
decision := {
    "policy": "device_trust",
    "allow": allow,
    "risk_score": risk_score,
    "reason": reason,
    "details": {
        "device_fingerprint": input.device_fingerprint,
        "is_trusted": input.device_fingerprint in data.trusted_devices,
        "trusted_devices_count": count(data.trusted_devices)
    }
}

reason := "Device is trusted" if allow
reason := "Unknown device detected" if not allow