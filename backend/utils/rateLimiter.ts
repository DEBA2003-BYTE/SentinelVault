import { Request } from 'express';
import { FailedLoginAttempt } from '../models/FailedLoginAttempt';
import { AdminNotification } from '../models/AdminNotification';
import { User } from '../models/User';
import { AccessLog } from '../models/AccessLog';

interface FailedAttemptData {
  email: string;
  ipAddress: string;
  userAgent?: string;
  deviceFingerprint?: string;
  location?: string;
  reason: string;
  riskScore?: number;
}

export class RateLimiterService {
  private readonly MAX_FAILED_ATTEMPTS = 5;
  private readonly LOCKOUT_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  private readonly ATTEMPT_WINDOW = 60 * 60 * 1000; // 1 hour window for counting attempts

  /**
   * Record a failed login attempt
   */
  async recordFailedAttempt(attemptData: FailedAttemptData): Promise<void> {
    try {
      // Record the failed attempt
      await new FailedLoginAttempt({
        email: attemptData.email,
        ipAddress: attemptData.ipAddress,
        userAgent: attemptData.userAgent,
        deviceFingerprint: attemptData.deviceFingerprint,
        location: attemptData.location,
        reason: attemptData.reason,
        riskScore: attemptData.riskScore,
        timestamp: new Date()
      }).save();

      // Check if this triggers account blocking
      await this.checkAndBlockAccount(attemptData.email, attemptData.ipAddress);
    } catch (error) {
      console.error('Failed to record failed attempt:', error);
    }
  }

  /**
   * Check if account should be blocked based on failed attempts
   */
  private async checkAndBlockAccount(email: string, ipAddress: string): Promise<void> {
    try {
      const oneHourAgo = new Date(Date.now() - this.ATTEMPT_WINDOW);
      
      // Count failed attempts in the last hour for this email
      const recentFailedAttempts = await FailedLoginAttempt.countDocuments({
        email,
        timestamp: { $gte: oneHourAgo }
      });

      console.log(`Failed attempts for ${email}: ${recentFailedAttempts}/${this.MAX_FAILED_ATTEMPTS}`);

      if (recentFailedAttempts >= this.MAX_FAILED_ATTEMPTS) {
        await this.blockAccount(email, ipAddress, recentFailedAttempts);
      }
    } catch (error) {
      console.error('Failed to check account blocking:', error);
    }
  }

  /**
   * Block account and notify admin
   */
  private async blockAccount(email: string, ipAddress: string, failedAttempts: number): Promise<void> {
    try {
      // Find and block the user
      const user = await User.findOne({ email });
      if (!user) {
        console.log(`User not found for blocking: ${email}`);
        return;
      }

      // Check if already blocked to avoid duplicate notifications
      if (user.isBlocked) {
        console.log(`User ${email} is already blocked`);
        return;
      }

      // Block the user
      user.isBlocked = true;
      user.rejectionReasons = user.rejectionReasons || [];
      user.rejectionReasons.push(`Account blocked due to ${failedAttempts} consecutive failed login attempts`);
      await user.save();

      // Get recent failed attempts for context
      const recentAttempts = await FailedLoginAttempt.find({
        email,
        timestamp: { $gte: new Date(Date.now() - this.ATTEMPT_WINDOW) }
      }).sort({ timestamp: -1 }).limit(10);

      // Create admin notification
      await this.createAdminNotification(user, failedAttempts, recentAttempts, ipAddress);

      // Log the blocking action
      await new AccessLog({
        userId: user._id,
        action: 'account_blocked',
        riskScore: 100,
        ipAddress,
        allowed: false,
        reason: `Account automatically blocked after ${failedAttempts} failed login attempts`,
        timestamp: new Date()
      }).save();

      console.log(`🚫 Account blocked: ${email} after ${failedAttempts} failed attempts`);
    } catch (error) {
      console.error('Failed to block account:', error);
    }
  }

