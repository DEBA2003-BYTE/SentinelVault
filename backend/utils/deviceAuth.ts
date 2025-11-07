import { Request } from 'express';
import crypto from 'crypto';

export interface DeviceInfo {
  fingerprint: string;
  userAgent: string;
  ipAddress: string;
  acceptLanguage?: string;
  acceptEncoding?: string;
  platform?: string;
  screenResolution?: string;
  timezone?: string;
}

export interface LocationInfo {
  country?: string;
  region?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  isp?: string;
}

export class DeviceAuthService {
  /**
   * Generate a device fingerprint from request headers and client info
   */
  static generateDeviceFingerprint(req: Request, clientInfo?: any): string {
    const components = [
      req.headers['user-agent'] || '',
      req.headers['accept-language'] || '',
      req.headers['accept-encoding'] || '',
      req.headers['accept'] || '',
      clientInfo?.screenResolution || '',
      clientInfo?.timezone || '',
      clientInfo?.platform || '',
      clientInfo?.colorDepth || '',
      clientInfo?.pixelRatio || ''
    ];

    const fingerprint = components.join('|');
    return crypto.createHash('sha256').update(fingerprint).digest('hex').substring(0, 32);
  }

  /**
   * Extract device information from request
   */
  static extractDeviceInfo(req: Request, clientInfo?: any): DeviceInfo {
    return {
      fingerprint: this.generateDeviceFingerprint(req, clientInfo),
      userAgent: req.headers['user-agent'] || 'Unknown',
      ipAddress: this.getClientIP(req),
      acceptLanguage: req.headers['accept-language'],
      acceptEncoding: req.headers['accept-encoding'],
      platform: clientInfo?.platform,
      screenResolution: clientInfo?.screenResolution,
      timezone: clientInfo?.timezone
    };
  }

  /**
   * Get client IP address from request
   */
  static getClientIP(req: Request): string {
    return (
      req.headers['x-forwarded-for'] as string ||
      req.headers['x-real-ip'] as string ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      'unknown'
    ).split(',')[0].trim();
  }

  /**
   * Validate device fingerprint match
   */
  static validateDeviceFingerprint(
    currentFingerprint: string,
    registeredFingerprint?: string
  ): { isMatch: boolean; riskScore: number; reason?: string } {
    if (!registeredFingerprint) {
      return {
        isMatch: false,
        riskScore: 15,
        reason: 'No registered device fingerprint'
      };
    }

    if (currentFingerprint === registeredFingerprint) {
      return {
        isMatch: true,
        riskScore: 0
      };
    }

    return {
      isMatch: false,
      riskScore: 25,
      reason: 'Device fingerprint mismatch - unrecognized device'
    };
  }

  /**
   * Validate location consistency
   */
  static validateLocation(
    currentLocation?: string,
    registeredLocation?: string
  ): { isMatch: boolean; riskScore: number; reason?: string } {
    if (!registeredLocation || !currentLocation) {
      return {
        isMatch: false,
        riskScore: 10,
        reason: 'Location information unavailable'
      };
    }

    // Extract country/region for comparison
    const currentCountry = currentLocation.split(',').pop()?.trim();
    const registeredCountry = registeredLocation.split(',').pop()?.trim();

    if (currentCountry === registeredCountry) {
      return {
        isMatch: true,
        riskScore: 0
      };
    }

    return {
      isMatch: false,
      riskScore: 20,
      reason: `Location mismatch: registered in ${registeredLocation}, accessing from ${currentLocation}`
    };
  }

  /**
   * Get location from IP address (simplified - in production use a proper service)
   */
  static async getLocationFromIP(ipAddress: string): Promise<LocationInfo | null> {
    try {
      // In production, use a proper IP geolocation service
      // For now, return mock data based on IP patterns
      if (ipAddress.startsWith('192.168.') || ipAddress.startsWith('10.') || ipAddress === 'unknown') {
        return {
          country: 'Unknown',
          region: 'Local Network',
          city: 'Local',
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        };
      }

      // Mock location data - replace with actual service
      return {
        country: 'India',
        region: 'West Bengal',
        city: 'Kolkata',
        timezone: 'Asia/Kolkata',
        isp: 'Local ISP'
      };
    } catch (error) {
      console.error('Failed to get location from IP:', error);
      return null;
    }
  }

  /**
   * Calculate comprehensive device risk score
   */
  static calculateDeviceRiskScore(
    deviceValidation: { isMatch: boolean; riskScore: number },
    locationValidation: { isMatch: boolean; riskScore: number },
    additionalFactors: {
      isNewDevice?: boolean;
      suspiciousUserAgent?: boolean;
      vpnDetected?: boolean;
      recentFailedAttempts?: number;
    } = {}
  ): { totalRisk: number; factors: string[] } {
    let totalRisk = deviceValidation.riskScore + locationValidation.riskScore;
    const factors: string[] = [];

    if (!deviceValidation.isMatch) {
      factors.push('device_mismatch');
    }

    if (!locationValidation.isMatch) {
      factors.push('location_anomaly');
    }

    if (additionalFactors.isNewDevice) {
      totalRisk += 15;
      factors.push('new_device');
    }

    if (additionalFactors.suspiciousUserAgent) {
      totalRisk += 10;
      factors.push('suspicious_user_agent');
    }

    if (additionalFactors.vpnDetected) {
      totalRisk += 20;
      factors.push('vpn_detected');
    }

    if (additionalFactors.recentFailedAttempts) {
      const failureRisk = Math.min(additionalFactors.recentFailedAttempts * 5, 30);
      totalRisk += failureRisk;
      factors.push('recent_failures');
    }

    return {
      totalRisk: Math.min(totalRisk, 100), // Cap at 100
      factors
    };
  }
}

export default DeviceAuthService;