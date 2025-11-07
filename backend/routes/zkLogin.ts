import express from 'express';
import { z } from 'zod';
import { authenticateToken, type AuthRequest } from '../middleware/auth';
import ZKLoginService, { type IdentityCredential } from '../utils/zkLogin';
import { User } from '../models/User';
import { ZKIdentity } from '../models/ZKIdentity';
import { AccessLog } from '../models/AccessLog';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Validation schemas
const zkLoginSchema = z.object({
  proof: z.string(),
  publicSignals: z.array(z.string()),
  credentialType: z.string(),
  issuer: z.string(),
  nullifierHash: z.string(),
  challenge: z.string()
});

const registerIdentitySchema = z.object({
  credentialType: z.enum(['verified_human', 'age_verified', 'government_id', 'email_verified', 'phone_verified']),
  issuer: z.string(),
  commitment: z.string(),
  expiresAt: z.string().optional(),
  metadata: z.any().optional()
});

// Get available identity providers
router.get('/providers', (req, res) => {
  try {
    const providers = ZKLoginService.getAvailableProviders();
    res.json({ providers });
  } catch (error) {
    console.error('Get providers error:', error);
    res.status(500).json({ error: 'Failed to get providers' });
  }
});

// Generate login challenge
router.post('/challenge', (req, res) => {
  try {
    const challenge = ZKLoginService.generateLoginChallenge();
    
    // Store challenge temporarily (in production, use Redis or similar)
    // For demo, we'll return it directly
    res.json({ 
      challenge,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000) // 5 minutes
    });
  } catch (error) {
    console.error('Generate challenge error:', error);
    res.status(500).json({ error: 'Failed to generate challenge' });
  }
});

// ZK-Login authentication
router.post('/authenticate', async (req, res) => {
  try {
    const zkProof = zkLoginSchema.parse(req.body);

    // Verify the ZK proof
    const verification = await ZKLoginService.verifyIdentityProof(
      zkProof,
      zkProof.challenge
    );

    if (!verification.valid) {
      await new AccessLog({
        userId: null,
        action: 'zk_login',
        riskScore: 80,
        ipAddress: req.ip || 'unknown',
        userAgent: req.headers['user-agent'],
        allowed: false,
        reason: `ZK-Login failed: ${verification.reason}`
      }).save();

      return res.status(401).json({
        error: 'Authentication failed',
        reason: verification.reason
      });
    }

    // Find user by identity commitment
    const zkIdentity = await ZKIdentity.findOne({
      credentialType: zkProof.credentialType,
      issuer: zkProof.issuer
    }).populate('userId');

    if (!zkIdentity) {
      return res.status(404).json({
        error: 'Identity not registered',
        message: 'Please register your ZK identity first'
      });
    }

    const user = zkIdentity.userId as any;

    // Update verification count
    zkIdentity.verificationCount += 1;
    zkIdentity.lastVerified = new Date();
    await zkIdentity.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '24h' }
    );

    // Log successful ZK-Login
    await new AccessLog({
      userId: user._id,
      action: 'zk_login',
      riskScore: 10, // ZK-Login is very secure
      ipAddress: req.ip || 'unknown',
      userAgent: req.headers['user-agent'],
      allowed: true,
      reason: `ZK-Login with ${zkProof.credentialType} from ${zkProof.issuer}`
    }).save();

    res.json({
      message: 'ZK-Login successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        isAdmin: user.isAdmin,
        zkpVerified: true
      },
      credentialInfo: verification.credentialInfo,
      authMethod: 'zk_login'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: error.issues 
      });
    }
    console.error('ZK-Login error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// Register ZK identity
router.post('/register-identity', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const identityData = registerIdentitySchema.parse(req.body);
    const userId = req.user!.id;

    const credential: IdentityCredential = {
      type: identityData.credentialType,
      issuer: identityData.issuer,
      commitment: identityData.commitment,
      metadata: identityData.metadata
    };

    const expiresAt = identityData.expiresAt ? new Date(identityData.expiresAt) : undefined;

    const result = await ZKLoginService.registerZKIdentity(
      userId,
      credential,
      expiresAt
    );

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.status(201).json({
      message: 'ZK identity registered successfully',
      identityId: result.identityId,
      credentialType: credential.type,
      issuer: credential.issuer
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: error.issues 
      });
    }
    console.error('Register identity error:', error);
    res.status(500).json({ error: 'Failed to register identity' });
  }
});

// Get user's ZK identities
router.get('/identities', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;

    const identities = await ZKIdentity.find({ userId }).select('-identityCommitment');

    res.json({
      identities: identities.map(identity => ({
        id: identity._id,
        credentialType: identity.credentialType,
        issuer: identity.issuer,
        issuedAt: identity.issuedAt,
        expiresAt: identity.expiresAt,
        revoked: identity.revoked,
        verificationCount: identity.verificationCount,
        lastVerified: identity.lastVerified,
        metadata: identity.metadata
      }))
    });
  } catch (error) {
    console.error('Get identities error:', error);
    res.status(500).json({ error: 'Failed to get identities' });
  }
});

// Revoke ZK identity
router.post('/revoke-identity/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const identityId = req.params.id;
    const userId = req.user!.id;

    const identity = await ZKIdentity.findOne({ _id: identityId, userId });
    if (!identity) {
      return res.status(404).json({ error: 'Identity not found' });
    }

    identity.revoked = true;
    await identity.save();

    res.json({
      message: 'Identity revoked successfully',
      identityId: identity._id
    });
  } catch (error) {
    console.error('Revoke identity error:', error);
    res.status(500).json({ error: 'Failed to revoke identity' });
  }
});

export default router;