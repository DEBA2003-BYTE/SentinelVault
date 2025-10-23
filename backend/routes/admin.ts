import express from 'express';
import { authenticateToken, requireAdmin,type AuthRequest } from '../middleware/auth';
import { User } from '../models/User';
import { File } from '../models/File';
import { AccessLog } from '../models/AccessLog';

const router = express.Router();

// Get all users
router.get('/users', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
  try {
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
          recentLogins
        };
      })
    );

    res.json({
      users: usersWithStats,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
});

// Block/unblock user
router.post('/users/:id/block', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const userId = req.params.id;
    const { blocked } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent blocking admin users
    if (user.isAdmin && blocked) {
      return res.status(400).json({ error: 'Cannot block admin users' });
    }

    user.isBlocked = blocked;
    await user.save();

    res.json({
      message: `User ${blocked ? 'blocked' : 'unblocked'} successfully`,
      user: {
        id: user._id,
        email: user.email,
        isBlocked: user.isBlocked
      }
    });
  } catch (error) {
    console.error('Block user error:', error);
    res.status(500).json({ error: 'Failed to update user status' });
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
      logs: logs.map(log => ({
        id: log._id,
        user: log.userId ? (log.userId as any).email : 'Unknown',
        file: log.fileId ? (log.fileId as any).originalName : null,
        action: log.action,
        riskScore: log.riskScore,
        ipAddress: log.ipAddress,
        location: log.location,
        timestamp: log.timestamp,
        allowed: log.allowed,
        reason: log.reason
      })),
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
      recentLogins,
      recentUploads,
      highRiskAttempts,
      totalStorage
    ] = await Promise.all([
      User.countDocuments(),
      File.countDocuments(),
      User.countDocuments({ isBlocked: true }),
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
      File.aggregate([
        { $group: { _id: null, totalSize: { $sum: '$size' } } }
      ])
    ]);

    res.json({
      users: {
        total: totalUsers,
        blocked: blockedUsers,
        active: totalUsers - blockedUsers
      },
      files: {
        total: totalFiles,
        totalSizeBytes: totalStorage[0]?.totalSize || 0
      },
      activity: {
        recentLogins: recentLogins,
        recentUploads: recentUploads,
        highRiskAttempts: highRiskAttempts
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to get statistics' });
  }
});

export default router;