package suspicious_ip

import rego.v1

# Suspicious IP/ASN Policy
# Detects malicious IPs, VPNs, and suspicious network patterns

default allow := true
default risk_score := 0

# Block if IP is in malicious IPs list
allow := false if {
    input.ip_address in data.malicious_ips
}

# Check for VPN/Proxy indicators
is_vpn_proxy if {
    # Common VPN/Proxy ASN patterns
    contains(input.asn_name, "VPN")
}

is_vpn_proxy if {
    contains(input.asn_name, "Proxy")
}

is_vpn_proxy if {
    contains(input.asn_name, "Hosting")
}

is_vpn_proxy if {
    # Common VPN providers
    input.asn_name in [
        "NordVPN", "ExpressVPN", "Surfshark", "CyberGhost",
        "Private Internet Access", "ProtonVPN", "Windscribe"
    ]
}

# Check for Tor exit nodes (simplified detection)
is_tor_exit if {
    contains(input.asn_name, "Tor")
}

is_tor_exit if {
    # Common Tor hosting providers
    input.asn_name in [
        "OVH SAS", "Hetzner Online GmbH", "DigitalOcean"
    ]
    # Additional Tor indicators could be added
}

# Calculate risk score
risk_score := 50 if {
    input.ip_address in data.malicious_ips
}

risk_score := 30 if {
    not input.ip_address in data.malicious_ips
    is_tor_exit
}

risk_score := 20 if {
    not input.ip_address in data.malicious_ips
    not is_tor_exit
    is_vpn_proxy
}

risk_score := 10 if {
    not input.ip_address in data.malicious_ips
    not is_tor_exit
    not is_vpn_proxy
    # High-risk countries (could be configurable)
    input.location.country in ["CN", "RU", "KP", "IR"]
}

risk_score := 0 if {
    not input.ip_address in data.malicious_ips
    not is_tor_exit
    not is_vpn_proxy
    not input.location.country in ["CN", "RU", "KP", "IR"]
}

# Provide detailed decision information
decision := {
    "policy": "suspicious_ip",
    "allow": allow,
    "risk_score": risk_score,
    "reason": reason,
    "details": {
        "ip_address": input.ip_address,
        "asn_name": input.asn_name,
        "is_malicious": input.ip_address in data.malicious_ips,
        "is_vpn_proxy": is_vpn_proxy,
        "is_tor_exit": is_tor_exit,
        "country": input.location.country,
        "is_high_risk_country": input.location.country in ["CN", "RU", "KP", "IR"]
    }
}

reason := "Malicious IP detected" if input.ip_address in data.malicious_ips
reason := "Tor exit node detected" if {
    not input.ip_address in data.malicious_ips
    is_tor_exit
}
reason := "VPN/Proxy detected" if {
    not input.ip_address in data.malicious_ips
    not is_tor_exit
    is_vpn_proxy
}
reason := "High-risk country" if {
    not input.ip_address in data.malicious_ips
    not is_tor_exit
    not is_vpn_proxy
    input.location.country in ["CN", "RU", "KP", "IR"]
}
reason := "Clean IP address" if {
    not input.ip_address in data.malicious_ips
    not is_tor_exit
    not is_vpn_proxy
    not input.location.country in ["CN", "RU", "KP", "IR"]
}