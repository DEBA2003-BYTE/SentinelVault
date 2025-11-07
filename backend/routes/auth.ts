import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { z } from 'zod';
import { User } from '../models/User';
import { AccessLog } from '../models/AccessLog';
import { assessRisk, type RiskRequest } from '../middleware/riskAssessment';
import { authenticateToken, type AuthRequest } from '../middleware/auth';
import { enforceOPAPolicy, type OPARequest } from '../middleware/opaPolicy';
import { deviceAuthentication, logDeviceAccess, type DeviceAuthRequest } from '../middleware/deviceAuth';
import { checkDatabaseConnection, gracefulDatabaseError } from '../middleware/dbCheck';
import { zkpService } from '../utils/zkp';
import { opaService } from '../utils/opa';
import { riskAssessmentService } from '../utils/riskAssessment';
import { rateLimiterService } from '../utils/rateLimiter';
import DeviceAuthService from '../utils/deviceAuth';
import geoip from 'geoip-lite';


const router = express.Router();

// Validation schemas
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  deviceFingerprint: z.string().optional(),
  location: z.string().optional(),
  clientInfo: z.any().optional(), // Enhanced device info
  zkpProof: z.object({
    proof: z.string(),
    publicSignals: z.array(z.string())
  }).optional()
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
  deviceFingerprint: z.string().optional(),
  location: z.string().optional(),
  clientInfo: z.any().optional(), // Enhanced device info
  typingSpeed: z.number().optional(), // Typing speed in WPM
  keystrokes: z.array(z.object({
    timestamp: z.number(),
    key: z.string()
  })).optional(), // Keystroke dynamics
  zkpProof: z.object({
    proof: z.string(),
    publicSignals: z.array(z.string())
  }).optional()
});



