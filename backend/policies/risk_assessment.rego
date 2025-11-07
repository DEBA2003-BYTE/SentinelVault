package risk_assessment

import rego.v1

# Default decision
default allow := false
default risk_score := 0
default risk_level := "low"

# Risk factor weights (total: 100)
weights := {
    "device_fingerprint": 20,
    "location_anomaly": 15,
    "login_time": 10,
    "typing_speed": 10,
    "failed_attempts": 15,
    "browser_os": 10,
    "network_reputation": 10,
    "behavioral_pattern": 10,
    "account_age": 5,
    "recent_activity": 5
}

# Calculate individual risk factors
device_risk := risk if {
    input.device_fingerprint != input.user.registered_device_fingerprint
    risk := weights.device_fingerprint
} else := 0

location_risk := risk if {
    input.location.country != input.user.registered_location.country
    risk := weights.location_anomaly
} else := risk if {
    input.location.city != input.user.registered_location.city
    risk := 10  # New city but same country
} else := 0

login_time_risk := risk if {
    # Check if login is outside normal hours (9 AM - 9 PM)
    hour := time.parse_rfc3339_ns(input.timestamp)[1]
    hour < 9
    risk := weights.login_time
} else := risk if {
    hour := time.parse_rfc3339_ns(input.timestamp)[1]
    hour > 21
    risk := weights.login_time
} else := 0

typing_speed_risk := risk if {
    # Calculate typing speed variance from user's baseline
    baseline := input.user.baseline_typing_speed
    current := input.typing_speed
    variance := abs((current - baseline) / baseline) * 100
    variance > 30
    risk := weights.typing_speed
} else := risk if {
    baseline := input.user.baseline_typing_speed
    current := input.typing_speed
    variance := abs((current - baseline) / baseline) * 100
    variance > 15
    risk := 5
} else := 0

failed_attempts_risk := risk if {
    input.failed_login_attempts >= 3
    risk := weights.failed_attempts
} else := risk if {
    input.failed_login_attempts == 2
    risk := 8
} else := risk if {
    input.failed_login_attempts == 1
    risk := 4
} else := 0

browser_os_risk := risk if {
    input.user_agent != input.user.registered_user_agent
    risk := weights.browser_os
} else := 0

network_risk := risk if {
    input.network.is_vpn == true
    risk := weights.network_reputation
} else := risk if {
    input.network.is_tor == true
    risk := weights.network_reputation
} else := risk if {
    input.network.reputation == "suspicious"
    risk := 7
} else := 0

behavioral_risk := risk if {
    input.behavioral_score > 70  # Unusual navigation pattern
    risk := weights.behavioral_pattern
} else := 0

account_age_risk := risk if {
    # Account created less than 24 hours ago
    account_age_hours := (time.now_ns() - time.parse_rfc3339_ns(input.user.created_at)[0]) / 3600000000000
    account_age_hours < 24
    risk := weights.account_age
} else := 0

recent_activity_risk := risk if {
    input.recent_login_count > 5  # More than 5 logins in last hour
    risk := weights.recent_activity
} else := 0

# Calculate total risk score
risk_score := device_risk + location_risk + login_time_risk + typing_speed_risk + 
              failed_attempts_risk + browser_os_risk + network_risk + 
              behavioral_risk + account_age_risk + recent_activity_risk

# Determine risk level
risk_level := "low" if risk_score <= 30
risk_level := "medium" if risk_score > 30; risk_score <= 70
risk_level := "high" if risk_score > 70

# Access decision based on risk level
allow := true if risk_level == "low"
allow := false if risk_level == "high"
# Medium risk requires MFA - handled by application logic

# Generate detailed reasons for risk factors
reasons := reasons_array if {
    reasons_array := array.concat(
        device_reasons,
        array.concat(
            location_reasons,
            array.concat(
                time_reasons,
                array.concat(
                    typing_reasons,
                    array.concat(
                        attempt_reasons,
                        array.concat(
                            browser_reasons,
                            array.concat(
                                network_reasons,
                                array.concat(
                                    behavioral_reasons,
                                    array.concat(
                                        age_reasons,
                                        activity_reasons
                                    )
                                )
                            )
                        )
                    )
                )
            )
        )
    )
}

device_reasons := [sprintf("New device detected (+%d)", [device_risk])] if device_risk > 0
device_reasons := [] if device_risk == 0

location_reasons := [sprintf("Login from new country (+%d)", [location_risk])] if {
    location_risk == weights.location_anomaly
}
location_reasons := [sprintf("Login from new city (+%d)", [location_risk])] if {
    location_risk == 10
}
location_reasons := [] if location_risk == 0

time_reasons := [sprintf("Outside normal hours (+%d)", [login_time_risk])] if login_time_risk > 0
time_reasons := [] if login_time_risk == 0

typing_reasons := [sprintf("Typing speed variance >30%% (+%d)", [typing_speed_risk])] if typing_speed_risk == weights.typing_speed
typing_reasons := [sprintf("Typing speed variance 15-30%% (+%d)", [typing_speed_risk])] if typing_speed_risk == 5
typing_reasons := [] if typing_speed_risk == 0

attempt_reasons := [sprintf("Multiple failed login attempts (+%d)", [failed_attempts_risk])] if failed_attempts_risk > 0
attempt_reasons := [] if failed_attempts_risk == 0

browser_reasons := [sprintf("New browser/OS detected (+%d)", [browser_os_risk])] if browser_os_risk > 0
browser_reasons := [] if browser_os_risk == 0

network_reasons := [sprintf("Using VPN/Tor network (+%d)", [network_risk])] if network_risk == weights.network_reputation
network_reasons := [sprintf("Suspicious IP reputation (+%d)", [network_risk])] if network_risk == 7
network_reasons := [] if network_risk == 0

behavioral_reasons := [sprintf("Unusual navigation pattern (+%d)", [behavioral_risk])] if behavioral_risk > 0
behavioral_reasons := [] if behavioral_risk == 0

age_reasons := [sprintf("New account <24 hours (+%d)", [account_age_risk])] if account_age_risk > 0
age_reasons := [] if account_age_risk == 0

activity_reasons := [sprintf("Multiple logins in short time (+%d)", [recent_activity_risk])] if recent_activity_risk > 0
activity_reasons := [] if recent_activity_risk == 0

# Suggested action based on risk level
suggested_action := "Grant full access" if risk_level == "low"
suggested_action := "Require MFA verification" if risk_level == "medium"
suggested_action := "Block access and require admin verification" if risk_level == "high"

# Helper function for absolute value
abs(x) := x if x >= 0
abs(x) := -x if x < 0