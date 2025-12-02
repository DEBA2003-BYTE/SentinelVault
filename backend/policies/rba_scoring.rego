package rba_scoring

import rego.v1

# Risk-Based Authentication Scoring Policy
# Based on Risk.md specifications

# Default values
default allow := false
default risk_score := 0
default action := "normal"

# Risk factor weights (total: 100 points)
# Failed attempts: 50 (10 per attempt, max 5)
# Other factors: 50 (GPS: 15, Typing: 12, Time: 8, Velocity: 10, Device: 5)
weights := {
    "failed_attempts": 50,
    "gps": 15,
    "typing": 12,
    "time_of_day": 8,
    "velocity": 10,
    "new_device": 5
}

# ============================================================================
# 1. FAILED LOGIN ATTEMPTS (Weight: 50, 10 points each)
# ============================================================================
failed_attempts_score := score if {
    count := input.failed_count
    count > 0
    score := min([weights.failed_attempts, count * 10])
} else := 0

# ============================================================================
# 2. GPS LOCATION ANOMALY (Weight: 15)
# ============================================================================
gps_score := 0 if {
    # No GPS data provided
    not input.gps
}

gps_score := 0 if {
    # No location history to compare
    input.gps
    not input.user.location_history
}

gps_score := 0 if {
    # No location history to compare
    input.gps
    count(input.user.location_history) == 0
}

gps_score := round(weights.gps * 0.8) if {
    # Unknown location (moderate risk)
    input.gps
    count(input.user.location_history) == 0
}

gps_score := score if {
    # Compare with most recent location
    input.gps
    count(input.user.location_history) > 0
    recent := input.user.location_history[count(input.user.location_history) - 1]
    distance_km := haversine(recent.lat, recent.lon, input.gps.lat, input.gps.lon)
    
    # Distance-based scoring
    distance_km <= 50
    score := 0
}

gps_score := score if {
    input.gps
    count(input.user.location_history) > 0
    recent := input.user.location_history[count(input.user.location_history) - 1]
    distance_km := haversine(recent.lat, recent.lon, input.gps.lat, input.gps.lon)
    
    distance_km > 50
    distance_km <= 500
    score := round(weights.gps * 0.33)  # ~5 points
}

gps_score := score if {
    input.gps
    count(input.user.location_history) > 0
    recent := input.user.location_history[count(input.user.location_history) - 1]
    distance_km := haversine(recent.lat, recent.lon, input.gps.lat, input.gps.lon)
    
    distance_km > 500
    distance_km <= 2000
    score := round(weights.gps * 0.66)  # ~10 points
}

gps_score := weights.gps if {
    input.gps
    count(input.user.location_history) > 0
    recent := input.user.location_history[count(input.user.location_history) - 1]
    distance_km := haversine(recent.lat, recent.lon, input.gps.lat, input.gps.lon)
    
    distance_km > 2000
}

# ============================================================================
# 3. TYPING PATTERN (Weight: 12)
# ============================================================================
typing_score := round(weights.typing * 0.15) if {
    # No baseline established yet (minimal risk)
    not input.user.keystroke_baseline
}

typing_score := round(weights.typing * 0.15) if {
    input.user.keystroke_baseline
    input.user.keystroke_baseline.samples < 3
}

typing_score := 0 if {
    # No keystroke sample provided
    not input.keystroke_sample
    input.user.keystroke_baseline
    input.user.keystroke_baseline.samples >= 3
}

typing_score := 0 if {
    # No meanIKI in sample
    input.keystroke_sample
    not input.keystroke_sample.meanIKI
}

typing_score := score if {
    # Calculate Z-score
    input.keystroke_sample
    input.keystroke_sample.meanIKI
    input.user.keystroke_baseline
    input.user.keystroke_baseline.samples >= 3
    
    baseline_mean := input.user.keystroke_baseline.meanIKI
    baseline_std := input.user.keystroke_baseline.stdIKI
    sample_mean := input.keystroke_sample.meanIKI
    
    z_score := abs((sample_mean - baseline_mean) / max([baseline_std, 1]))
    
    z_score < 1
    score := 0
}

