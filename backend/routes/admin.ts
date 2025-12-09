import express from 'express';
import { authenticateToken, requireAdmin,type AuthRequest } from '../middleware/auth';
import { User } from '../models/User';
import { File } from '../models/File';
import { AccessLog } from '../models/AccessLog';
import { AdminNotification } from '../models/AdminNotification';
import { FailedLoginAttempt } from '../models/FailedLoginAttempt';
import { rateLimiterService } from '../utils/rateLimiter';

const router = express.Router();

// Get all users
router.get('/users', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
  try {
    console.log('Admin route accessed by user:', req.user?.id);
    
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const users = await User.find()
      .select('-passwordHash')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments();

    // Get file counts for each user
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const fileCount = await File.countDocuments({ userId: user._id });
        const recentLogins = await AccessLog.countDocuments({
          userId: user._id,
          action: 'login',
          allowed: true,
          timestamp: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
        });

        return {
          id: user._id,
          email: user.email,
          isBlocked: user.isBlocked,
          isAdmin: user.isAdmin,
          createdAt: user.createdAt,
          lastLogin: user.lastLogin,
          fileCount,
          recentLogins,
          zkpVerified: user.zkProofData?.verified || false,
          deviceFingerprint: user.deviceFingerprint,
          registeredLocation: user.registeredLocation,
          lastKnownLocation: user.lastKnownLocation,
          rejectionReasons: user.rejectionReasons || []
        };
      })
    );

    // Ensure we're not sending sensitive data
    const response = {
      users: usersWithStats.map(user => ({
        ...user,
        // Remove any sensitive data
        deviceFingerprint: undefined,
        registeredLocation: undefined,
        lastKnownLocation: undefined
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
    
    console.log(`Returning ${response.users.length} users`);
    res.json(response);
  } catch (error) {
    console.error('Get users error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error details:', {
      message: errorMessage,
      stack: error instanceof Error ? error.stack : 'No stack trace',
      userId: req.user?.id
    });
    res.status(500).json({ 
      error: 'Failed to get users',
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    });
  }
});

// Block/unblock user
router.post('/users/:id/block', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const userId = req.params.id;
    const { blocked } = req.body;

    console.log('Block/unblock user request:', { userId, blocked, adminId: req.user?.id });

    const user = await User.findById(userId);
    if (!user) {
      console.log('User not found:', userId);
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('Found user:', { email: user.email, isAdmin: user.isAdmin, currentlyBlocked: user.isBlocked });

    // Prevent blocking admin users
    if (user.isAdmin && blocked) {
      console.log('Attempted to block admin user:', user.email);
      return res.status(400).json({ error: 'Cannot block admin users' });
    }

    user.isBlocked = blocked;
    
    // If unblocking, clear the lock reason and reset ALL failed attempts to zero
    if (!blocked) {
      user.lockReason = undefined;
      
      // Delete ALL failed password attempts from RiskEvent collection (resets counter to 0)
      const { RiskEvent } = await import('../models/RiskEvent');
      const deletedCount = await RiskEvent.deleteMany({
        userId: user._id,
        action: 'failed-password'
      });
      
      // Also clear FailedLoginAttempt collection (used by rate limiter)
      await rateLimiterService.clearFailedAttempts(user.email);
      
      console.log(`✅ RESET: Cleared ${deletedCount.deletedCount} RiskEvent failed attempts for user ${user.email} - Counter now at 0`);
    }
    
    await user.save();

    console.log('User status updated:', { email: user.email, isBlocked: user.isBlocked });

    // Log the action
    await new AccessLog({
      userId: req.user!.id, // Admin who performed the action
      action: blocked ? 'admin_block_user' : 'admin_unblock_user',
      riskScore: 0,
      allowed: true,
      reason: `${blocked ? 'Blocked' : 'Unblocked'} user: ${user.email}`
    }).save();

    res.json({
      message: `User ${blocked ? 'blocked' : 'unblocked'} successfully`,
      user: {
        id: user._id,
        email: user.email,
        isBlocked: user.isBlocked,
        failedAttemptsReset: !blocked // Indicates if failed attempts were reset
      }
    });
  } catch (error) {
    console.error('Block user error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ 
      error: 'Failed to update user status',
      details: errorMessage 
    });
  }
});

