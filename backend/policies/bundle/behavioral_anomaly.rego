package behavioral_anomaly

import rego.v1

# Behavioral Anomaly Policy
# Detects unusual user behavior patterns

default allow := true
default risk_score := 0

# Get user baseline data
user_baseline := data.user_baselines[input.user_id]

# Check for unusual user agent
unusual_user_agent if {
    user_baseline.usual_user_agents
    not input.user_agent in user_baseline.usual_user_agents
}

# Check for unusual session duration patterns
unusual_session_pattern if {
    user_baseline.avg_session_duration
    input.session_duration > (user_baseline.avg_session_duration * 3)
}

unusual_session_pattern if {
    user_baseline.avg_session_duration
    input.session_duration < (user_baseline.avg_session_duration / 3)
}

# Check for unusual activity frequency
unusual_activity_frequency if {
    user_baseline.avg_daily_logins
    # Get recent login count (simplified - would need actual implementation)
    recent_logins := count(data.recent_user_activity[input.user_id])
    recent_logins > (user_baseline.avg_daily_logins * 2)
}

# Check for unusual file access patterns
unusual_file_access if {
    user_baseline.usual_file_types
    input.file_type
    not input.file_type in user_baseline.usual_file_types
}

# Check for unusual data volume
unusual_data_volume if {
    user_baseline.avg_data_transfer
    input.data_transfer_mb > (user_baseline.avg_data_transfer * 5)
}

# Check for velocity anomalies (too many actions too quickly)
velocity_anomaly if {
    user_baseline.avg_actions_per_minute
    input.actions_per_minute > (user_baseline.avg_actions_per_minute * 3)
}

# Check for unusual navigation patterns
unusual_navigation if {
    user_baseline.usual_pages
    input.page_sequence
    # Simplified check - in practice would analyze sequence patterns
    count(input.page_sequence) > 10  # Too many page jumps
}

# Calculate risk score based on behavioral anomalies
risk_score := 5 if unusual_user_agent
risk_score := 10 if unusual_session_pattern
risk_score := 15 if unusual_activity_frequency
risk_score := 10 if unusual_file_access
risk_score := 20 if unusual_data_volume
risk_score := 25 if velocity_anomaly
risk_score := 15 if unusual_navigation

# Aggregate multiple anomalies
anomaly_count := count([1 |
    unusual_user_agent
]) + count([1 |
    unusual_session_pattern
]) + count([1 |
    unusual_activity_frequency
]) + count([1 |
    unusual_file_access
]) + count([1 |
    unusual_data_volume
]) + count([1 |
    velocity_anomaly
]) + count([1 |
    unusual_navigation
])

# Increase risk for multiple anomalies
risk_score := 35 if anomaly_count >= 3
risk_score := 45 if anomaly_count >= 5

# Block for severe behavioral anomalies
allow := false if {
    velocity_anomaly
    unusual_data_volume
    anomaly_count >= 3
}

# Handle new users (no baseline data)
risk_score := 5 if {
    not user_baseline
    input.user_age_days < 7  # New user
}

# Provide detailed decision information
decision := {
    "policy": "behavioral_anomaly",
    "allow": allow,
    "risk_score": risk_score,
    "reason": reason,
    "details": {
        "user_id": input.user_id,
        "has_baseline": user_baseline != null,
        "anomaly_count": anomaly_count,
        "anomalies": {
            "unusual_user_agent": unusual_user_agent,
            "unusual_session_pattern": unusual_session_pattern,
            "unusual_activity_frequency": unusual_activity_frequency,
            "unusual_file_access": unusual_file_access,
            "unusual_data_volume": unusual_data_volume,
            "velocity_anomaly": velocity_anomaly,
            "unusual_navigation": unusual_navigation
        },
        "baseline_data": user_baseline,
        "current_metrics": {
            "user_agent": input.user_agent,
            "session_duration": input.session_duration,
            "file_type": input.file_type,
            "data_transfer_mb": input.data_transfer_mb,
            "actions_per_minute": input.actions_per_minute
        }
    }
}

reason := "Multiple severe behavioral anomalies" if {
    anomaly_count >= 3
    velocity_anomaly
    unusual_data_volume
}
reason := "Multiple behavioral anomalies detected" if {
    anomaly_count >= 3
    not (velocity_anomaly and unusual_data_volume)
}
reason := "Velocity anomaly detected" if {
    velocity_anomaly
    anomaly_count < 3
}
reason := "Unusual data volume" if {
    unusual_data_volume
    anomaly_count < 3
}
reason := "Minor behavioral anomalies" if {
    anomaly_count > 0
    anomaly_count < 3
    not velocity_anomaly
    not unusual_data_volume
}
reason := "New user - establishing baseline" if {
    not user_baseline
    input.user_age_days < 7
}
reason := "Normal behavior pattern" if {
    anomaly_count == 0
    user_baseline
}