  /**
   * Create admin notification for blocked account
   */
  private async createAdminNotification(
    user: any, 
    failedAttempts: number, 
    recentAttempts: any[], 
    ipAddress: string
  ): Promise<void> {
    try {
      const locations = [...new Set(recentAttempts.map(a => a.location).filter(Boolean))];
      const ipAddresses = [...new Set(recentAttempts.map(a => a.ipAddress))];
      const avgRiskScore = recentAttempts.reduce((sum, a) => sum + (a.riskScore || 0), 0) / recentAttempts.length;

      await new AdminNotification({
        type: 'account_blocked',
        title: `Account Blocked: ${user.email}`,
        message: `User account has been automatically blocked due to ${failedAttempts} consecutive failed login attempts within the last hour. Immediate admin review required.`,
        severity: 'critical',
        userId: user._id,
        userEmail: user.email,
        metadata: {
          failedAttempts,
          ipAddress,
          location: locations.join(', '),
          riskScore: Math.round(avgRiskScore),
          blockReason: `${failedAttempts} consecutive failed login attempts`
        },
        isRead: false,
        createdAt: new Date()
      }).save();

      console.log(`📧 Admin notification created for blocked account: ${user.email}`);
    } catch (error) {
      console.error('Failed to create admin notification:', error);
    }
  }

  /**
   * Get failed attempts count for an email in the last hour
   */
  async getFailedAttemptsCount(email: string): Promise<number> {
    try {
      const oneHourAgo = new Date(Date.now() - this.ATTEMPT_WINDOW);
      return await FailedLoginAttempt.countDocuments({
        email,
        timestamp: { $gte: oneHourAgo }
      });
    } catch (error) {
      console.error('Failed to get failed attempts count:', error);
      return 0;
    }
  }

  /**
   * Check if account is rate limited
   */
  async isAccountRateLimited(email: string): Promise<{
    isLimited: boolean;
    attemptsCount: number;
    remainingAttempts: number;
  }> {
    try {
      const attemptsCount = await this.getFailedAttemptsCount(email);
      const isLimited = attemptsCount >= this.MAX_FAILED_ATTEMPTS;
      const remainingAttempts = Math.max(0, this.MAX_FAILED_ATTEMPTS - attemptsCount);

      return {
        isLimited,
        attemptsCount,
        remainingAttempts
      };
    } catch (error) {
      console.error('Failed to check rate limit:', error);
      return {
        isLimited: false,
        attemptsCount: 0,
        remainingAttempts: this.MAX_FAILED_ATTEMPTS
      };
    }
  }

  /**
   * Clear failed attempts for successful login
   */
  async clearFailedAttempts(email: string): Promise<void> {
    try {
      await FailedLoginAttempt.deleteMany({ email });
      console.log(`✅ Cleared failed attempts for ${email}`);
    } catch (error) {
      console.error('Failed to clear failed attempts:', error);
    }
  }

  /**
   * Get recent failed attempts for analysis
   */
  async getRecentFailedAttempts(email: string, limit: number = 10): Promise<any[]> {
    try {
      return await FailedLoginAttempt.find({ email })
        .sort({ timestamp: -1 })
        .limit(limit)
        .lean();
    } catch (error) {
      console.error('Failed to get recent failed attempts:', error);
      return [];
    }
  }

  /**
   * Extract client information from request
   */
  extractClientInfo(req: Request): {
    ipAddress: string;
    userAgent?: string;
    deviceFingerprint?: string;
    location?: string;
  } {
    const ipAddress = (
      req.headers['x-forwarded-for'] as string ||
      req.headers['x-real-ip'] as string ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      '127.0.0.1'
    ).split(',')[0].trim();

    return {
      ipAddress,
      userAgent: req.headers['user-agent'],
      deviceFingerprint: req.headers['x-device-fingerprint'] as string,
      location: req.headers['x-user-location'] as string
    };
  }
}

export const rateLimiterService = new RateLimiterService();