// Delete user
router.delete('/users/:id', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const userId = req.params.id;
    console.log('Delete user request:', { userId, adminId: req.user?.id });

    const user = await User.findById(userId);
    if (!user) {
      console.log('User not found:', userId);
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('Found user to delete:', { email: user.email, isAdmin: user.isAdmin });

    // Prevent deleting admin users
    if (user.isAdmin) {
      console.log('Attempted to delete admin user:', user.email);
      return res.status(400).json({ error: 'Cannot delete admin users' });
    }

    // Delete user's files
    console.log('Deleting user files...');
    const deletedFiles = await File.deleteMany({ userId: user._id });
    console.log('Deleted files:', deletedFiles.deletedCount);

    // Delete user's access logs (optional - you might want to keep these for audit)
    // await AccessLog.deleteMany({ userId: user._id });

    // Delete the user
    console.log('Deleting user...');
    await User.findByIdAndDelete(userId);
    console.log('User deleted successfully');

    // Log the deletion
    console.log('Creating audit log...');
    await new AccessLog({
      userId: req.user!.id, // Admin who performed the deletion
      action: 'admin_delete_user',
      riskScore: 0,
      allowed: true,
      reason: `Deleted user: ${user.email}`
    }).save();

    console.log('Delete operation completed successfully');
    res.json({
      message: 'User deleted successfully',
      deletedUser: {
        id: user._id,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Delete user error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ 
      error: 'Failed to delete user',
      details: errorMessage 
    });
  }
});

// Get audit logs
router.get('/audit', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;
    const action = req.query.action as string;
    const userId = req.query.userId as string;

    // Build filter
    const filter: any = {};
    if (action) filter.action = action;
    if (userId) filter.userId = userId;

    const logs = await AccessLog.find(filter)
      .populate('userId', 'email')
      .populate('fileId', 'originalName')
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit);

    const total = await AccessLog.countDocuments(filter);

    res.json({
      logs: logs.map(log => {
        const populatedUser = log.userId as any;
        const populatedFile = log.fileId as any;
        
        // Calculate failed attempts from riskFactors
        const failedAttempts = (log as any).riskFactors?.failedLoginAttempts || 
                              (log as any).riskAssessment?.breakdown?.failedAttempts || 0;
        
        return {
          id: log._id,
          userId: populatedUser ? { email: populatedUser.email } : null,
          user: populatedUser ? populatedUser.email : 'Unknown',
          file: populatedFile ? populatedFile.originalName : null,
          fileId: populatedFile ? { originalName: populatedFile.originalName } : null,
          action: log.action,
          riskScore: log.riskScore,
          timestamp: log.timestamp,
          allowed: log.allowed,
          userEmail: populatedUser ? populatedUser.email : log.userEmail,
          // Session metrics for admin panel display
          sessionTime: (log as any).sessionDuration || 0,
          deleteKeyCount: (log as any).deleteKeyCount || 0,
          failedAttempts: failedAttempts,
          // Risk information
          riskBreakdown: (log as any).riskAssessment?.breakdown,
          riskFactors: (log as any).riskFactors
        };
      }),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({ error: 'Failed to get audit logs' });
  }
});

