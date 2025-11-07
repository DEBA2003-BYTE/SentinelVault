import express from 'express';
import { z } from 'zod';
import { authenticateToken, type AuthRequest } from '../middleware/auth';
import { assessRisk, type RiskRequest } from '../middleware/riskAssessment';
import { User } from '../models/User';
import { AccessLog } from '../models/AccessLog';
import { zkpService } from '../utils/zkp';

const router = express.Router();

// Validation schemas
const generateProofSchema = z.object({
  secret: z.string().min(1),
  publicValue: z.string().min(1)
});

const verifyProofSchema = z.object({
  proof: z.string().min(1),
  publicSignals: z.array(z.string())
});

// Generate ZKP proof
router.post('/generate', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { secret, publicValue } = generateProofSchema.parse(req.body);
    const user = req.user!;

    // Generate proof using ZKP service
    const proof = await zkpService.generateProof({ secret, publicValue });

    res.json({
      message: 'Proof generated successfully',
      proof: proof.proof,
      publicSignals: proof.publicSignals,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues });
    }
    console.error('ZKP generation error:', error);
    res.status(500).json({ error: 'Proof generation failed' });
  }
});

// Verify ZKP proof
router.post('/verify', authenticateToken, assessRisk, async (req: RiskRequest, res) => {
  try {
    const { proof, publicSignals } = verifyProofSchema.parse(req.body);
    const user = req.user!;
    const riskScore = req.riskScore || 0;

    // Verify proof using ZKP service
    const isValid = await zkpService.verifyProof({ proof, publicSignals });

    if (isValid) {
      // Update user's ZKP verification status
      await User.findByIdAndUpdate(user.id, {
        zkProofData: {
          proof,
          publicSignals,
          verified: true,
          verifiedAt: new Date()
        }
      });

      // Log successful verification
      await new AccessLog({
        userId: user.id,
        action: 'verifyZKP',
        riskScore,
        ipAddress: req.riskData?.ipAddress || 'unknown',
        userAgent: req.riskData?.userAgent,
        deviceFingerprint: req.riskData?.deviceFingerprint,
        location: req.riskData?.location,
        allowed: true,
        zkpVerified: true
      }).save();

      res.json({
        message: 'ZKP verified successfully',
        verified: true,
        timestamp: new Date().toISOString(),
        riskScore
      });
    } else {
      // Log failed verification
      await new AccessLog({
        userId: user.id,
        action: 'verifyZKP',
        riskScore,
        ipAddress: req.riskData?.ipAddress || 'unknown',
        userAgent: req.riskData?.userAgent,
        deviceFingerprint: req.riskData?.deviceFingerprint,
        location: req.riskData?.location,
        allowed: false,
        reason: 'Invalid ZKP proof',
        zkpVerified: false
      }).save();

      res.status(400).json({
        message: 'ZKP verification failed',
        verified: false,
        reason: 'Invalid proof provided'
      });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues });
    }
    console.error('ZKP verification error:', error);
    res.status(500).json({ error: 'Proof verification failed' });
  }
});

// Get ZKP status
router.get('/status', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const user = req.user!;
    
    // Get user with ZKP data
    const userData = await User.findById(user.id).select('zkProofData');
    
    if (!userData || !userData.zkProofData) {
      return res.json({
        verified: false,
        hasProof: false,
        message: 'No ZKP proof found'
      });
    }

    res.json({
      verified: userData.zkProofData.verified || false,
      hasProof: true,
      verifiedAt: userData.zkProofData.verifiedAt,
      publicSignals: userData.zkProofData.publicSignals
    });
  } catch (error) {
    console.error('Get ZKP status error:', error);
    res.status(500).json({ error: 'Failed to get ZKP status' });
  }
});

// Generate identity proof (simplified)
router.post('/identity', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const user = req.user!;

    // Generate identity proof
    const proof = await zkpService.generateIdentityProof(user.id, user.email);

    res.json({
      message: 'Identity proof generated successfully',
      proof: proof.proof,
      publicSignals: proof.publicSignals,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Identity proof generation error:', error);
    res.status(500).json({ error: 'Identity proof generation failed' });
  }
});

// Verify identity proof
router.post('/identity/verify', authenticateToken, assessRisk, async (req: RiskRequest, res) => {
  try {
    const { proof, publicSignals } = verifyProofSchema.parse(req.body);
    const user = req.user!;
    const riskScore = req.riskScore || 0;

    // Verify identity proof
    const isValid = await zkpService.verifyIdentityProof({ proof, publicSignals }, user.email);

    if (isValid) {
      // Update user's identity verification
      await User.findByIdAndUpdate(user.id, {
        zkProofData: {
          proof,
          publicSignals,
          verified: true,
          verifiedAt: new Date()
        }
      });

      // Log successful identity verification
      await new AccessLog({
        userId: user.id,
        action: 'verifyZKP',
        riskScore,
        ipAddress: req.riskData?.ipAddress || 'unknown',
        userAgent: req.riskData?.userAgent,
        deviceFingerprint: req.riskData?.deviceFingerprint,
        location: req.riskData?.location,
        allowed: true,
        zkpVerified: true,
        reason: 'Identity proof verified'
      }).save();

      res.json({
        message: 'Identity verified successfully',
        verified: true,
        timestamp: new Date().toISOString()
      });
    } else {
      // Log failed identity verification
      await new AccessLog({
        userId: user.id,
        action: 'verifyZKP',
        riskScore,
        ipAddress: req.riskData?.ipAddress || 'unknown',
        userAgent: req.riskData?.userAgent,
        deviceFingerprint: req.riskData?.deviceFingerprint,
        location: req.riskData?.location,
        allowed: false,
        reason: 'Invalid identity proof',
        zkpVerified: false
      }).save();

      res.status(400).json({
        message: 'Identity verification failed',
        verified: false,
        reason: 'Invalid identity proof'
      });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues });
    }
    console.error('Identity verification error:', error);
    res.status(500).json({ error: 'Identity verification failed' });
  }
});

export default router;