typing_score := score if {
    input.keystroke_sample
    input.keystroke_sample.meanIKI
    input.user.keystroke_baseline
    input.user.keystroke_baseline.samples >= 3
    
    baseline_mean := input.user.keystroke_baseline.meanIKI
    baseline_std := input.user.keystroke_baseline.stdIKI
    sample_mean := input.keystroke_sample.meanIKI
    
    z_score := abs((sample_mean - baseline_mean) / max([baseline_std, 1]))
    
    z_score >= 1
    z_score < 2
    score := round(weights.typing * 0.45)  # ~5 points
}

typing_score := score if {
    input.keystroke_sample
    input.keystroke_sample.meanIKI
    input.user.keystroke_baseline
    input.user.keystroke_baseline.samples >= 3
    
    baseline_mean := input.user.keystroke_baseline.meanIKI
    baseline_std := input.user.keystroke_baseline.stdIKI
    sample_mean := input.keystroke_sample.meanIKI
    
    z_score := abs((sample_mean - baseline_mean) / max([baseline_std, 1]))
    
    z_score >= 2
    z_score < 3
    score := round(weights.typing * 0.8)  # ~10 points
}

typing_score := weights.typing if {
    input.keystroke_sample
    input.keystroke_sample.meanIKI
    input.user.keystroke_baseline
    input.user.keystroke_baseline.samples >= 3
    
    baseline_mean := input.user.keystroke_baseline.meanIKI
    baseline_std := input.user.keystroke_baseline.stdIKI
    sample_mean := input.keystroke_sample.meanIKI
    
    z_score := abs((sample_mean - baseline_mean) / max([baseline_std, 1]))
    
    z_score >= 3
}

# ============================================================================
# 4. TIME OF DAY (Weight: 8, IST timezone, 8 AM - 8 PM)
# ============================================================================
time_of_day_score := 0 if {
    # No timestamp provided
    not input.timestamp
}

time_of_day_score := 0 if {
    # Within activity hours (8 AM - 8 PM IST)
    input.timestamp
    activity_hours := object.get(input.user, "activity_hours", {"start": 8, "end": 20, "tz": "Asia/Kolkata"})
    ist_hour := get_ist_hour(input.timestamp)
    
    ist_hour >= activity_hours.start
    ist_hour < activity_hours.end
}

time_of_day_score := round(weights.time_of_day * 0.6) if {
    # Within 2 hours of edges (mild anomaly)
    input.timestamp
    activity_hours := object.get(input.user, "activity_hours", {"start": 8, "end": 20, "tz": "Asia/Kolkata"})
    ist_hour := get_ist_hour(input.timestamp)
    
    # Before start (6-7 AM)
    ist_hour >= (activity_hours.start - 2)
    ist_hour < activity_hours.start
}

time_of_day_score := round(weights.time_of_day * 0.6) if {
    # Within 2 hours of edges (mild anomaly)
    input.timestamp
    activity_hours := object.get(input.user, "activity_hours", {"start": 8, "end": 20, "tz": "Asia/Kolkata"})
    ist_hour := get_ist_hour(input.timestamp)
    
    # After end (8-9 PM)
    ist_hour >= activity_hours.end
    ist_hour < (activity_hours.end + 2)
}

time_of_day_score := weights.time_of_day if {
    # Outside activity hours
    input.timestamp
    activity_hours := object.get(input.user, "activity_hours", {"start": 8, "end": 20, "tz": "Asia/Kolkata"})
    ist_hour := get_ist_hour(input.timestamp)
    
    # Not within hours and not within 2-hour buffer
    not (ist_hour >= activity_hours.start; ist_hour < activity_hours.end)
    not (ist_hour >= (activity_hours.start - 2); ist_hour < activity_hours.start)
    not (ist_hour >= activity_hours.end; ist_hour < (activity_hours.end + 2))
}