// Get system statistics
router.get('/stats', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      totalFiles,
      blockedUsers,
      zkpVerifiedUsers,
      recentLogins,
      recentUploads,
      highRiskAttempts,
      opaDenials,
      zkpVerifications,
      totalStorage
    ] = await Promise.all([
      User.countDocuments(),
      File.countDocuments(),
      User.countDocuments({ isBlocked: true }),
      User.countDocuments({ 'zkProofData.verified': true }),
      AccessLog.countDocuments({
        action: 'login',
        allowed: true,
        timestamp: { $gte: thirtyDaysAgo }
      }),
      AccessLog.countDocuments({
        action: 'upload',
        allowed: true,
        timestamp: { $gte: sevenDaysAgo }
      }),
      AccessLog.countDocuments({
        riskScore: { $gte: 70 },
        timestamp: { $gte: sevenDaysAgo }
      }),
      AccessLog.countDocuments({
        opaDecision: 'deny',
        timestamp: { $gte: sevenDaysAgo }
      }),
      AccessLog.countDocuments({
        action: 'verifyZKP',
        allowed: true,
        timestamp: { $gte: sevenDaysAgo }
      }),
      File.aggregate([
        { $group: { _id: null, totalSize: { $sum: '$size' } } }
      ])
    ]);

    res.json({
      users: {
        total: totalUsers,
        blocked: blockedUsers,
        active: totalUsers - blockedUsers,
        zkpVerified: zkpVerifiedUsers
      },
      files: {
        total: totalFiles,
        totalSizeBytes: totalStorage[0]?.totalSize || 0
      },
      activity: {
        recentLogins: recentLogins,
        recentUploads: recentUploads,
        highRiskAttempts: highRiskAttempts
      },
      security: {
        opaDenials: opaDenials,
        zkpVerifications: zkpVerifications,
        zkpVerificationRate: totalUsers > 0 ? (zkpVerifiedUsers / totalUsers * 100).toFixed(1) : '0'
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to get statistics' });
  }
});

// Get admin notifications
router.get('/notifications', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const notifications = await AdminNotification.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await AdminNotification.countDocuments();
    const unreadCount = await AdminNotification.countDocuments({ isRead: false });

    res.json({
      notifications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      unreadCount
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Failed to get notifications' });
  }
});

// Mark notification as read
router.patch('/notifications/:id/read', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const notification = await AdminNotification.findByIdAndUpdate(
      req.params.id,
      { isRead: true, readAt: new Date() },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json({ message: 'Notification marked as read', notification });
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

// Get failed login attempts for a user
router.get('/users/:userId/failed-attempts', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const failedAttempts = await rateLimiterService.getRecentFailedAttempts(user.email, 50);
    const currentCount = await rateLimiterService.getFailedAttemptsCount(user.email);
    const rateLimitStatus = await rateLimiterService.isAccountRateLimited(user.email);

    res.json({
      user: {
        id: user._id,
        email: user.email,
        isBlocked: user.isBlocked
      },
      failedAttempts,
      currentCount,
      rateLimitStatus
    });
  } catch (error) {
    console.error('Get failed attempts error:', error);
    res.status(500).json({ error: 'Failed to get failed attempts' });
  }
});

// Unblock user account
router.post('/users/:userId/unblock', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Unblock the user
    user.isBlocked = false;
    user.lockReason = undefined;
    user.rejectionReasons = user.rejectionReasons || [];
    user.rejectionReasons.push(`Account unblocked by admin: ${reason || 'No reason provided'}`);
    
    // Delete ALL failed password attempts for this user (resets counter to 0)
    const { RiskEvent } = await import('../models/RiskEvent');
    const deletedCount = await RiskEvent.deleteMany({
      userId: user._id,
      action: 'failed-password'
    });
    
    console.log(`✅ RESET: Cleared ${deletedCount.deletedCount} failed attempts for user ${user.email} - Counter now at 0`);
    
    await user.save();

    // Clear failed attempts from rate limiter as well
    await rateLimiterService.clearFailedAttempts(user.email);

    // Log the unblock action
    await new AccessLog({
      userId: user._id,
      action: 'account_unblocked',
      riskScore: 0,
      allowed: true,
      reason: `Account unblocked by admin: ${reason || 'No reason provided'}. Failed attempts reset to 0.`,
      timestamp: new Date(),
      userEmail: user.email
    }).save();

    // Create notification for the unblock action
    await new AdminNotification({
      type: 'system_alert',
      title: `Account Unblocked: ${user.email}`,
      message: `Account has been unblocked by admin. Failed attempts reset to 0. Reason: ${reason || 'No reason provided'}`,
      severity: 'medium',
      userId: user._id,
      userEmail: user.email,
      metadata: {
        blockReason: reason || 'Admin unblock',
        failedAttemptsCleared: deletedCount.deletedCount
      },
      isRead: false,
      createdAt: new Date()
    }).save();

    res.json({
      message: 'User account unblocked successfully. Failed attempts reset to 0.',
      user: {
        id: user._id,
        email: user.email,
        isBlocked: user.isBlocked,
        failedAttemptsCleared: deletedCount.deletedCount
      }
    });
  } catch (error) {
    console.error('Unblock user error:', error);
    res.status(500).json({ error: 'Failed to unblock user' });
  }
});