// Register - No device authentication required for registration
router.post('/register', checkDatabaseConnection, assessRisk, async (req: RiskRequest, res) => {
  try {
    console.log('Registration request body:', req.body);
    const { email, password, deviceFingerprint, location, zkpProof } = registerSchema.parse(req.body);
    console.log('Parsed registration data:', { email, deviceFingerprint, location });

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Check if trying to register as admin with correct password
    if (email === process.env.ADMIN_EMAIL) {
      const adminPassword = process.env.ADMIN_PASSWORD;
      if (!adminPassword || password !== adminPassword) {
        return res.status(400).json({ 
          error: 'Invalid admin credentials',
          message: 'Admin registration requires the correct admin password'
        });
      }
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Verify ZKP proof if provided
    let zkpVerified = false;
    if (zkpProof) {
      zkpVerified = await zkpService.verifyProof(zkpProof);
    }

    // Generate device fingerprint automatically if not provided
    let finalDeviceFingerprint = deviceFingerprint;
    if (!finalDeviceFingerprint) {
      // Generate a basic device fingerprint from request headers
      const userAgent = req.headers['user-agent'] || 'unknown';
      const acceptLanguage = req.headers['accept-language'] || 'unknown';
      const acceptEncoding = req.headers['accept-encoding'] || 'unknown';
      const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
      
      // Create a simple hash from available headers
      const deviceString = `${userAgent}-${acceptLanguage}-${acceptEncoding}-${ipAddress}`;
      finalDeviceFingerprint = Buffer.from(deviceString).toString('base64').replace(/[^a-zA-Z0-9]/g, '').substring(0, 32);
      
      console.log('Generated device fingerprint for registration:', finalDeviceFingerprint);
    }

    // Use provided location or set default
    const finalLocation = location || 'Location Not Provided';
    console.log('Using location for registration:', finalLocation);

    // Create user
    const user = new User({
      email,
      passwordHash,
      isAdmin: email === process.env.ADMIN_EMAIL, // First admin user
      deviceFingerprint: finalDeviceFingerprint,
      registeredLocation: finalLocation,
      lastKnownLocation: finalLocation,
      lastDeviceFingerprint: finalDeviceFingerprint,
      zkProofData: zkpProof ? {
        proof: zkpProof.proof,
        publicSignals: zkpProof.publicSignals,
        verified: zkpVerified,
        verifiedAt: zkpVerified ? new Date() : undefined
      } : undefined
    });

    await user.save();

    // Log the registration
    await new AccessLog({
      userId: user._id,
      action: 'register',
      riskScore: req.riskScore || 0,
      ipAddress: req.riskData?.ipAddress || 'unknown',
      userAgent: req.riskData?.userAgent,
      deviceFingerprint: finalDeviceFingerprint,
      location: finalLocation,
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
        isAdmin: user.isAdmin,
        zkpVerified: zkpVerified,
        deviceFingerprint: user.deviceFingerprint,
        registeredLocation: user.registeredLocation
      },
      // Registration always allowed - no device restrictions
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Registration validation error:', error.issues);
      return res.status(400).json({ 
        error: 'Validation failed',
        details: error.issues 
      });
    }
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
router.post('/login', checkDatabaseConnection, deviceAuthentication, logDeviceAccess, assessRisk, async (req: RiskRequest & DeviceAuthRequest, res) => {
  try {
    console.log('Login request body:', req.body);
    let { email, password, deviceFingerprint, location, zkpProof } = loginSchema.parse(req.body);

    // Generate device fingerprint automatically if not provided
    if (!deviceFingerprint) {
      const userAgent = req.headers['user-agent'] || 'unknown';
      const acceptLanguage = req.headers['accept-language'] || 'unknown';
      const acceptEncoding = req.headers['accept-encoding'] || 'unknown';
      const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
      
      const deviceString = `${userAgent}-${acceptLanguage}-${acceptEncoding}-${ipAddress}`;
      deviceFingerprint = Buffer.from(deviceString).toString('base64').replace(/[^a-zA-Z0-9]/g, '').substring(0, 32);
      
      console.log('Generated device fingerprint for login:', deviceFingerprint);
    }

    // Use provided location or set default
    if (!location) {
      location = 'Location Not Provided';
    }

    console.log('Using device fingerprint and location for login:', { deviceFingerprint, location });

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      // Create a dummy ObjectId for failed login attempts
      const dummyUserId = new mongoose.Types.ObjectId();
      await new AccessLog({
        userId: dummyUserId,
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
    let isValidPassword = await bcrypt.compare(password, user.passwordHash);
    
    // For admin users, also allow login with the fixed admin password
    if (!isValidPassword && user.isAdmin && process.env.ADMIN_PASSWORD) {
      isValidPassword = password === process.env.ADMIN_PASSWORD;
    }
    
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

    // Calculate total risk score including device risk
    const baseRiskScore = req.riskScore || 0;
    const deviceRiskScore = req.deviceInfo?.riskScore || 0;
    const totalRiskScore = baseRiskScore + deviceRiskScore;

    // Log device authentication details for debugging
    console.log('Device Authentication Check:', {
      email: user.email,
      isAdmin: user.isAdmin,
      registeredDevice: user.deviceFingerprint?.slice(0, 16),
      currentDevice: req.deviceInfo?.fingerprint?.slice(0, 16),
      isRecognized: req.deviceInfo?.isRecognized,
      deviceRiskScore: req.deviceInfo?.riskScore,
      riskFactors: req.deviceInfo?.riskFactors
    });

    // Skip device authentication for admin users
    // ONLY deny if device is NOT recognized AND user has a registered device
    if (!user.isAdmin && user.deviceFingerprint && req.deviceInfo && !req.deviceInfo.isRecognized) {
      await new AccessLog({
        userId: user._id,
        action: 'login',
        riskScore: totalRiskScore,
        ipAddress: req.deviceInfo.ipAddress,
        userAgent: req.deviceInfo.userAgent,
        deviceFingerprint: req.deviceInfo.fingerprint,
        location: req.deviceInfo.location,
        allowed: false,
        reason: `Device authentication failed: ${req.deviceInfo.riskFactors.join(', ')}`
      }).save();

      return res.status(403).json({
        error: 'Authentication failed',
        message: 'The email and password you entered do not match with the device you registered with. Please use the same device you used during registration.',
        details: {
          registeredDevice: user.deviceFingerprint ? user.deviceFingerprint.slice(0, 8) + '...' : 'Unknown',
          currentDevice: req.deviceInfo.fingerprint.slice(0, 8) + '...',
          registeredLocation: user.registeredLocation || 'Unknown',
          currentLocation: req.deviceInfo.location
        },
        riskScore: totalRiskScore,
        deviceInfo: {
          recognized: false,
          factors: req.deviceInfo.riskFactors
        }
      });
    }

    // Check overall risk score
    if (totalRiskScore > 80) {
      await new AccessLog({
        userId: user._id,
        action: 'login',
        riskScore: totalRiskScore,
        ipAddress: req.riskData?.ipAddress || 'unknown',
        userAgent: req.riskData?.userAgent,
        allowed: false,
        reason: `High risk score (${totalRiskScore}): ${req.deviceInfo?.riskFactors.join(', ') || 'Multiple risk factors detected'}`
      }).save();

      return res.status(403).json({
        error: 'Login denied due to high risk score',
        riskScore: totalRiskScore,
        deviceInfo: req.deviceInfo ? {
          recognized: req.deviceInfo.isRecognized,
          factors: req.deviceInfo.riskFactors
        } : undefined
      });
    }

    // Verify ZKP proof if provided
    let zkpVerified = false;
    if (zkpProof) {
      zkpVerified = await zkpService.verifyProof(zkpProof);
      if (zkpVerified && (!user.zkProofData || !user.zkProofData.verified)) {
        user.zkProofData = {
          proof: zkpProof.proof,
          publicSignals: zkpProof.publicSignals,
          verified: true,
          verifiedAt: new Date()
        };
      }
    }

    // Update user data with device info
    user.lastLogin = new Date();
    user.lastKnownLocation = req.deviceInfo?.location || location || user.lastKnownLocation;
    user.lastDeviceFingerprint = req.deviceInfo?.fingerprint || deviceFingerprint || user.lastDeviceFingerprint;
    
    // Update registered device/location if this is a trusted login
    if (req.deviceInfo?.isRecognized || totalRiskScore < 30) {
      if (!user.deviceFingerprint && req.deviceInfo?.fingerprint) {
        user.deviceFingerprint = req.deviceInfo.fingerprint;
      }
      if (!user.registeredLocation && req.deviceInfo?.location) {
        user.registeredLocation = req.deviceInfo.location;
      }
    }
    
    await user.save();

    // Log successful login with enhanced device info
    await new AccessLog({
      userId: user._id,
      action: 'login',
      riskScore: totalRiskScore,
      ipAddress: req.deviceInfo?.ipAddress || req.riskData?.ipAddress || 'unknown',
      userAgent: req.deviceInfo?.userAgent || req.riskData?.userAgent,
      deviceFingerprint: req.deviceInfo?.fingerprint || req.riskData?.deviceFingerprint,
      location: req.deviceInfo?.location || req.riskData?.location,
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
        isAdmin: user.isAdmin,
        zkpVerified: user.zkProofData?.verified || false,
        deviceFingerprint: user.deviceFingerprint,
        registeredLocation: user.registeredLocation
      },
      riskScore: totalRiskScore,
      zkpVerified: zkpVerified || (user.zkProofData?.verified || false),
      deviceInfo: req.deviceInfo ? {
        fingerprint: req.deviceInfo.fingerprint,
        location: req.deviceInfo.location,
        isRecognized: req.deviceInfo.isRecognized,
        riskScore: req.deviceInfo.riskScore,
        riskFactors: req.deviceInfo.riskFactors
      } : undefined
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Login validation error:', error.issues);
      return res.status(400).json({ 
        error: 'Validation failed',
        details: error.issues 
      });
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



// Comprehensive Risk-Based Login with OPA
router.post('/login-comprehensive', checkDatabaseConnection, async (req, res) => {
  try {
    console.log('Comprehensive login request body:', req.body);
    let { email, password, typingSpeed, keystrokes, deviceFingerprint, location } = loginSchema.parse(req.body);

    // Generate device fingerprint automatically if not provided
    if (!deviceFingerprint) {
      const userAgent = req.headers['user-agent'] || 'unknown';
      const acceptLanguage = req.headers['accept-language'] || 'unknown';
      const acceptEncoding = req.headers['accept-encoding'] || 'unknown';
      const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
      
      const deviceString = `${userAgent}-${acceptLanguage}-${acceptEncoding}-${ipAddress}`;
      deviceFingerprint = Buffer.from(deviceString).toString('base64').replace(/[^a-zA-Z0-9]/g, '').substring(0, 32);
      
      console.log('Generated device fingerprint for comprehensive login:', deviceFingerprint);
    }

    // Use provided location or set default
    if (!location) {
      location = 'Location Not Provided';
    }

    // Extract client information for rate limiting
    const clientInfo = rateLimiterService.extractClientInfo(req);

    // Check rate limiting first
    const rateLimitCheck = await rateLimiterService.isAccountRateLimited(email);
    if (rateLimitCheck.isLimited) {
      // Record this attempt as well
      await rateLimiterService.recordFailedAttempt({
        email,
        ...clientInfo,
        reason: 'Rate limited - too many failed attempts',
        riskScore: 100
      });

      return res.status(429).json({
        error: 'Account temporarily locked',
        message: `Too many failed login attempts. Account has been blocked and admin has been notified.`,
        risk_assessment: {
          allowed: false,
          risk_score: 100,
          risk_level: 'high',
          reasons: [`Account blocked after ${rateLimitCheck.attemptsCount} failed attempts`],
          suggested_action: 'Contact administrator to unblock account'
        },
        rate_limit: {
          attempts_made: rateLimitCheck.attemptsCount,
          max_attempts: 5,
          blocked: true
        }
      });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ 
        error: 'Invalid credentials',
        risk_assessment: {
          allowed: false,
          risk_score: 100,
          risk_level: 'high',
          reasons: ['User not found'],
          suggested_action: 'Block access'
        }
      });
    }

    // Check if user is blocked
    if (user.isBlocked) {
      return res.status(403).json({ 
        error: 'Account blocked',
        risk_assessment: {
          allowed: false,
          risk_score: 100,
          risk_level: 'high',
          reasons: ['Account is blocked'],
          suggested_action: 'Contact administrator'
        }
      });
    }

    // Verify password
    let isValidPassword = await bcrypt.compare(password, user.passwordHash);
    
    // For admin users, also allow login with the fixed admin password
    if (!isValidPassword && user.isAdmin && process.env.ADMIN_PASSWORD) {
      isValidPassword = password === process.env.ADMIN_PASSWORD;
    }
    
    if (!isValidPassword) {
      // Record failed attempt
      await rateLimiterService.recordFailedAttempt({
        email,
        ...clientInfo,
        reason: 'Invalid password',
        riskScore: 100
      });

      // Get updated rate limit info
      const updatedRateLimit = await rateLimiterService.isAccountRateLimited(email);

      return res.status(401).json({ 
        error: 'Invalid credentials',
        message: updatedRateLimit.remainingAttempts > 0 
          ? `Invalid password. ${updatedRateLimit.remainingAttempts} attempts remaining before account lock.`
          : 'Account will be locked after next failed attempt.',
        risk_assessment: {
          allowed: false,
          risk_score: 100,
          risk_level: 'high',
          reasons: ['Invalid password'],
          suggested_action: 'Block access'
        },
        rate_limit: {
          attempts_made: updatedRateLimit.attemptsCount,
          remaining_attempts: updatedRateLimit.remainingAttempts,
          max_attempts: 5
        }
      });
    }

    // Get failed login attempts from session/cache (simplified for demo)
    const failedAttempts = 0; // In production, get from Redis/session store

    // Calculate typing speed if keystroke data provided
    let calculatedTypingSpeed = typingSpeed;
    if (keystrokes && keystrokes.length > 1) {
      calculatedTypingSpeed = riskAssessmentService.measureTypingSpeed(keystrokes);
    }

    // Calculate behavioral score
    const behavioralScore = riskAssessmentService.calculateBehavioralScore(req);

    // Collect comprehensive risk context
    const riskContext = await riskAssessmentService.collectRiskContext(req, user, {
      typing_speed: calculatedTypingSpeed,
      failed_attempts: failedAttempts,
      behavioral_score: behavioralScore
    });

    // Evaluate with OPA
    const opaResult = await opaService.evaluatePolicy({
      ...riskContext,
      action: 'login'
    });

    // Log the access attempt with detailed risk assessment
    await new AccessLog({
      userId: user._id,
      action: 'login',
      riskScore: opaResult.risk_score,
      ipAddress: riskContext.ip_address,
      userAgent: riskContext.user_agent,
      deviceFingerprint: riskContext.device_fingerprint,
      location: riskContext.location ? `${riskContext.location.city}, ${riskContext.location.country}` : undefined,
      allowed: opaResult.allow,
      reason: opaResult.reasons.join('; '),
      zkpVerified: user.zkProofData?.verified || false,
      timestamp: new Date()
    }).save();

    // Handle different risk levels
    if (opaResult.risk_level === 'high' || !opaResult.allow) {
      return res.status(403).json({
        error: 'Access denied due to high risk',
        risk_assessment: {
          allowed: opaResult.allow,
          risk_score: opaResult.risk_score,
          risk_level: opaResult.risk_level,
          reasons: opaResult.reasons,
          suggested_action: opaResult.suggested_action,
          detailed_factors: {
            device_fingerprint: riskContext.device_fingerprint !== riskContext.user.registered_device_fingerprint,
            location_anomaly: riskContext.location?.country !== riskContext.user.registered_location?.country,
            typing_speed_variance: calculatedTypingSpeed ? Math.abs((calculatedTypingSpeed - (riskContext.user.baseline_typing_speed || 40)) / (riskContext.user.baseline_typing_speed || 40)) * 100 : 0,
            failed_attempts: failedAttempts,
            behavioral_score: behavioralScore,
            network_reputation: riskContext.network?.reputation,
            account_age_hours: (Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60)
          }
        }
      });
    }

    if (opaResult.risk_level === 'medium') {
      // Medium risk - require MFA
      return res.status(202).json({
        message: 'MFA required',
        require_mfa: true,
        risk_assessment: {
          allowed: false,
          risk_score: opaResult.risk_score,
          risk_level: opaResult.risk_level,
          reasons: opaResult.reasons,
          suggested_action: opaResult.suggested_action
        },
        mfa_methods: user.mfaFactors?.filter(f => f.isActive).map(f => f.type) || []
      });
    }

    // Low risk - generate token and allow access
    const token = jwt.sign(
      { 
        userId: user._id, 
        email: user.email,
        isAdmin: user.isAdmin,
        zkpVerified: user.zkProofData?.verified || false
      },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    );

    // Clear failed attempts on successful login
    await rateLimiterService.clearFailedAttempts(email);

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        isAdmin: user.isAdmin,
        zkpVerified: user.zkProofData?.verified || false
      },
      risk_assessment: {
        allowed: opaResult.allow,
        risk_score: opaResult.risk_score,
        risk_level: opaResult.risk_level,
        reasons: opaResult.reasons,
        suggested_action: opaResult.suggested_action
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues });
    }
    console.error('Comprehensive login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

export default router;