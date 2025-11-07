import express from 'express';
import { z } from 'zod';
import { authenticateToken, type AuthRequest } from '../middleware/auth';
import { AccessLog } from '../models/AccessLog';
import { User } from '../models/User';

const router = express.Router();

// OPA Risk Evaluation Schema
const riskEvaluationSchema = z.object({
  user_id: z.string(),
  email: z.string().email().optional(),
  action: z.string(),
  endpoint: z.string().optional(),
  timestamp: z.string(),
  ip_address: z.string(),
  user_agent: z.string(),
  device_fingerprint: z.string(),
  location: z.object({
    latitude: z.number(),
    longitude: z.number(),
    country: z.string(),
    city: z.string()
  }),
  asn_name: z.string().optional(),
  mfa_verified: z.boolean().default(false),
  session_duration: z.number().optional(),
  user_age_days: z.number().optional(),
  file_type: z.string().optional(),
  data_transfer_mb: z.number().optional(),
  actions_per_minute: z.number().optional(),
  page_sequence: z.array(z.string()).optional()
});

interface OPAResponse {
  result: {
    allow: boolean;
    action: 'allow' | 'deny' | 'require_mfa';
    risk_score: number;
    reason: string;
    policy_results: Record<string, any>;
    details: Record<string, any>;
  };
}

// OPA Client Service
class OPAService {
  private opaUrl: string;

  constructor() {
    this.opaUrl = process.env.OPA_URL || 'http://localhost:8181';
  }

