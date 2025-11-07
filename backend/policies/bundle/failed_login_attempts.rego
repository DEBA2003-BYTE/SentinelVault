package failed_login_attempts

import rego.v1

# Failed Login Attempt Policy
# Tracks and evaluates failed login attempts for brute force detection

default allow := true
default risk_score := 0

# Get failed attempts in last hour
recent_failed_attempts := count([attempt |
    attempt := data.failed_attempts[input.user_id][_]
    attempt_time := time.parse_rfc3339_ns(attempt.timestamp)
    current_time := time.parse_rfc3339_ns(input.timestamp)
    time_diff := current_time - attempt_time
    time_diff <= 3600000000000  # 1 hour in nanoseconds
])

# Get failed attempts from same IP in last hour
ip_failed_attempts := count([attempt |
    user_attempts := data.failed_attempts[_]
    attempt := user_attempts[_]
    attempt.ip_address == input.ip_address
    attempt_time := time.parse_rfc3339_ns(attempt.timestamp)
    current_time := time.parse_rfc3339_ns(input.timestamp)
    time_diff := current_time - attempt_time
    time_diff <= 3600000000000  # 1 hour in nanoseconds
])

# Block if too many failed attempts
allow := false if {
    recent_failed_attempts >= 5
}

allow := false if {
    ip_failed_attempts >= 10  # IP-based blocking
}

# Calculate risk score based on failed attempts
risk_score := 40 if {
    recent_failed_attempts >= 5
}

risk_score := 35 if {
    recent_failed_attempts < 5
    ip_failed_attempts >= 10
}

risk_score := 25 if {
    recent_failed_attempts >= 3
    recent_failed_attempts < 5
    ip_failed_attempts < 10
}

risk_score := 15 if {
    recent_failed_attempts >= 1
    recent_failed_attempts < 3
    ip_failed_attempts < 10
}

risk_score := 10 if {
    ip_failed_attempts >= 5
    ip_failed_attempts < 10
    recent_failed_attempts < 3
}

risk_score := 0 if {
    recent_failed_attempts == 0
    ip_failed_attempts < 5
}

# Check for distributed brute force (multiple IPs targeting same user)
distributed_attack if {
    user_attempts := data.failed_attempts[input.user_id]
    unique_ips := {attempt.ip_address | attempt := user_attempts[_]}
    count(unique_ips) >= 3
    recent_failed_attempts >= 3
}

# Increase risk score for distributed attacks
risk_score := 50 if distributed_attack

# Provide detailed decision information
decision := {
    "policy": "failed_login_attempts",
    "allow": allow,
    "risk_score": risk_score,
    "reason": reason,
    "details": {
        "user_failed_attempts_1h": recent_failed_attempts,
        "ip_failed_attempts_1h": ip_failed_attempts,
        "is_distributed_attack": distributed_attack,
        "user_id": input.user_id,
        "ip_address": input.ip_address,
        "threshold_user": 5,
        "threshold_ip": 10
    }
}

reason := "Too many failed attempts for user" if {
    recent_failed_attempts >= 5
    not distributed_attack
}
reason := "Too many failed attempts from IP" if {
    ip_failed_attempts >= 10
    recent_failed_attempts < 5
}
reason := "Distributed brute force attack detected" if distributed_attack
reason := "Moderate failed attempt activity" if {
    recent_failed_attempts >= 1
    recent_failed_attempts < 5
    ip_failed_attempts < 10
    not distributed_attack
}
reason := "No recent failed attempts" if {
    recent_failed_attempts == 0
    ip_failed_attempts < 5
}