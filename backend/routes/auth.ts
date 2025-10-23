import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { User } from '../models/User';
import { AccessLog } from '../models/AccessLog';
import { assessRisk, type RiskRequest } from '../middleware/riskAssessment';
import { authenticateToken, type AuthRequest } from '../middleware/auth';

const router = express.Router();

// Validation schemas
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

// Register
router.post('/register', assessRisk, async (req: RiskRequest, res) => {
  try {
    const { email, password } = registerSchema.parse(req.body);

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const user = new User({
      email,
      passwordHash,
      isAdmin: email === process.env.ADMIN_EMAIL // First admin user
    });

    await user.save();

    // Log the registration
    await new AccessLog({
      userId: user._id,
      action: 'register',
      riskScore: req.riskScore || 0,
      ipAddress: req.riskData?.ipAddress || 'unknown',
      userAgent: req.riskData?.userAgent,
      deviceFingerprint: req.riskData?.deviceFingerprint,
      location: req.riskData?.location,
      allowed: true
    }).save();

    // Generate token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        email: user.email,
        isAdmin: user.isAdmin
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error });
    }
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
router.post('/login', assessRisk, async (req: RiskRequest, res) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      await new AccessLog({
        userId: new Date().getTime().toString(), // Dummy ID for failed login
        action: 'login',
        riskScore: req.riskScore || 0,
        ipAddress: req.riskData?.ipAddress || 'unknown',
        userAgent: req.riskData?.userAgent,
        allowed: false,
        reason: 'User not found'
      }).save();

      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if user is blocked
    if (user.isBlocked) {
      await new AccessLog({
        userId: user._id,
        action: 'login',
        riskScore: req.riskScore || 0,
        ipAddress: req.riskData?.ipAddress || 'unknown',
        userAgent: req.riskData?.userAgent,
        allowed: false,
        reason: 'User blocked'
      }).save();

      return res.status(403).json({ error: 'Account blocked' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      await new AccessLog({
        userId: user._id,
        action: 'login',
        riskScore: req.riskScore || 0,
        ipAddress: req.riskData?.ipAddress || 'unknown',
        userAgent: req.riskData?.userAgent,
        allowed: false,
        reason: 'Invalid password'
      }).save();

      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check risk score
    const riskScore = req.riskScore || 0;
    if (riskScore > 80) {
      await new AccessLog({
        userId: user._id,
        action: 'login',
        riskScore,
        ipAddress: req.riskData?.ipAddress || 'unknown',
        userAgent: req.riskData?.userAgent,
        allowed: false,
        reason: 'High risk score'
      }).save();

      return res.status(403).json({
        error: 'Login denied due to high risk score',
        riskScore
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Log successful login
    await new AccessLog({
      userId: user._id,
      action: 'login',
      riskScore,
      ipAddress: req.riskData?.ipAddress || 'unknown',
      userAgent: req.riskData?.userAgent,
      deviceFingerprint: req.riskData?.deviceFingerprint,
      location: req.riskData?.location,
      allowed: true
    }).save();

    // Generate token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        isAdmin: user.isAdmin
      },
      riskScore
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error });
    }
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get current user
router.get('/me', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const user = await User.findById(req.user?.id).select('-passwordHash');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user: {
        id: user._id,
        email: user.email,
        isAdmin: user.isAdmin,
        isBlocked: user.isBlocked,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// Logout (client-side token removal, but we can log it)
router.post('/logout', authenticateToken, async (req: AuthRequest, res) => {
  // In a real app, you might want to blacklist the token
  res.json({ message: 'Logged out successfully' });
});

export default router;