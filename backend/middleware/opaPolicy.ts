import type { Request, Response, NextFunction } from 'express';
import type { AuthRequest } from './auth';
import type { RiskRequest } from './riskAssessment';
import { opaService } from '../utils/opa';
import { AccessLog } from '../models/AccessLog';

interface OPARequest extends AuthRequest, RiskRequest {
  opaDecision?: {
    allow: boolean;
    reason?: string;
    factors?: string[];
  };
}

export const enforceOPAPolicy = (action: string, resource?: string) => {
  return async (req: OPARequest, res: Response, next: NextFunction) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const riskScore = req.riskScore || 0;

      // Prepare OPA input
      const opaInput = {
        user: {
          id: user.id,
          email: user.email,
          verified: true,
          isAdmin: user.isAdmin || false,
          zkpVerified: user.zkpVerified || false
        },
        action,
        resource,
        riskScore,
        deviceFingerprint: req.riskData?.deviceFingerprint,
        registeredFingerprint: user.deviceFingerprint,
        location: req.riskData?.location,
        registeredLocation: user.registeredLocation,
        ipAddress: req.riskData?.ipAddress || 'unknown',
        timestamp: new Date().toISOString()
      };

      // Evaluate with OPA
      const decision = await opaService.evaluatePolicy(opaInput);

      // Store decision in request for later use
      req.opaDecision = decision;

      if (!decision.allow) {
        // Log the denied access
        await new AccessLog({
          userId: user.id,
          action: action as any,
          riskScore,
          ipAddress: req.riskData?.ipAddress || 'unknown',
          userAgent: req.riskData?.userAgent,
          deviceFingerprint: req.riskData?.deviceFingerprint,
          location: req.riskData?.location,
          allowed: false,
          reason: decision.reason,
          opaDecision: 'deny'
        }).save();

        return res.status(403).json({
          error: 'Access denied by policy',
          reason: decision.reason || 'Policy violation detected',
          riskScore,
          factors: decision.factors,
          opaDecision: 'deny'
        });
      }

      // Policy allows access, continue to next middleware
      next();
    } catch (error) {
      console.error('OPA policy enforcement error:', error);
      // In case of OPA service failure, we can either:
      // 1. Fail-safe (allow access) - current implementation
      // 2. Fail-secure (deny access) - uncomment the line below
      // return res.status(500).json({ error: 'Policy service unavailable' });
      
      next(); // Fail-safe approach
    }
  };
};

export const logOPADecision = async (req: OPARequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    const decision = req.opaDecision;

    if (user && decision && decision.allow) {
      // Log successful access
      await new AccessLog({
        userId: user.id,
        action: 'access_granted' as any,
        riskScore: req.riskScore || 0,
        ipAddress: req.riskData?.ipAddress || 'unknown',
        userAgent: req.riskData?.userAgent,
        deviceFingerprint: req.riskData?.deviceFingerprint,
        location: req.riskData?.location,
        allowed: true,
        opaDecision: 'allow'
      }).save();
    }

    next();
  } catch (error) {
    console.error('OPA decision logging error:', error);
    next(); // Continue even if logging fails
  }
};

export type { OPARequest };