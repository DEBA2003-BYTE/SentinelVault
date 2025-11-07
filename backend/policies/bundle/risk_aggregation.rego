package risk_aggregation

import rego.v1

# Contextual Risk Score Aggregation Policy
# Combines all policy results into final risk assessment

default allow := true
default risk_score := 0
default action := "allow"

# Import all policy decisions
device_decision := data.device_trust.decision
geo_decision := data.geo_location_anomaly.decision
travel_decision := data.impossible_travel.decision
ip_decision := data.suspicious_ip.decision
failed_attempts_decision := data.failed_login_attempts.decision
privilege_decision := data.privilege_escalation.decision
time_decision := data.time_based_access.decision
mfa_decision := data.mfa_enforcement.decision
behavioral_decision := data.behavioral_anomaly.decision

# Calculate weighted risk score
weighted_scores := {
    "device_trust": device_decision.risk_score * 1.2,        # 20% weight increase
    "geo_location": geo_decision.risk_score * 1.0,          # Normal weight
    "impossible_travel": travel_decision.risk_score * 1.5,   # 50% weight increase
    "suspicious_ip": ip_decision.risk_score * 1.3,          # 30% weight increase
    "failed_attempts": failed_attempts_decision.risk_score * 1.4, # 40% weight increase
    "privilege_escalation": privilege_decision.risk_score * 2.0,  # Double weight
    "time_based": time_decision.risk_score * 0.8,           # 20% weight decrease
    "mfa_enforcement": mfa_decision.risk_score * 1.1,       # 10% weight increase
    "behavioral_anomaly": behavioral_decision.risk_score * 1.0    # Normal weight
}

# Sum all weighted scores
total_weighted_score := sum([score | score := weighted_scores[_]])

# Normalize to 0-100 scale (divide by number of policies and adjust)
risk_score := min([100, round(total_weighted_score / 9)])

# Determine final action based on risk score and individual policy blocks
action := "deny" if {
    # Any policy explicitly denies
    not device_decision.allow
}

action := "deny" if {
    not geo_decision.allow
}

action := "deny" if {
    not travel_decision.allow
}

action := "deny" if {
    not ip_decision.allow
}

action := "deny" if {
    not failed_attempts_decision.allow
}

action := "deny" if {
    not privilege_decision.allow
}

action := "deny" if {
    not mfa_decision.allow
}

action := "deny" if {
    not behavioral_decision.allow
}

# High risk score override
action := "deny" if {
    risk_score > 70
    action != "deny"
}

# MFA requirement
action := "require_mfa" if {
    mfa_decision.require_mfa
    action != "deny"
}

action := "require_mfa" if {
    risk_score >= 30
    risk_score <= 70
    action != "deny"
    not mfa_decision.require_mfa
}

# Allow for low risk
action := "allow" if {
    risk_score < 30
    action != "deny"
    not mfa_decision.require_mfa
}

# Final allow decision
allow := true if action == "allow"
allow := false if action == "deny"
allow := false if action == "require_mfa"  # Requires additional step

# Context-specific adjustments
context_adjustments := {
    "admin_user": admin_adjustment,
    "new_user": new_user_adjustment,
    "trusted_network": trusted_network_adjustment,
    "business_hours": business_hours_adjustment
}

admin_adjustment := -5 if {
    input.user_id in data.admin_users
    time_decision.details.is_business_hours
}
admin_adjustment := 0 if not input.user_id in data.admin_users

new_user_adjustment := 10 if {
    input.user_age_days < 7
}
new_user_adjustment := 0 if input.user_age_days >= 7

trusted_network_adjustment := -10 if {
    input.ip_address in data.trusted_networks
}
trusted_network_adjustment := 0 if not input.ip_address in data.trusted_networks

business_hours_adjustment := -5 if {
    time_decision.details.is_business_hours
}
business_hours_adjustment := 0 if not time_decision.details.is_business_hours

# Apply context adjustments
final_risk_score := max([0, min([100, risk_score + sum([adj | adj := context_adjustments[_]])])])

# Provide comprehensive decision information
decision := {
    "policy": "risk_aggregation",
    "allow": allow,
    "action": action,
    "risk_score": final_risk_score,
    "raw_risk_score": risk_score,
    "reason": reason,
    "policy_results": {
        "device_trust": device_decision,
        "geo_location_anomaly": geo_decision,
        "impossible_travel": travel_decision,
        "suspicious_ip": ip_decision,
        "failed_login_attempts": failed_attempts_decision,
        "privilege_escalation": privilege_decision,
        "time_based_access": time_decision,
        "mfa_enforcement": mfa_decision,
        "behavioral_anomaly": behavioral_decision
    },
    "weighted_scores": weighted_scores,
    "context_adjustments": context_adjustments,
    "details": {
        "total_policies_evaluated": 9,
        "policies_blocking": count([1 | not policy_decisions[_].allow]),
        "highest_individual_risk": max([score | score := policy_scores[_]]),
        "mfa_required": mfa_decision.require_mfa,
        "timestamp": input.timestamp,
        "user_id": input.user_id
    }
}

# Helper arrays for calculations
policy_decisions := [
    device_decision, geo_decision, travel_decision, ip_decision,
    failed_attempts_decision, privilege_decision, time_decision,
    mfa_decision, behavioral_decision
]

policy_scores := [
    device_decision.risk_score, geo_decision.risk_score, travel_decision.risk_score,
    ip_decision.risk_score, failed_attempts_decision.risk_score, privilege_decision.risk_score,
    time_decision.risk_score, mfa_decision.risk_score, behavioral_decision.risk_score
]

reason := "Access denied - multiple policy violations" if {
    action == "deny"
    count([1 | not policy_decisions[_].allow]) > 1
}
reason := sprintf("Access denied - %s", [blocking_policy]) if {
    action == "deny"
    count([1 | not policy_decisions[_].allow]) == 1
}
reason := "MFA required due to elevated risk" if {
    action == "require_mfa"
    final_risk_score >= 30
}
reason := "MFA required by policy" if {
    action == "require_mfa"
    mfa_decision.require_mfa
}
reason := "Access granted - low risk" if {
    action == "allow"
    final_risk_score < 30
}

blocking_policy := policy.policy if {
    policy := policy_decisions[_]
    not policy.allow
}

# Helper functions
min(arr) := result if {
    result := arr[0]
    all(arr, func(x) { x >= result })
}

max(arr) := result if {
    result := arr[0]
    all(arr, func(x) { x <= result })
}

round(x) := floor(x + 0.5)
floor(x) := x - (x % 1)
sum(arr) := result if {
    result := arr[0] + sum(tail(arr))
}
sum([]) := 0
tail([_|rest]) := rest