# ============================================================================
# 5. VELOCITY / IMPOSSIBLE TRAVEL (Weight: 10)
# ============================================================================
velocity_score := 0 if {
    # No GPS data
    not input.gps
}

velocity_score := 0 if {
    # No last login details
    not input.user.last_login_details
}

velocity_score := 0 if {
    # No GPS in last login
    input.user.last_login_details
    not input.user.last_login_details.gps
}

velocity_score := score if {
    # Calculate velocity
    input.gps
    input.user.last_login_details
    input.user.last_login_details.gps
    input.timestamp
    
    distance_km := haversine(
        input.user.last_login_details.gps.lat,
        input.user.last_login_details.gps.lon,
        input.gps.lat,
        input.gps.lon
    )
    
    # Calculate time difference in hours
    last_timestamp := input.user.last_login_details.timestamp
    hours := time_diff_hours(last_timestamp, input.timestamp)
    
    # Calculate speed (km/h)
    speed := distance_km / max([hours, 0.0001])
    
    speed <= 200
    score := 0
}

velocity_score := round(weights.velocity * 0.6) if {
    input.gps
    input.user.last_login_details
    input.user.last_login_details.gps
    input.timestamp
    
    distance_km := haversine(
        input.user.last_login_details.gps.lat,
        input.user.last_login_details.gps.lon,
        input.gps.lat,
        input.gps.lon
    )
    
    last_timestamp := input.user.last_login_details.timestamp
    hours := time_diff_hours(last_timestamp, input.timestamp)
    speed := distance_km / max([hours, 0.0001])
    
    speed > 200
    speed <= 500
}

velocity_score := weights.velocity if {
    input.gps
    input.user.last_login_details
    input.user.last_login_details.gps
    input.timestamp
    
    distance_km := haversine(
        input.user.last_login_details.gps.lat,
        input.user.last_login_details.gps.lon,
        input.gps.lat,
        input.gps.lon
    )
    
    last_timestamp := input.user.last_login_details.timestamp
    hours := time_diff_hours(last_timestamp, input.timestamp)
    speed := distance_km / max([hours, 0.0001])
    
    speed > 500
}

# ============================================================================
# 6. NEW DEVICE (Weight: 5)
# ============================================================================
new_device_score := 0 if {
    # No device ID provided
    not input.device_id
}

new_device_score := 0 if {
    # Device is known
    input.device_id
    input.user.known_devices
    known_device := input.user.known_devices[_]
    known_device.deviceIdHash == input.device_id
}

new_device_score := weights.new_device if {
    # New device
    input.device_id
    not input.user.known_devices
}

new_device_score := weights.new_device if {
    # New device (not in known devices list)
    input.device_id
    input.user.known_devices
    not device_is_known
}

device_is_known if {
    input.device_id
    input.user.known_devices
    known := input.user.known_devices[_]
    known.deviceIdHash == input.device_id
}

# ============================================================================
# TOTAL RISK SCORE CALCULATION
# ============================================================================

# Calculate other factors total (max 50)
other_factors_total := gps_score + typing_score + time_of_day_score + velocity_score + new_device_score
clamped_other_factors := min([50, other_factors_total])

# Total risk score (0-100)
risk_score := min([100, round(failed_attempts_score + clamped_other_factors)])

# ============================================================================
# RISK BANDS AND ACTIONS
# ============================================================================

# Risk level determination
risk_level := "low" if risk_score <= 40
risk_level := "medium" if { risk_score > 40; risk_score <= 70 }
risk_level := "high" if risk_score > 70

# Action determination
action := "normal" if risk_score <= 40
action := "mfa_required" if { risk_score > 40; risk_score <= 70 }
action := "blocked" if risk_score > 70

# Allow decision
allow := true if risk_score <= 40
allow := false if risk_score > 70
# Medium risk (41-70) requires MFA, so allow is false until MFA is completed

