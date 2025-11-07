package privilege_escalation

import rego.v1

# Privilege Escalation Policy
# Detects attempts to access admin functions or escalate privileges

default allow := true
default risk_score := 0

# Check if user is trying to access admin endpoints
is_admin_endpoint if {
    startswith(input.endpoint, "/api/admin/")
}

is_admin_endpoint if {
    input.endpoint in [
        "/admin", "/admin/", "/admin/dashboard",
        "/api/admin", "/api/users", "/api/system"
    ]
}

# Check if user is requesting admin actions
is_admin_action if {
    input.action in [
        "admin_login", "user_management", "system_config",
        "delete_user", "block_user", "view_logs", "modify_permissions"
    ]
}

# Check for privilege escalation attempts
privilege_escalation_attempt if {
    not input.user_id in data.admin_users
    is_admin_endpoint
}

privilege_escalation_attempt if {
    not input.user_id in data.admin_users
    is_admin_action
}

# Check for suspicious admin access patterns
suspicious_admin_access if {
    input.user_id in data.admin_users
    user_baseline := data.user_baselines[input.user_id]
    
    # Admin accessing from unusual location
    user_baseline.usual_countries
    not input.location.country in user_baseline.usual_countries
}

suspicious_admin_access if {
    input.user_id in data.admin_users
    user_baseline := data.user_baselines[input.user_id]
    
    # Admin accessing outside usual hours
    current_hour := time.parse_rfc3339_ns(input.timestamp) / 3600000000000 % 24
    user_baseline.usual_hours
    not current_hour in user_baseline.usual_hours
}

# Block privilege escalation attempts
allow := false if privilege_escalation_attempt

# Calculate risk score
risk_score := 50 if privilege_escalation_attempt

risk_score := 25 if {
    not privilege_escalation_attempt
    suspicious_admin_access
}

risk_score := 15 if {
    input.user_id in data.admin_users
    is_admin_action
    not suspicious_admin_access
}

risk_score := 0 if {
    not is_admin_endpoint
    not is_admin_action
}

risk_score := 0 if {
    input.user_id in data.admin_users
    not suspicious_admin_access
}

# Provide detailed decision information
decision := {
    "policy": "privilege_escalation",
    "allow": allow,
    "risk_score": risk_score,
    "reason": reason,
    "details": {
        "user_id": input.user_id,
        "is_admin_user": input.user_id in data.admin_users,
        "is_admin_endpoint": is_admin_endpoint,
        "is_admin_action": is_admin_action,
        "endpoint": input.endpoint,
        "action": input.action,
        "privilege_escalation_attempt": privilege_escalation_attempt,
        "suspicious_admin_access": suspicious_admin_access
    }
}

reason := "Privilege escalation attempt detected" if privilege_escalation_attempt
reason := "Suspicious admin access pattern" if {
    not privilege_escalation_attempt
    suspicious_admin_access
}
reason := "Normal admin access" if {
    input.user_id in data.admin_users
    not suspicious_admin_access
}
reason := "Regular user access" if {
    not is_admin_endpoint
    not is_admin_action
    not input.user_id in data.admin_users
}