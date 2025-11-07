import type { Request, Response, NextFunction } from 'express';
import DeviceAuthService from '../utils/deviceAuth';
import { User } from '../models/User';
import { AccessLog } from '../models/AccessLog';

export interface DeviceAuthRequest extends Request {
  deviceInfo?: {
    fingerprint: string;
    userAgent: string;
    ipAddress: string;
    location?: string;
    isRecognized: boolean;
    riskScore: number;
    riskFactors: string[];
  };
}

export const deviceAuthentication = async (
  req: DeviceAuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // IMPORTANT: Use device fingerprint from request body (sent by frontend)
    // NOT generated server-side, as they will never match
    const clientDeviceFingerprint = req.body.deviceFingerprint;
    const clientLocation = req.body.location;
    
    // Get IP and user agent from request
    const ipAddress = DeviceAuthService.getClientIP(req);
    const userAgent = req.headers['user-agent'] || 'unknown';
    
    // Get location from IP if not provided by client
    let location = clientLocation;
    if (!location) {
      const locationInfo = await DeviceAuthService.getLocationFromIP(ipAddress);
      location = locationInfo 
        ? `${locationInfo.city}, ${locationInfo.country}`
        : undefined;
    }

    // If user is authenticated, validate against registered device/location
    let isRecognized = true;
    let riskScore = 0;
    let riskFactors: string[] = [];

    if (req.body.email && clientDeviceFingerprint) {
      // For login attempts, check against registered user
      const user = await User.findOne({ email: req.body.email });
      
      if (user && user.deviceFingerprint) {
        // Validate device fingerprint (use client-provided fingerprint)
        const deviceValidation = DeviceAuthService.validateDeviceFingerprint(
          clientDeviceFingerprint,
          user.deviceFingerprint
        );

        // Validate location
        const locationValidation = DeviceAuthService.validateLocation(
          location,
          user.registeredLocation
        );

        // Calculate risk score
        const riskCalculation = DeviceAuthService.calculateDeviceRiskScore(
          deviceValidation,
          locationValidation,
          {
            isNewDevice: !user.deviceFingerprint,
            recentFailedAttempts: 0 // TODO: Implement failed attempt tracking
          }
        );

        isRecognized = deviceValidation.isMatch && locationValidation.isMatch;
        riskScore = riskCalculation.totalRisk;
        riskFactors = riskCalculation.factors;
      } else if (user && !user.deviceFingerprint) {
        // User exists but no registered device - allow with low risk
        isRecognized = true;
        riskScore = 10;
        riskFactors = ['no_registered_device'];
      }
    }

    // Attach device info to request
    req.deviceInfo = {
      fingerprint: clientDeviceFingerprint || 'unknown',
      userAgent,
      ipAddress,
      location,
      isRecognized,
      riskScore,
      riskFactors
    };

    next();
  } catch (error) {
    console.error('Device authentication error:', error);
    // Continue with default values on error
    req.deviceInfo = {
      fingerprint: req.body.deviceFingerprint || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
      ipAddress: DeviceAuthService.getClientIP(req),
      location: req.body.location,
      isRecognized: false,
      riskScore: 50, // High risk on error
      riskFactors: ['device_auth_error']
    };
    next();
  }
};

export const logDeviceAccess = async (
  req: DeviceAuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const originalSend = res.send;
    
    res.send = function(data) {
      // Log device access after response
      setImmediate(async () => {
        try {
          if (req.deviceInfo && req.body.email) {
            const user = await User.findOne({ email: req.body.email });
            
            if (user) {
              await new AccessLog({
                userId: user._id,
                action: req.path.includes('login') ? 'login' : 'register',
                riskScore: req.deviceInfo.riskScore,
                ipAddress: req.deviceInfo.ipAddress,
                userAgent: req.deviceInfo.userAgent,
                deviceFingerprint: req.deviceInfo.fingerprint,
                location: req.deviceInfo.location,
                allowed: res.statusCode < 400,
                reason: !req.deviceInfo.isRecognized 
                  ? `Device/location not recognized: ${req.deviceInfo.riskFactors.join(', ')}`
                  : undefined
              }).save();
            }
          }
        } catch (error) {
          console.error('Failed to log device access:', error);
        }
      });

      return originalSend.call(this, data);
    };

    next();
  } catch (error) {
    console.error('Device logging middleware error:', error);
    next();
  }
};