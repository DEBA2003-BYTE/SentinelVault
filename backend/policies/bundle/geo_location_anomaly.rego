package geo_location_anomaly

import rego.v1

# Geo-Location Anomaly Policy
# Detects unusual geographic locations for user access

default allow := true
default risk_score := 0

# Block if country is in blocked list
allow := false if {
    input.location.country in data.blocked_countries
}

# Calculate risk score based on location anomalies
risk_score := score if {
    input.location.country in data.blocked_countries
    score := 50
}

risk_score := score if {
    not input.location.country in data.blocked_countries
    user_last_location := data.user_locations[input.user_id]
    user_last_location.country != input.location.country
    score := 15
}

risk_score := score if {
    not input.location.country in data.blocked_countries
    user_last_location := data.user_locations[input.user_id]
    user_last_location.country == input.location.country
    score := 0
}

# Handle new users (no previous location data)
risk_score := 5 if {
    not data.user_locations[input.user_id]
    not input.location.country in data.blocked_countries
}

# Provide detailed decision information
decision := {
    "policy": "geo_location_anomaly",
    "allow": allow,
    "risk_score": risk_score,
    "reason": reason,
    "details": {
        "current_country": input.location.country,
        "current_city": input.location.city,
        "last_known_country": last_country,
        "is_blocked_country": input.location.country in data.blocked_countries,
        "is_new_user": not data.user_locations[input.user_id]
    }
}

last_country := data.user_locations[input.user_id].country if data.user_locations[input.user_id]
last_country := "unknown" if not data.user_locations[input.user_id]

reason := "Blocked country detected" if input.location.country in data.blocked_countries
reason := "Different country than usual" if {
    not input.location.country in data.blocked_countries
    data.user_locations[input.user_id]
    data.user_locations[input.user_id].country != input.location.country
}
reason := "Same country as usual" if {
    not input.location.country in data.blocked_countries
    data.user_locations[input.user_id]
    data.user_locations[input.user_id].country == input.location.country
}
reason := "New user location" if {
    not input.location.country in data.blocked_countries
    not data.user_locations[input.user_id]
}