  async evaluateRisk(input: any): Promise<OPAResponse> {
    try {
      const response = await fetch(`${this.opaUrl}/v1/data/risk_aggregation/decision`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ input })
      });

      if (!response.ok) {
        throw new Error(`OPA request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('OPA evaluation failed:', error);
      // Fallback to deny for safety
      return {
        result: {
          allow: false,
          action: 'deny',
          risk_score: 100,
          reason: 'Policy evaluation service unavailable',
          policy_results: {},
          details: { error: error instanceof Error ? error.message : 'Unknown error' }
        }
      };
    }
  }

  async loadPolicyData(): Promise<void> {
    try {
      // Load policy data from database or external sources
      const policyData = await this.buildPolicyData();
      
      const response = await fetch(`${this.opaUrl}/v1/data`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(policyData)
      });

      if (!response.ok) {
        console.error('Failed to load policy data into OPA');
      }
    } catch (error) {
      console.error('Error loading policy data:', error);
    }
  }

  private async buildPolicyData(): Promise<any> {
    // Build dynamic policy data from database
    const users = await User.find({});
    const adminUsers = users.filter(u => u.isAdmin).map(u => u.email);
    const trustedDevices = users.map(u => u.deviceFingerprint).filter(Boolean);

    // Get recent access logs for behavioral analysis
    const recentLogs = await AccessLog.find({
      timestamp: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
    });

    // Build user locations from recent successful logins
    const userLocations: Record<string, any> = {};
    const lastLogins: Record<string, any> = {};
    const failedAttempts: Record<string, any[]> = {};

    for (const log of recentLogs) {
      const userId = log.userId.toString();
      
      if (log.allowed && log.location) {
        userLocations[userId] = {
          latitude: 0, // Would need to parse from location string
          longitude: 0,
          country: log.location.split(',').pop()?.trim() || 'Unknown',
          city: log.location.split(',')[0]?.trim() || 'Unknown'
        };
        
        if (!lastLogins[userId] || new Date(log.timestamp) > new Date(lastLogins[userId].timestamp)) {
          lastLogins[userId] = {
            timestamp: log.timestamp.toISOString(),
            location: userLocations[userId]
          };
        }
      }

      if (!log.allowed) {
        if (!failedAttempts[userId]) {
          failedAttempts[userId] = [];
        }
        failedAttempts[userId].push({
          timestamp: log.timestamp.toISOString(),
          ip_address: log.ipAddress,
          reason: log.reason || 'authentication_failed'
        });
      }
    }

    // Build user baselines (simplified)
    const userBaselines: Record<string, any> = {};
    for (const user of users) {
      const userId = user._id.toString();
      const userLogs = recentLogs.filter(log => log.userId.toString() === userId && log.allowed);
      
      if (userLogs.length > 0) {
        const hours = userLogs.map(log => new Date(log.timestamp).getHours());
        const countries = [...new Set(userLogs.map(log => log.location?.split(',').pop()?.trim()).filter(Boolean))];
        
        userBaselines[userId] = {
          usual_countries: countries,
          usual_hours: [...new Set(hours)],
          usual_days: [1, 2, 3, 4, 5], // Default business days
          usual_user_agents: [...new Set(userLogs.map(log => log.userAgent).filter(Boolean))],
          avg_session_duration: 3600,
          avg_daily_logins: Math.ceil(userLogs.length / 7),
          usual_file_types: ['pdf', 'docx', 'xlsx', 'jpg', 'png'],
          avg_data_transfer: 50,
          avg_actions_per_minute: 2,
          usual_pages: ['/dashboard', '/files', '/profile']
        };
      }
    }

    // Build MFA status
    const userMfaStatus: Record<string, any> = {};
    for (const user of users) {
      const userId = user._id.toString();
      userMfaStatus[userId] = {
        enabled: user.mfaFactors && user.mfaFactors.length > 0,
        methods: user.mfaFactors?.map(f => f.type) || [],
        backup_codes: 10 // Default
      };
    }

    return {
      trusted_devices: trustedDevices,
      blocked_countries: ['KP', 'IR', 'SY', 'CU', 'SD'],
      malicious_ips: ['192.168.1.100', '10.0.0.50'],
      high_risk_ips: ['185.220.100.240', '185.220.101.1'],
      trusted_networks: ['192.168.1.0/24', '10.0.0.0/8'],
      admin_users: adminUsers,
      user_locations: userLocations,
      last_logins: lastLogins,
      failed_attempts: failedAttempts,
      user_baselines: userBaselines,
      user_mfa_status: userMfaStatus,
      recent_user_activity: {} // Would be populated from activity logs
    };
  }
}

const opaService = new OPAService();

// Initialize policy data on startup
opaService.loadPolicyData().catch(console.error);

// Evaluate risk endpoint
router.post('/evaluate-risk', authenticateToken, async (req: AuthRequest, res) => {
  try {
    console.log('Risk evaluation request:', req.body);
    
    const input = riskEvaluationSchema.parse(req.body);
    
    // Add user context
    const user = await User.findById(req.user?.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Enhance input with user data
    const enhancedInput = {
      ...input,
      user_id: user._id.toString(),
      email: user.email,
      user_age_days: Math.floor((Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24))
    };

    // Evaluate with OPA
    const opaResponse = await opaService.evaluateRisk(enhancedInput);
    
    // Log the evaluation
    await new AccessLog({
      userId: user._id,
      action: input.action,
      riskScore: opaResponse.result.risk_score,
      ipAddress: input.ip_address,
      userAgent: input.user_agent,
      deviceFingerprint: input.device_fingerprint,
      location: `${input.location.city}, ${input.location.country}`,
      allowed: opaResponse.result.allow,
      reason: opaResponse.result.reason,
      zkpVerified: user.zkProofData?.verified || false,
      timestamp: new Date(input.timestamp)
    }).save();

    res.json({
      decision: opaResponse.result.action,
      allow: opaResponse.result.allow,
      risk_score: opaResponse.result.risk_score,
      reason: opaResponse.result.reason,
      require_mfa: opaResponse.result.action === 'require_mfa',
      policy_results: opaResponse.result.policy_results,
      details: opaResponse.result.details,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid request format',
        details: error.issues
      });
    }

    console.error('Risk evaluation error:', error);
    res.status(500).json({
      error: 'Risk evaluation failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get policy status
router.get('/policy-status', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const response = await fetch(`${opaService['opaUrl']}/health`);
    const isHealthy = response.ok;

    res.json({
      opa_healthy: isHealthy,
      opa_url: opaService['opaUrl'],
      policies_loaded: isHealthy,
      last_data_refresh: new Date().toISOString()
    });
  } catch (error) {
    res.json({
      opa_healthy: false,
      opa_url: opaService['opaUrl'],
      policies_loaded: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Trust device endpoint
router.post('/trust-device', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { deviceFingerprint, trustAfterMFA } = req.body;
    
    const user = await User.findById(req.user?.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update user's trusted device
    if (deviceFingerprint && trustAfterMFA) {
      user.deviceFingerprint = deviceFingerprint;
      await user.save();

      // Log the trust action
      await new AccessLog({
        userId: user._id,
        action: 'trust_device',
        riskScore: 0,
        ipAddress: req.ip || 'unknown',
        userAgent: req.headers['user-agent'],
        deviceFingerprint: deviceFingerprint,
        allowed: true,
        reason: 'Device marked as trusted after MFA verification'
      }).save();

      res.json({
        message: 'Device marked as trusted',
        deviceFingerprint: deviceFingerprint,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(400).json({ error: 'Invalid trust device request' });
    }
  } catch (error) {
    console.error('Trust device error:', error);
    res.status(500).json({
      error: 'Failed to trust device',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Refresh policy data
router.post('/refresh-policy-data', authenticateToken, async (req: AuthRequest, res) => {
  try {
    // Only allow admin users to refresh policy data
    const user = await User.findById(req.user?.userId);
    if (!user?.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    await opaService.loadPolicyData();
    
    res.json({
      message: 'Policy data refreshed successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Policy data refresh error:', error);
    res.status(500).json({
      error: 'Failed to refresh policy data',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;