// Get rate limiting statistics
router.get('/rate-limit-stats', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Get blocked accounts count
    const blockedAccountsCount = await User.countDocuments({ isBlocked: true });

    // Get failed attempts in last 24 hours
    const failedAttemptsLast24h = await FailedLoginAttempt.countDocuments({
      timestamp: { $gte: last24Hours }
    });

    // Get failed attempts in last 7 days
    const failedAttemptsLast7d = await FailedLoginAttempt.countDocuments({
      timestamp: { $gte: last7Days }
    });

    // Get top failing IPs
    const topFailingIPs = await FailedLoginAttempt.aggregate([
      { $match: { timestamp: { $gte: last24Hours } } },
      { $group: { _id: '$ipAddress', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Get recent notifications
    const recentNotifications = await AdminNotification.find({ type: 'account_blocked' })
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      blockedAccountsCount,
      failedAttemptsLast24h,
      failedAttemptsLast7d,
      topFailingIPs,
      recentNotifications,
      rateLimitConfig: {
        maxAttempts: 5,
        windowMinutes: 60,
        lockoutHours: 24
      }
    });
  } catch (error) {
    console.error('Get rate limit stats error:', error);
    res.status(500).json({ error: 'Failed to get rate limit statistics' });
  }
});

// Get flagged authentication attempts
router.get('/flagged-attempts', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { filter = 'all', timeRange = '24h' } = req.query;
    
    // Calculate time range
    let timeFilter = new Date();
    switch (timeRange) {
      case '1h':
        timeFilter.setHours(timeFilter.getHours() - 1);
        break;
      case '24h':
        timeFilter.setHours(timeFilter.getHours() - 24);
        break;
      case '7d':
        timeFilter.setDate(timeFilter.getDate() - 7);
        break;
      case '30d':
        timeFilter.setDate(timeFilter.getDate() - 30);
        break;
    }

    // Build query
    let query: any = {
      timestamp: { $gte: timeFilter }
    };

    // Apply filters
    if (filter === 'blocked') {
      query.allowed = false;
    } else if (filter === 'high_risk') {
      query.riskScore = { $gte: 70 };
    }

    // Get flagged attempts
    const attempts = await AccessLog.find(query)
      .populate('userId', 'email')
      .sort({ timestamp: -1 })
      .limit(100);

    // Format response
    const formattedAttempts = attempts.map(attempt => {
      const riskLevel = attempt.riskScore >= 90 ? 'critical' :
                       attempt.riskScore >= 70 ? 'high' :
                       attempt.riskScore >= 30 ? 'medium' : 'low';

      const populatedUser = attempt.userId as any;

      return {
        id: attempt._id,
        userId: populatedUser ? populatedUser._id : null,
        userEmail: populatedUser ? populatedUser.email : 'Unknown',
        action: attempt.action,
        riskScore: attempt.riskScore,
        riskLevel,
        allowed: attempt.allowed,
        reason: attempt.reason || 'No reason provided',
        location: attempt.location,
        timestamp: attempt.timestamp,
        policyViolations: [] // Would be populated from policy results if stored
      };
    });

    res.json({
      attempts: formattedAttempts,
      total: formattedAttempts.length,
      timeRange,
      filter
    });

  } catch (error) {
    console.error('Failed to fetch flagged attempts:', error);
    res.status(500).json({ error: 'Failed to fetch flagged attempts' });
  }
});

export default router;