import express from 'express';
import { z } from 'zod';
import { authenticateToken, type AuthRequest } from '../middleware/auth';
import { User } from '../models/User';

const router = express.Router();

// Validation schemas
const registerSecretSchema = z.object({
  secretType: z.enum(['fingerprint_hash', 'face_recognition_hash']),
  secretValue: z.string().min(1),
  metadata: z.object({
    strength: z.enum(['weak', 'medium', 'strong'])
  }).optional()
});

// Get available factor types
router.get('/factor-types', (req, res) => {
  const factorTypes = [
    {
      type: 'fingerprint_hash',
      name: 'Fingerprint Authentication',
      description: 'Secure biometric authentication using your fingerprint',
      security: 'high',
      setup: 'easy'
    },
    {
      type: 'face_recognition_hash',
      name: 'Face Recognition',
      description: 'Advanced facial recognition for secure access',
      security: 'high',
      setup: 'easy'
    }
  ];

  res.json({ factorTypes });
});

// Get user's registered MFA factors
router.get('/factors', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const user = req.user!;
    
    const userData = await User.findById(user.id).select('mfaFactors');
    
    const factors = userData?.mfaFactors || [];
    
    res.json({ factors });
  } catch (error) {
    console.error('Get MFA factors error:', error);
    res.status(500).json({ error: 'Failed to get MFA factors' });
  }
});

// Register a new MFA secret/factor
router.post('/register-secret', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { secretType, secretValue, metadata } = registerSecretSchema.parse(req.body);
    const user = req.user!;

    // Check if user already has this type of factor
    const userData = await User.findById(user.id);
    if (!userData) {
      return res.status(404).json({ error: 'User not found' });
    }

    const existingFactors = userData.mfaFactors || [];
    const hasExistingType = existingFactors.some(factor => factor.type === secretType);
    
    if (hasExistingType) {
      return res.status(400).json({ 
        error: 'Factor type already registered',
        details: 'You already have this type of MFA factor registered'
      });
    }

    // Create new MFA factor
    const newFactor = {
      type: secretType,
      secretHash: secretValue, // In production, this should be properly hashed
      isActive: true,
      createdAt: new Date(),
      metadata: metadata || { strength: 'strong' }
    };

    // Add to user's MFA factors
    const updatedFactors = [...existingFactors, newFactor];
    
    await User.findByIdAndUpdate(user.id, {
      mfaFactors: updatedFactors
    });

    res.json({
      message: 'MFA factor registered successfully',
      factor: {
        type: newFactor.type,
        isActive: newFactor.isActive,
        createdAt: newFactor.createdAt,
        metadata: newFactor.metadata
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Invalid input',
        details: error.issues.map(issue => issue.message).join(', ')
      });
    }
    console.error('Register MFA secret error:', error);
    res.status(500).json({ error: 'Failed to register MFA factor' });
  }
});

// Verify MFA factor (for authentication)
router.post('/verify', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { factorType, secretValue } = req.body;
    const user = req.user!;

    const userData = await User.findById(user.id);
    if (!userData) {
      return res.status(404).json({ error: 'User not found' });
    }

    const factors = userData.mfaFactors || [];
    const factor = factors.find(f => f.type === factorType && f.isActive);
    
    if (!factor) {
      return res.status(400).json({ error: 'MFA factor not found or inactive' });
    }

    // In production, you would properly verify the hash
    const isValid = factor.secretHash === secretValue;
    
    if (isValid) {
      // Update last used timestamp
      factor.lastUsed = new Date();
      await User.findByIdAndUpdate(user.id, { mfaFactors: factors });
      
      res.json({
        message: 'MFA verification successful',
        verified: true,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(400).json({
        message: 'MFA verification failed',
        verified: false,
        error: 'Invalid biometric data'
      });
    }
  } catch (error) {
    console.error('MFA verification error:', error);
    res.status(500).json({ error: 'MFA verification failed' });
  }
});

// Remove MFA factor
router.delete('/factors/:factorType', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { factorType } = req.params;
    const user = req.user!;

    const userData = await User.findById(user.id);
    if (!userData) {
      return res.status(404).json({ error: 'User not found' });
    }

    const factors = userData.mfaFactors || [];
    const updatedFactors = factors.filter(f => f.type !== factorType);
    
    if (factors.length === updatedFactors.length) {
      return res.status(404).json({ error: 'MFA factor not found' });
    }

    await User.findByIdAndUpdate(user.id, { mfaFactors: updatedFactors });

    res.json({
      message: 'MFA factor removed successfully',
      removedType: factorType
    });
  } catch (error) {
    console.error('Remove MFA factor error:', error);
    res.status(500).json({ error: 'Failed to remove MFA factor' });
  }
});

export default router;