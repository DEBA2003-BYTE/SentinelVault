import type { Request, Response, NextFunction } from 'express';
import { type AuthRequest } from './auth';
import { AccessLog } from '../models/AccessLog';

export interface RiskRequest extends AuthRequest {
  riskScore?: number;
  riskData?: {
    ipAddress: string;
    userAgent: string;
    deviceFingerprint?: string;
    location?: string;
  };
}

export const assessRisk = async (req: RiskRequest, res: Response, next: NextFunction) => {
  try {
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';
    const deviceFingerprint = req.headers['x-device-fingerprint'] as string;

    // Simple risk scoring logic
    let riskScore = 0;

    // Check for suspicious IP patterns
    if (ipAddress.includes('tor') || ipAddress.includes('proxy')) {
      riskScore += 30;
    }

    // Check recent failed attempts
    if (req.user) {
      const recentLogs = await AccessLog.find({
        userId: req.user.id,
        timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // Last 24 hours
        allowed: false
      }).limit(10);

      riskScore += recentLogs.length * 5;
    }

    // Check for unusual user agent
    if (!userAgent.includes('Mozilla') && !userAgent.includes('Chrome')) {
      riskScore += 10;
    }

    // Location-based risk (simplified)
    const location = req.headers['x-user-location'] as string;
    if (location && (location.includes('VPN') || location.includes('Unknown'))) {
      riskScore += 15;
    }

    // Cap risk score at 100
    riskScore = Math.min(riskScore, 100);

    req.riskScore = riskScore;
    req.riskData = {
      ipAddress,
      userAgent,
      deviceFingerprint,
      location
    };

    next();
  } catch (error) {
    console.error('Risk assessment error:', error);
    req.riskScore = 50; // Default medium risk
    next();
  }
};

export const enforceRiskPolicy = (maxRiskScore: number = 70) => {
  return (req: RiskRequest, res: Response, next: NextFunction) => {
    const riskScore = req.riskScore || 0;
    
    if (riskScore > maxRiskScore) {
      return res.status(403).json({
        error: 'Access denied due to high risk score',
        riskScore,
        maxAllowed: maxRiskScore
      });
    }

    next();
  };
};