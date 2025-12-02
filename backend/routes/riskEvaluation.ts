import express from 'express';
import { z } from 'zod';
import mongoose, { type Document } from 'mongoose';
import { authenticateToken, type AuthRequest } from '../middleware/auth';
import { AccessLog, type IAccessLog } from '../models/AccessLog';
import { User, type IUser } from '../models/User';

// Extended interfaces for type safety
interface IAccessLogExtended extends Omit<IAccessLog, 'location'> {
  ipAddress?: string;
  userAgent?: string;
  userId: string | any;
  location?: {
    type: string;
    coordinates: [number, number];
    name?: string;
  } | string; // Support both GeoJSON and string formats
  timestamp: Date;
  allowed: boolean;
  reason?: string;
}

interface IUserExtended extends Omit<IUser, 'mfaFactors'> {
  userId: string;
  mfaFactors?: Array<{
    type: string;
    secretHash: string;
    isActive: boolean;
    createdAt: Date;
    lastUsed?: Date;
    metadata?: any;
  }>;
  deviceFingerprint?: string;
  _id: any;
  email: string;
  isAdmin: boolean;
}

interface Location {
  type?: string;
  coordinates?: [number, number];
  name?: string;
}

interface UserLocation {
  latitude: number;
  longitude: number;
  country: string;
  city: string;
}

interface UserLoginInfo {
  timestamp: string;
  location: UserLocation;
}

interface FailedAttempt {
  timestamp: string;
  ip_address: string;
  reason: string;
}