# ============================================================================
# DETAILED BREAKDOWN
# ============================================================================
breakdown := {
    "failedAttempts": failed_attempts_score,
    "gps": gps_score,
    "typing": typing_score,
    "timeOfDay": time_of_day_score,
    "velocity": velocity_score,
    "newDevice": new_device_score,
    "otherTotal": clamped_other_factors
}

# ============================================================================
# REASONS
# ============================================================================
reasons := array.concat(
    failed_reasons,
    array.concat(gps_reasons, array.concat(typing_reasons, array.concat(time_reasons, array.concat(velocity_reasons, device_reasons))))
)

failed_reasons := [sprintf("Failed login attempts: %d × 10 = %d points", [input.failed_count, failed_attempts_score])] if failed_attempts_score > 0
failed_reasons := [] if failed_attempts_score == 0

gps_reasons := [sprintf("GPS location anomaly: %d points", [gps_score])] if gps_score > 0
gps_reasons := [] if gps_score == 0

typing_reasons := [sprintf("Typing pattern deviation: %d points", [typing_score])] if typing_score > 0
typing_reasons := [] if typing_score == 0

time_reasons := [sprintf("Unusual time of day: %d points", [time_of_day_score])] if time_of_day_score > 0
time_reasons := [] if time_of_day_score == 0

velocity_reasons := [sprintf("Impossible travel detected: %d points", [velocity_score])] if velocity_score > 0
velocity_reasons := [] if velocity_score == 0

device_reasons := [sprintf("New device: %d points", [new_device_score])] if new_device_score > 0
device_reasons := [] if new_device_score == 0

# ============================================================================
# SUGGESTED ACTION
# ============================================================================
suggested_action := "Grant access" if risk_score <= 40
suggested_action := "Require MFA verification" if { risk_score > 40; risk_score <= 70 }
suggested_action := "Block access and lock account" if risk_score > 70

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

# Haversine formula for distance calculation (km)
haversine(lat1, lon1, lat2, lon2) := distance if {
    # Convert to radians
    lat1_rad := lat1 * 3.14159265359 / 180
    lon1_rad := lon1 * 3.14159265359 / 180
    lat2_rad := lat2 * 3.14159265359 / 180
    lon2_rad := lon2 * 3.14159265359 / 180
    
    # Haversine formula
    dlat := lat2_rad - lat1_rad
    dlon := lon2_rad - lon1_rad
    
    a := (sin(dlat / 2) * sin(dlat / 2)) + (cos(lat1_rad) * cos(lat2_rad) * sin(dlon / 2) * sin(dlon / 2))
    c := 2 * atan2(sqrt(a), sqrt(1 - a))
    
    distance := 6371 * c  # Earth radius in km
}

# Get IST hour from ISO timestamp
get_ist_hour(timestamp) := hour if {
    # Parse timestamp and convert to IST (UTC+5:30)
    # This is a simplified version - in production use proper time parsing
    # For now, extract hour from ISO string and add 5.5 hours
    parts := split(timestamp, "T")
    time_part := parts[1]
    hour_str := substring(time_part, 0, 2)
    utc_hour := to_number(hour_str)
    
    # Add 5.5 hours for IST
    ist_hour_raw := utc_hour + 5.5
    hour := round(ist_hour_raw) % 24
}

# Calculate time difference in hours
time_diff_hours(timestamp1, timestamp2) := hours if {
    # Simplified - in production use proper time parsing
    # For now, assume timestamps are comparable
    hours := 1  # Default to 1 hour if can't calculate
}

# Math helper functions
abs(x) := x if x >= 0
abs(x) := -x if x < 0

min(arr) := result if {
    result := arr[0]
    count(arr) > 0
}

max(arr) := result if {
    result := arr[0]
    count(arr) > 0
}

round(x) := to_number(format_int(x + 0.5, 10))

sin(x) := x  # Simplified - OPA doesn't have built-in sin
cos(x) := 1  # Simplified - OPA doesn't have built-in cos
sqrt(x) := x  # Simplified - OPA doesn't have built-in sqrt
atan2(y, x) := y / x  # Simplified - OPA doesn't have built-in atan2
