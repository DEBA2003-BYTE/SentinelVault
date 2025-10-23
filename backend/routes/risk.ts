import express from 'express';
import { authenticateToken,type  AuthRequest } from '../middleware/auth';
import { assessRisk,type  RiskRequest } from '../middleware/riskAssessment';
import { AccessLog } from '../models/AccessLog';

const router = express.Router();

// Evaluate current risk score
router.post('/evaluate', authenticateToken, assessRisk, async (req: RiskRequest, res) => {
  try {
    const userId = req.user!.id;
    const riskScore = req.riskScore || 0;

    // Get recent access history for context
    const recentLogs = await AccessLog.find({
      userId,
      timestamp: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
    })
    .sort({ timestamp: -1 })
    .limit(10);

    res.json({
      riskScore,
      riskLevel: getRiskLevel(riskScore),
      factors: {
        ipAddress: req.riskData?.ipAddress,
        location: req.riskData?.location,
        deviceFingerprint: req.riskData?.deviceFingerprint,
        recentFailures: recentLogs.filter(log => !log.allowed).length
      },
      recentActivity: recentLogs.map(log => ({
        action: log.action,
        timestamp: log.timestamp,
        allowed: log.allowed,
        riskScore: log.riskScore
      }))
    });
  } catch (error) {
    console.error('Risk evaluation error:', error);
    res.status(500).json({ error: 'Risk evaluation failed' });
  }
});

// Get risk policies (simplified)
router.get('/policies', authenticateToken, (req: AuthRequest, res) => {
  const policies = {
    login: {
      maxRiskScore: 80,
      description: 'Maximum risk score allowed for login'
    },
    upload: {
      maxRiskScore: 60,
      description: 'Maximum risk score allowed for file uploads'
    },
    download: {
      maxRiskScore: 80,
      description: 'Maximum risk score allowed for file downloads'
    },
    delete: {
      maxRiskScore: 70,
      description: 'Maximum risk score allowed for file deletion'
    }
  };

  res.json({ policies });
});

// Helper function to determine risk level
function getRiskLevel(score: number): string {
  if (score <= 30) return 'low';
  if (score <= 60) return 'medium';
  if (score <= 80) return 'high';
  return 'critical';
}

export default router;