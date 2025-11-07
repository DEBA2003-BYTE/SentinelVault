import { Request } from 'express';
import { IUser } from '../models/User';
import geoip from 'geoip-lite';

interface RiskContext {
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

export class RiskAssessmentService {
  
  /**
   * Collect comprehensive risk context for OPA evaluation
   */
  async collectRiskContext(
    req: Request, 
    user: IUser, 
    additionalData?: {
      typing_speed?: number;
      failed_attempts?: number;
      behavioral_score?: number;
    }
  ): Promise<RiskContext> {
    const ip = this.extractClientIP(req);
    const userAgent = req.headers['user-agent'] || '';
    const deviceFingerprint = req.headers['x-device-fingerprint'] as string;
    
    // Get location from IP
    const location = this.getLocationFromIP(ip);
    
    // Get network reputation
    const networkInfo = await this.analyzeNetwork(ip, userAgent);
    
    // Get recent login count
    const recentLoginCount = await this.getRecentLoginCount(user._id.toString());
    
    // Get failed login attempts (from session or database)
    const failedAttempts = additionalData?.failed_attempts || 0;
    
    return {
      user: {
        id: user._id.toString(),
        email: user.email,
        verified: !user.isBlocked,
        isAdmin: user.isAdmin,
        zkpVerified: user.zkProofData?.verified || false,
        registered_device_fingerprint: user.deviceFingerprint,
        registered_location: user.registeredLocation ? this.parseLocation(user.registeredLocation) : undefined,
        baseline_typing_speed: this.getBaselineTypingSpeed(user),
        registered_user_agent: this.getRegisteredUserAgent(user),
        created_at: user.createdAt.toISOString()
      },
      device_fingerprint: deviceFingerprint,
      location,
      timestamp: new Date().toISOString(),
      typing_speed: additionalData?.typing_speed,
      failed_login_attempts: failedAttempts,
      user_agent: userAgent,
      network: networkInfo,
      behavioral_score: additionalData?.behavioral_score || 0,
      recent_login_count: recentLoginCount,
      ip_address: ip
    };
  }

  /**
   * Extract client IP address from request
   */
  private extractClientIP(req: Request): string {
    return (
      req.headers['x-forwarded-for'] as string ||
      req.headers['x-real-ip'] as string ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      '127.0.0.1'
    ).split(',')[0].trim();
  }

  /**
   * Get location information from IP address
   */
  private getLocationFromIP(ip: string): { country: string; city: string; region: string } | undefined {
    try {
      const geo = geoip.lookup(ip);
      if (geo) {
        return {
          country: geo.country,
          city: geo.city,
          region: geo.region
        };
      }
    } catch (error) {
      console.error('Geolocation lookup failed:', error);
    }
    return undefined;
  }

  /**
   * Parse location string into structured format
   */
  private parseLocation(locationString: string): { country: string; city: string; region: string } | undefined {
    try {
      // Assuming format: "City, Region, Country" or "City, Country"
      const parts = locationString.split(',').map(part => part.trim());
      if (parts.length >= 2) {
        return {
          city: parts[0],
          region: parts.length > 2 ? parts[1] : '',
          country: parts[parts.length - 1]
        };
      }
    } catch (error) {
      console.error('Location parsing failed:', error);
    }
    return undefined;
  }

  /**
   * Analyze network characteristics
   */
  private async analyzeNetwork(ip: string, userAgent: string): Promise<{
    is_vpn: boolean;
    is_tor: boolean;
    reputation: string;
  }> {
    // Basic VPN/Tor detection (in production, use specialized services)
    const isVPN = this.detectVPN(ip, userAgent);
    const isTor = this.detectTor(ip);
    const reputation = await this.getIPReputation(ip);

    return {
      is_vpn: isVPN,
      is_tor: isTor,
      reputation
    };
  }

  /**
   * Basic VPN detection
   */
  private detectVPN(ip: string, userAgent: string): boolean {
    // Simple heuristics - in production, use VPN detection services
    const vpnIndicators = [
      'vpn', 'proxy', 'tunnel', 'anonymizer'
    ];
    
    const userAgentLower = userAgent.toLowerCase();
    return vpnIndicators.some(indicator => userAgentLower.includes(indicator));
  }

  /**
   * Basic Tor detection
   */
  private detectTor(ip: string): boolean {
    // In production, check against Tor exit node lists
    // This is a simplified check
    return ip.startsWith('127.') || ip.startsWith('10.');
  }

  /**
   * Get IP reputation
   */
  private async getIPReputation(ip: string): Promise<string> {
    // In production, integrate with threat intelligence services
    // For now, return basic classification
    if (ip.startsWith('127.') || ip.startsWith('10.') || ip.startsWith('192.168.')) {
      return 'local';
    }
    
    // Simple reputation check (expand with real services)
    const suspiciousRanges = ['185.', '91.', '46.'];
    if (suspiciousRanges.some(range => ip.startsWith(range))) {
      return 'suspicious';
    }
    
    return 'clean';
  }

  /**
   * Get recent login count for user
   */
  private async getRecentLoginCount(userId: string): Promise<number> {
    try {
      const { AccessLog } = await import('../models/AccessLog');
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      
      const count = await AccessLog.countDocuments({
        userId,
        action: 'login',
        timestamp: { $gte: oneHourAgo },
        allowed: true
      });
      
      return count;
    } catch (error) {
      console.error('Failed to get recent login count:', error);
      return 0;
    }
  }

  /**
   * Get baseline typing speed for user
   */
  private getBaselineTypingSpeed(user: IUser): number {
    // In production, calculate from historical data
    // For now, return a default baseline
    return 40; // words per minute
  }

  /**
   * Get registered user agent for user
   */
  private getRegisteredUserAgent(user: IUser): string | undefined {
    // In production, store and retrieve from user profile
    // For now, return undefined to indicate no baseline
    return undefined;
  }

  /**
   * Calculate behavioral score based on navigation patterns
   */
  calculateBehavioralScore(req: Request): number {
    // In production, analyze navigation patterns, click patterns, etc.
    // For now, return a random score for demonstration
    const referer = req.headers.referer;
    const userAgent = req.headers['user-agent'];
    
    let score = 0;
    
    // Check for suspicious patterns
    if (!referer) score += 20; // Direct access might be suspicious
    if (userAgent && userAgent.includes('bot')) score += 50; // Bot detection
    
    return Math.min(score, 100);
  }

  /**
   * Measure typing speed from login form
   */
  measureTypingSpeed(keystrokes: { timestamp: number; key: string }[]): number {
    if (keystrokes.length < 2) return 0;
    
    const totalTime = keystrokes[keystrokes.length - 1].timestamp - keystrokes[0].timestamp;
    const totalChars = keystrokes.length;
    
    // Calculate WPM (assuming average word length of 5 characters)
    const wpm = (totalChars / 5) / (totalTime / 60000);
    
    return Math.round(wpm);
  }
}

export const riskAssessmentService = new RiskAssessmentService();