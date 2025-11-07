interface OPAInput {
  user: {
    id: string;
    email: string;
    verified: boolean;
    isAdmin: boolean;
    zkpVerified: boolean;
    registered_device_fingerprint?: string;
    registered_location?: {
      country: string;
      city: string;
      region: string;
    };
    baseline_typing_speed?: number;
    registered_user_agent?: string;
    created_at: string;
  };
  action: string;
  resource?: string;
  device_fingerprint?: string;
  location?: {
    country: string;
    city: string;
    region: string;
  };
  timestamp: string;
  typing_speed?: number;
  failed_login_attempts: number;
  user_agent?: string;
  network?: {
    is_vpn: boolean;
    is_tor: boolean;
    reputation: string;
  };
  behavioral_score: number;
  recent_login_count: number;
  ip_address: string;
}

interface OPAResponse {
  result: {
    allow: boolean;
    risk_score: number;
    risk_level: string;
    reasons: string[];
    suggested_action: string;
  };
}

export class OPAService {
  private opaUrl: string;

  constructor() {
    this.opaUrl = process.env.OPA_URL || 'http://localhost:8181';
  }

  async evaluatePolicy(input: OPAInput): Promise<{ 
    allow: boolean; 
    risk_score: number;
    risk_level: string;
    reasons: string[];
    suggested_action: string;
  }> {
    try {
      const response = await fetch(`${this.opaUrl}/v1/data/risk_assessment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ input }),
      });

      if (!response.ok) {
        console.error('OPA request failed:', response.status, response.statusText);
        // Fail-safe: allow if OPA is unavailable but log the issue
        return { 
          allow: true, 
          risk_score: 0,
          risk_level: 'low',
          reasons: ['OPA service unavailable - defaulting to allow'],
          suggested_action: 'Grant access (OPA unavailable)'
        };
      }

      const data = await response.json() as OPAResponse;
      
      return {
        allow: data.result.allow,
        risk_score: data.result.risk_score,
        risk_level: data.result.risk_level,
        reasons: data.result.reasons || [],
        suggested_action: data.result.suggested_action
      };
    } catch (error) {
      console.error('OPA evaluation error:', error);
      // Fail-safe: allow if OPA is unavailable but log the issue
      return { 
        allow: true, 
        risk_score: 0,
        risk_level: 'low',
        reasons: ['OPA service error - defaulting to allow'],
        suggested_action: 'Grant access (OPA error)'
      };
    }
  }

  async isOPAHealthy(): Promise<boolean> {
    try {
      const response = await fetch(`${this.opaUrl}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(3000) // 3 second timeout
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  async createDefaultPolicies(): Promise<void> {
    // First check if OPA is running
    const isHealthy = await this.isOPAHealthy();
    if (!isHealthy) {
      throw new Error(`OPA server not accessible at ${this.opaUrl}`);
    }

    const defaultPolicy = `
package accesscontrol

default allow = true

# DENY if risk score is TOO HIGH (lower risk scores are better)
deny {
  input.riskScore > 80
  not input.user.isAdmin
}

# DENY if risk score is high for non-ZKP users
deny {
  input.riskScore > 60
  not input.user.zkpVerified
  not input.user.isAdmin
}

# ALLOW if user is verified (default is allow)
allow {
  input.user.verified == true
}

# ALLOW admin users even with higher risk
allow {
  input.user.isAdmin == true
  input.riskScore <= 90
}

# ALLOW ZKP verified users with better risk tolerance
allow {
  input.user.zkpVerified == true
  input.riskScore <= 70
}

# ALLOW low risk users (0-50 is low risk, should always be allowed)
allow {
  input.riskScore <= 50
}

# Deny reasons for transparency
deny_reason["High risk score detected"] {
  input.riskScore > 80
  not input.user.isAdmin
}

deny_reason["Elevated risk for unverified user"] {
  input.riskScore > 60
  not input.user.zkpVerified
  not input.user.isAdmin
}

deny_reason["Device fingerprint mismatch"] {
  input.deviceFingerprint != input.registeredFingerprint
  input.registeredFingerprint != null
  input.registeredFingerprint != ""
}

deny_reason["Location anomaly detected"] {
  input.location != input.registeredLocation
  input.registeredLocation != null
  input.registeredLocation != ""
  input.action == "login"
}

deny_reason["Unverified user account"] {
  input.user.verified == false
}

# Risk factors for analysis
risk_factors["suspicious_location"] {
  input.location != input.registeredLocation
  input.registeredLocation != null
}

risk_factors["device_mismatch"] {
  input.deviceFingerprint != input.registeredFingerprint
  input.registeredFingerprint != null
}

risk_factors["elevated_risk_score"] {
  input.riskScore > 50
}

risk_factors["high_risk_score"] {
  input.riskScore > 70
}
`;

    try {
      const response = await fetch(`${this.opaUrl}/v1/policies/accesscontrol`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'text/plain',
        },
        body: defaultPolicy,
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      console.log('✅ Default OPA policies created successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to create OPA policies: ${errorMessage}`);
    }
  }
}

export const opaService = new OPAService();