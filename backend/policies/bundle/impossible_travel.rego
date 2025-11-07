package impossible_travel

import rego.v1

# Impossible Travel Detection Policy
# Detects physically impossible travel between login locations

default allow := true
default risk_score := 0

# Maximum realistic travel speed (km/h) - commercial flight + ground transport
max_travel_speed := 1000

# Earth's radius in kilometers
earth_radius := 6371

# Calculate distance between two points using Haversine formula
distance_km := d if {
    lat1 := input.location.latitude * (3.14159 / 180)
    lon1 := input.location.longitude * (3.14159 / 180)
    
    last_location := data.user_locations[input.user_id]
    lat2 := last_location.latitude * (3.14159 / 180)
    lon2 := last_location.longitude * (3.14159 / 180)
    
    dlat := lat2 - lat1
    dlon := lon2 - lon1
    
    a := (sin(dlat/2) * sin(dlat/2)) + (cos(lat1) * cos(lat2) * sin(dlon/2) * sin(dlon/2))
    c := 2 * atan2(sqrt(a), sqrt(1-a))
    
    d := earth_radius * c
}

# Calculate time difference in hours
time_diff_hours := hours if {
    last_login := data.last_logins[input.user_id]
    current_time := time.parse_rfc3339_ns(input.timestamp)
    last_time := time.parse_rfc3339_ns(last_login.timestamp)
    
    diff_ns := current_time - last_time
    hours := diff_ns / 3600000000000  # Convert nanoseconds to hours
}

# Check if travel is impossible
impossible_travel if {
    distance_km > 0
    time_diff_hours > 0
    required_speed := distance_km / time_diff_hours
    required_speed > max_travel_speed
}

# Block if impossible travel detected
allow := false if impossible_travel

# Calculate risk score
risk_score := 40 if impossible_travel

risk_score := 10 if {
    not impossible_travel
    distance_km > 1000  # Long distance but possible
    time_diff_hours > 0
}

risk_score := 0 if {
    not data.user_locations[input.user_id]  # New user
}

risk_score := 0 if {
    distance_km <= 100  # Local travel
}

# Provide detailed decision information
decision := {
    "policy": "impossible_travel",
    "allow": allow,
    "risk_score": risk_score,
    "reason": reason,
    "details": {
        "distance_km": distance_km,
        "time_diff_hours": time_diff_hours,
        "required_speed_kmh": required_speed,
        "max_allowed_speed": max_travel_speed,
        "is_impossible": impossible_travel,
        "current_location": input.location,
        "last_location": data.user_locations[input.user_id]
    }
}

required_speed := distance_km / time_diff_hours if {
    distance_km > 0
    time_diff_hours > 0
}
required_speed := 0 if not distance_km
required_speed := 0 if not time_diff_hours

reason := "Impossible travel detected" if impossible_travel
reason := "Long distance travel" if {
    not impossible_travel
    distance_km > 1000
}
reason := "Local access" if distance_km <= 100
reason := "New user - no travel history" if not data.user_locations[input.user_id]

# Helper functions for trigonometry (simplified)
sin(x) := x - (x*x*x)/6 + (x*x*x*x*x)/120 if x >= 0; x <= 1.57
sin(x) := 1 if x > 1.57
sin(x) := -sin(-x) if x < 0

cos(x) := 1 - (x*x)/2 + (x*x*x*x)/24 if x >= 0; x <= 1.57
cos(x) := 0 if x > 1.57
cos(x) := cos(-x) if x < 0

sqrt(x) := x^0.5 if x >= 0
sqrt(x) := 0 if x < 0

atan2(y, x) := 1.57 if x == 0; y > 0
atan2(y, x) := -1.57 if x == 0; y < 0
atan2(y, x) := y/x if x > 0  # Simplified approximation