interface UserBaseline {
  usual_countries: string[];
  usual_hours: number[];
  usual_days: number[];
  usual_user_agents: string[];
  avg_session_duration: number;
  avg_daily_logins: number;
  usual_file_types: string[];
  avg_data_transfer: number;
  avg_actions_per_minute: number;
}

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
      const response = await fetch(`${this.opaUrl}/v1/data/rbac/allow`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ input })
      });

      if (!response.ok) {
        throw new Error(`OPA request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json() as { result: OPAResponse };
      return data.result;
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
      // Check if MongoDB is connected before loading policy data
      if (mongoose.connection.readyState !== 1) {
        console.log('⚠️  Skipping policy data load - MongoDB not connected');
        return;
      }

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
      } else {
        console.log('✅ Policy data loaded into OPA successfully');
      }
    } catch (error) {
      console.error('Error loading policy data:', error);
    }
  }

  private async buildPolicyData(): Promise<Record<string, any>> {
    // Get users with proper typing
    const userDocs = await User.find({}).lean();
    const users: IUserExtended[] = userDocs.map(doc => {
      // Use type assertion to handle Mongoose document
      const user = doc as unknown as IUser & { _id: any };
      return {
        ...user,
        _id: user._id.toString(),
        email: user.email,
        isAdmin: user.isAdmin || false,
        deviceFingerprint: user.deviceFingerprint,
        mfaFactors: (user.mfaFactors || []).map(factor => ({
          type: factor.type,
          secretHash: factor.secretHash,
          isActive: factor.isActive,
          createdAt: factor.createdAt,
          lastUsed: factor.lastUsed,
          metadata: factor.metadata
        }))
      } as IUserExtended;
    });
    
    const adminUsers = users.filter(u => u.isAdmin).map(u => u.email);
    const trustedDevices = users.map(u => u.deviceFingerprint).filter(Boolean);

    // Get recent access logs for behavioral analysis
    const recentLogs = (await AccessLog.find({
      timestamp: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
    }).lean()) as unknown as IAccessLogExtended[];

    // Build user locations from recent successful logins
    const userLocations: Record<string, UserLocation> = {};
    const lastLogins: Record<string, UserLoginInfo> = {};
    const failedAttempts: Record<string, FailedAttempt[]> = {};

    for (const log of recentLogs) {
      const userId = log.userId.toString();
      
      if (log.allowed && log.location) {
        // Handle both string and GeoJSON location formats
        let latitude = 0;
        let longitude = 0;
        let country = 'Unknown';
        let city = 'Unknown';
        
        if (typeof log.location === 'string') {
          // Old string format
          const parts = log.location.split(',').map(p => p.trim());
          city = parts[0] || 'Unknown';
          country = parts[parts.length - 1] || 'Unknown';
        } else if (log.location && typeof log.location === 'object' && 'coordinates' in log.location) {
          // GeoJSON format
          const loc = log.location as { coordinates?: [number, number]; name?: string };
          if (loc.coordinates) {
            [longitude, latitude] = loc.coordinates;
          }
          if (loc.name) {
            const parts = loc.name.split(',').map(p => p.trim());
            city = parts[0] || 'Unknown';
            country = parts[parts.length - 1] || 'Unknown';
          }
        }
        
        userLocations[userId] = {
          latitude,
          longitude,
          country,
          city
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
          ip_address: log.ipAddress || 'unknown',
          reason: log.reason || 'authentication_failed'
        });
      }
    }

    // Build user baselines (simplified)
    const userBaselines: Record<string, UserBaseline> = {};
    for (const user of users) {
      const userId = user._id.toString();
      const userLogs = recentLogs.filter(log => log.userId.toString() === userId && log.allowed);
      
      if (userLogs.length > 0) {
        const hours = userLogs.map(log => new Date(log.timestamp).getHours());
        const countries = [...new Set(
          userLogs
            .map(log => {
              if (!log.location) return null;
              if (typeof log.location === 'string') {
                const parts = log.location.split(',').map((p: string) => p.trim());
                return parts[parts.length - 1] || null;
              } else if (log.location && typeof log.location === 'object' && 'name' in log.location && log.location.name) {
                const name = log.location.name;
                if (typeof name === 'string') {
                  const parts = name.split(',').map((p: string) => p.trim());
                  return parts[parts.length - 1] || null;
                }
              }
              return null;
            })
            .filter((country): country is string => !!country)
        )];
        
        userBaselines[userId] = {
          usual_countries: countries,
          usual_hours: [...new Set(hours)],
          usual_days: [1, 2, 3, 4, 5], // Default business days
          usual_user_agents: [...new Set(
            userLogs
              .map(log => (log as IAccessLogExtended).userAgent)
              .filter((agent): agent is string => !!agent)
          )],
          avg_session_duration: 3600,
          avg_daily_logins: Math.ceil(userLogs.length / 7),
          usual_file_types: ['pdf', 'docx', 'xlsx', 'jpg', 'png'],
          avg_data_transfer: 50,
          avg_actions_per_minute: 2,
          // Removed usual_pages as it's not in UserBaseline type
        };
      }
    }

    // Build MFA status
    const userMfaStatus: Record<string, {
      enabled: boolean;
      methods: string[];
      backup_codes: number;
    }> = {};
    
    for (const user of users) {
      const userId = user._id;
      userMfaStatus[userId] = {
        enabled: !!(user.mfaFactors && user.mfaFactors.length > 0),
        methods: user.mfaFactors?.map((f: any) => f.type) || [],
        backup_codes: 10 // Default
      };
    }

    // Return the complete policy data
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
      recent_user_activity: {},
      system_metrics: {
        total_users: users.length,
        total_logs: recentLogs.length,
        last_updated: new Date().toISOString()
      }
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
    if (!req.user?.id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Enhance input with user data
    const enhancedInput = {
      ...input,
      user_id: user.id,
      email: user.email,
      user_age_days: Math.floor((Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24))
    };

    // Get user ID safely
    const userId = user.id;

    // Evaluate with OPA
    const opaResponse = await opaService.evaluateRisk(enhancedInput);
    
    // Log the evaluation with detailed policy results
    await new AccessLog({
      userId: user.id,
      action: input.action,
      riskScore: opaResponse.result.risk_score,
      ipAddress: input.ip_address,
      userAgent: input.user_agent,
      location: {
        type: 'Point',
        coordinates: [input.location.longitude || 0, input.location.latitude || 0],
        name: `${input.location.city}, ${input.location.country}`
      },
      allowed: opaResponse.result.allow,
      reason: opaResponse.result.reason,
      zkpVerified: user.zkProofData?.verified || false,
      timestamp: new Date(input.timestamp),
      riskAssessment: {
        policy_results: opaResponse.result.policy_results,
        weighted_scores: opaResponse.result.details?.weighted_scores,
        details: opaResponse.result.details
      }
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

// Refresh policy data
router.post('/refresh-policy-data', authenticateToken, async (req: AuthRequest, res) => {
  try {
    // Only allow admin users to refresh policy data
    // Get user ID from request and verify admin status
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const user = await User.findById(userId);
    if (!user?.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Load policy data with the user's ID
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