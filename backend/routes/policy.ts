import express from 'express';
import { z } from 'zod';
import { authenticateToken, type AuthRequest } from '../middleware/auth';
import { assessRisk, type RiskRequest } from '../middleware/riskAssessment';
import { Policy } from '../models/Policy';
import { AccessLog } from '../models/AccessLog';
import { opaService } from '../utils/opa';

const router = express.Router();

// Validation schemas
const evaluateSchema = z.object({
  action: z.string(),
  resource: z.string().optional(),
  context: z.object({
    deviceFingerprint: z.string().optional(),
    location: z.string().optional(),
    userAgent: z.string().optional()
  }).optional()
});

const policySchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  policyCode: z.string().min(1)
});

// Evaluate policy
router.post('/evaluate', authenticateToken, assessRisk, async (req: RiskRequest, res) => {
  try {
    const { action, resource, context } = evaluateSchema.parse(req.body);
    const user = req.user!;
    const riskScore = req.riskScore || 0;

    // Prepare OPA input
    const opaInput = {
      user: {
        id: user.id,
        email: user.email,
        verified: true, // Assuming authenticated users are verified
        isAdmin: user.isAdmin || false,
        zkpVerified: user.zkpVerified || false
      },
      action,
      resource,
      riskScore,
      deviceFingerprint: context?.deviceFingerprint || req.riskData?.deviceFingerprint,
      registeredFingerprint: user.deviceFingerprint,
      location: context?.location || req.riskData?.location,
      registeredLocation: user.registeredLocation,
      ipAddress: req.riskData?.ipAddress || 'unknown',
      timestamp: new Date().toISOString()
    };

    // Evaluate with OPA
    const decision = await opaService.evaluatePolicy(opaInput);

    // Log the policy evaluation
    await new AccessLog({
      userId: user.id,
      action: 'policy_evaluation',
      riskScore,
      location: req.riskData?.location,
      allowed: decision.allow,
      reason: decision.reason,
      opaDecision: decision.allow ? 'allow' : 'deny',
      userEmail: user.email
    }).save();

    res.json({
      decision: decision.allow ? 'allow' : 'deny',
      allow: decision.allow,
      reason: decision.reason,
      riskScore,
      factors: decision.factors,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues });
    }
    console.error('Policy evaluation error:', error);
    res.status(500).json({ error: 'Policy evaluation failed' });
  }
});

// Get policy rules (admin only)
router.get('/rules', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const user = req.user!;
    
    if (!user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const policies = await Policy.find({ active: true }).sort({ createdAt: -1 });
    
    res.json({
      policies: policies.map(policy => ({
        id: policy._id,
        name: policy.name,
        description: policy.description,
        policyCode: policy.policyCode,
        createdAt: policy.createdAt,
        updatedAt: policy.updatedAt
      }))
    });
  } catch (error) {
    console.error('Get policy rules error:', error);
    res.status(500).json({ error: 'Failed to get policy rules' });
  }
});

// Create policy rule (admin only)
router.post('/rules', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const user = req.user!;
    
    if (!user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { name, description, policyCode } = policySchema.parse(req.body);

    const policy = new Policy({
      name,
      description,
      policyCode
    });

    await policy.save();

    res.status(201).json({
      message: 'Policy created successfully',
      policy: {
        id: policy._id,
        name: policy.name,
        description: policy.description,
        policyCode: policy.policyCode,
        createdAt: policy.createdAt
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues });
    }
    console.error('Create policy error:', error);
    res.status(500).json({ error: 'Failed to create policy' });
  }
});

// Update policy rule (admin only)
router.put('/rules/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const user = req.user!;
    
    if (!user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const policyId = req.params.id;
    const { name, description, policyCode } = policySchema.parse(req.body);

    const policy = await Policy.findByIdAndUpdate(
      policyId,
      { name, description, policyCode, updatedAt: new Date() },
      { new: true }
    );

    if (!policy) {
      return res.status(404).json({ error: 'Policy not found' });
    }

    res.json({
      message: 'Policy updated successfully',
      policy: {
        id: policy._id,
        name: policy.name,
        description: policy.description,
        policyCode: policy.policyCode,
        updatedAt: policy.updatedAt
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues });
    }
    console.error('Update policy error:', error);
    res.status(500).json({ error: 'Failed to update policy' });
  }
});

// Delete policy rule (admin only)
router.delete('/rules/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const user = req.user!;
    
    if (!user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const policyId = req.params.id;
    const policy = await Policy.findByIdAndDelete(policyId);

    if (!policy) {
      return res.status(404).json({ error: 'Policy not found' });
    }

    res.json({ message: 'Policy deleted successfully' });
  } catch (error) {
    console.error('Delete policy error:', error);
    res.status(500).json({ error: 'Failed to delete policy' });
  }
});

export default router;