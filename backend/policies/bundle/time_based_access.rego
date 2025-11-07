package time_based_access

import rego.v1

# Time-Based Access Policy
# Enforces time-based access controls and detects unusual access times

default allow := true
default risk_score := 0

# Extract hour from timestamp (0-23)
current_hour := hour if {
    parsed_time := time.parse_rfc3339_ns(input.timestamp)
    # Convert nanoseconds to hours and get hour of day
    hour := (parsed_time / 3600000000000) % 24
}

# Extract day of week (0=Sunday, 6=Saturday)
current_day := day if {
    parsed_time := time.parse_rfc3339_ns(input.timestamp)
    # Simplified day calculation (approximate)
    days_since_epoch := parsed_time / 86400000000000
    day := days_since_epoch % 7
}

# Business hours (9 AM to 6 PM, Monday to Friday)
business_hours if {
    current_hour >= 9
    current_hour <= 18
    current_day >= 1  # Monday
    current_day <= 5  # Friday
}

# Extended hours (7 AM to 10 PM, Monday to Friday)
extended_hours if {
    current_hour >= 7
    current_hour <= 22
    current_day >= 1  # Monday
    current_day <= 5  # Friday
}

# Weekend access
weekend_access if {
    current_day == 0  # Sunday
}

weekend_access if {
    current_day == 6  # Saturday
}

# Night access (10 PM to 7 AM)
night_access if {
    current_hour >= 22
}

night_access if {
    current_hour <= 7
}

# Check user's typical access patterns
unusual_time_access if {
    user_baseline := data.user_baselines[input.user_id]
    user_baseline.usual_hours
    not current_hour in user_baseline.usual_hours
}

unusual_day_access if {
    user_baseline := data.user_baselines[input.user_id]
    user_baseline.usual_days
    not current_day in user_baseline.usual_days
}

# Admin users have more flexible access
admin_flexible_access if {
    input.user_id in data.admin_users
}

# Calculate risk score based on time patterns
risk_score := 0 if business_hours
risk_score := 0 if admin_flexible_access

risk_score := 5 if {
    extended_hours
    not business_hours
    not admin_flexible_access
}

risk_score := 10 if {
    weekend_access
    not admin_flexible_access
    not unusual_time_access
}

risk_score := 15 if {
    night_access
    not admin_flexible_access
    not unusual_time_access
}

risk_score := 20 if {
    unusual_time_access
    not admin_flexible_access
}

risk_score := 25 if {
    unusual_day_access
    not admin_flexible_access
}

risk_score := 30 if {
    night_access
    weekend_access
    unusual_time_access
    not admin_flexible_access
}

# Provide detailed decision information
decision := {
    "policy": "time_based_access",
    "allow": allow,
    "risk_score": risk_score,
    "reason": reason,
    "details": {
        "current_hour": current_hour,
        "current_day": current_day,
        "is_business_hours": business_hours,
        "is_extended_hours": extended_hours,
        "is_weekend": weekend_access,
        "is_night_access": night_access,
        "is_unusual_time": unusual_time_access,
        "is_unusual_day": unusual_day_access,
        "is_admin": admin_flexible_access,
        "timestamp": input.timestamp
    }
}

reason := "Business hours access" if business_hours
reason := "Extended hours access" if {
    extended_hours
    not business_hours
}
reason := "Weekend access" if {
    weekend_access
    not unusual_time_access
}
reason := "Night access" if {
    night_access
    not unusual_time_access
}
reason := "Unusual time for user" if unusual_time_access
reason := "Unusual day for user" if unusual_day_access
reason := "Admin flexible access" if admin_flexible_access