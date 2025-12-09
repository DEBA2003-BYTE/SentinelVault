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
import { computeRisk } from '../services/scoring.service';
import { RiskEvent } from '../models/RiskEvent';

const router = express.Router();

// Validation schemas
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  deviceFingerprint: z.string().optional(),
  location: z.object({
    type: z.literal('Point'),
    coordinates: z.tuple([z.number(), z.number()]),
    name: z.string().optional()
  }).optional(),
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
  deviceId: z.string().optional(), // For RBA
  location: z.object({
    type: z.literal('Point'),
    coordinates: z.tuple([z.number(), z.number()]),
    name: z.string().optional()
  }).optional(),
  gps: z.object({
    lat: z.number(),
    lon: z.number()
  }).optional(), // For RBA
  keystroke: z.object({
    meanIKI: z.number(),
    stdIKI: z.number().optional(),
    samples: z.number().optional(),
    length: z.number().optional()
  }).optional(), // For RBA
  clientInfo: z.any().optional(), // Enhanced device info
  typingSpeed: z.number().optional(), // Typing speed in WPM
  keystrokes: z.array(z.object({
    timestamp: z.number(),
    key: z.string()
  })).optional(), // Keystroke dynamics
  localTimestamp: z.string().optional(), // For IST time-of-day
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

    // ENFORCE GPS REQUIREMENT - Registration requires valid GPS location
    if (!location || !location.coordinates || location.coordinates.length !== 2) {
      return res.status(400).json({ 
        error: 'GPS location is required',
        message: 'Please allow location access in your browser and try again.'
      });
    }

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
    const locationName = location?.name || 'Location Not Provided';
    console.log('Using location for registration:', location);

    // Create user
    const user = new User({
      email,
      passwordHash,
      isAdmin: email === process.env.ADMIN_EMAIL, // First admin user
      deviceFingerprint: finalDeviceFingerprint,
      registeredLocation: locationName,
      lastKnownLocation: locationName,
      registeredGpsLocation: location ? {
        type: 'Point',
        coordinates: location.coordinates,
        name: location.name
      } : undefined,
      gpsLocation: location ? {
        type: 'Point',
        coordinates: location.coordinates,
        name: location.name
      } : undefined,
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
      location: location,
      allowed: true,
      userEmail: email
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

    // Set default location if not provided
    if (!location) {
      location = {
        type: 'Point' as const,
        coordinates: [0, 0], // Default coordinates (null island)
        name: 'Unknown Location'
      };
    }

    console.log('Using device fingerprint and location for login:', { 
      deviceFingerprint, 
      location: location.name || `${location.coordinates[0]}, ${location.coordinates[1]}` 
    });

    // Find user
    const user = await User.findOne({ email });
    
    // ENFORCE GPS REQUIREMENT for non-admin users
    if (user && !user.isAdmin && email !== 'admin@gmail.com') {
      if (!location || !location.coordinates || location.coordinates.length !== 2 || 
          (location.coordinates[0] === 0 && location.coordinates[1] === 0)) {
        return res.status(400).json({ 
          error: 'GPS location is required',
          message: 'Please allow location access in your browser and try again.'
        });
      }
    }
    if (!user) {
      // Create a dummy ObjectId for failed login attempts
      const dummyUserId = new mongoose.Types.ObjectId();
      await new AccessLog({
        userId: dummyUserId,
        action: 'login',
        riskScore: req.riskScore || 0,
        location: location,
        allowed: false,
        reason: 'User not found',
        userEmail: email
      }).save();

      return res.status(401).json({ 
        error: 'User does not exist',
        message: 'No account found with this email address.'
      });
    }

    // Check if user is blocked
    if (user.isBlocked) {
      await new AccessLog({
        userId: user._id,
        action: 'login',
        riskScore: 100,
        location: location,
        allowed: false,
        reason: user.lockReason || 'User blocked by administrator',
        userEmail: user.email
      }).save();

      return res.status(403).json({ 
        status: 'blocked',
        message: 'You have been blocked. Please contact the administrator to unblock your account.',
        risk: 100,
        breakdown: {
          failedAttempts: 0,
          gps: 0,
          typing: 0,
          timeOfDay: 0,
          velocity: 0,
          newDevice: 0,
          otherTotal: 0
        },
        lockReason: user.lockReason || 'Blocked by administrator'
      });
    }

    // Check for failed attempts BEFORE validating password
    // Count failed password attempts in last 1 hour (60 minutes)
    const failedEventsCount = await RiskEvent.countDocuments({
      userId: user._id,
      action: 'failed-password',
      timestamp: { $gte: new Date(Date.now() - (60 * 60 * 1000)) } // 1 hour
    });

    console.log(`[RBA] User ${email} has ${failedEventsCount} failed attempts in last hour`);

    // Block if 5 or more failed attempts in last hour (BEFORE password check)
    if (failedEventsCount >= 5) {
      console.log(`[RBA] BLOCKING user ${email} due to ${failedEventsCount} failed attempts`);
      user.isBlocked = true;
      user.lockReason = `5 failed login attempts in 1 hour`;
      await user.save();

      await new AccessLog({
        userId: user._id,
        action: 'login',
        riskScore: 100,
        location,
        allowed: false,
        reason: `Account blocked: ${failedEventsCount} failed attempts in last hour`,
        userEmail: user.email
      }).save();

      return res.status(403).json({
        status: 'blocked',
        message: 'Your account has been blocked due to multiple failed login attempts. Please contact the administrator to unblock your account.',
        risk: 100,
        breakdown: {
          failedAttempts: 50,
          gps: 0,
          typing: 0,
          timeOfDay: 0,
          velocity: 0,
          newDevice: 0,
          otherTotal: 0
        },
        failedAttempts: failedEventsCount
      });
    }

    // Verify password
    let isValidPassword = await bcrypt.compare(password, user.passwordHash);
    
    // For admin users, also allow login with the fixed admin password
    if (!isValidPassword && user.isAdmin && process.env.ADMIN_PASSWORD) {
      isValidPassword = password === process.env.ADMIN_PASSWORD;
    }
    
    if (!isValidPassword) {
      console.log(`[RBA] Logging failed password attempt for user ${email}`);
      
      // Log failed password attempt for RBA
      await RiskEvent.create({
        userId: user._id,
        ip: req.ip || 'unknown',
        ua: req.headers['user-agent'] || '',
        gps: req.body.gps || null,
        deviceId: req.body.deviceId || req.body.deviceFingerprint,
        keystrokeSample: req.body.keystroke || {},
        computedRisk: 0,
        breakdown: {},
        action: 'failed-password',
        timestamp: new Date()
      });

      console.log(`[RBA] Failed attempt logged for user ${email}`);

      await new AccessLog({
        userId: user._id,
        action: 'login',
        riskScore: req.riskScore || 0,
        location: location,
        allowed: false,
        reason: 'Invalid password',
        userEmail: user.email
      }).save();

      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // --- ADMIN EXEMPTION: Skip RBA for admin@gmail.com ---
    if (email === 'admin@gmail.com' || user.isAdmin) {
      // Issue tokens immediately (no RBA)
      const token = jwt.sign(
        { userId: user._id },
        process.env.JWT_SECRET || 'fallback-secret',
        { expiresIn: '24h' }
      );

      // Log admin login (no risk computation)
      await RiskEvent.create({
        userId: user._id,
        ip: req.ip || 'unknown',
        ua: req.headers['user-agent'] || '',
        gps: req.body.gps || null,
        deviceId: req.body.deviceId || req.body.deviceFingerprint,
        keystrokeSample: req.body.keystroke || {},
        computedRisk: 0,
        breakdown: {},
        action: 'login-admin-exempt'
      });

      // Update last login
      user.lastLogin = new Date();
      user.lastLoginDetails = {
        timestamp: new Date(),
        ip: req.ip,
        gps: req.body.gps || undefined
      };

      // Update known devices
      const deviceId = req.body.deviceId || req.body.deviceFingerprint;
      if (deviceId) {
        const existing = user.knownDevices?.find(d => d.deviceIdHash === deviceId);
        if (!existing) {
          if (!user.knownDevices) user.knownDevices = [];
          user.knownDevices.push({ deviceIdHash: deviceId, firstSeen: new Date(), lastSeen: new Date() });
        } else {
          existing.lastSeen = new Date();
        }
      }

      await user.save();

      return res.status(200).json({
        status: 'ok',
        token,
        user: {
          id: user._id,
          email: user.email,
          isAdmin: user.isAdmin
        },
        risk: 0,
        popup: { risk: 0, action: 'continue' }
      });
    }

    // --- RBA for normal users ---
    // Note: Failed attempts check already done above before password validation

    // Prepare input for OPA risk scoring
    const opaInput = {
      failed_count: failedEventsCount,
      gps: req.body.gps || null,
      keystroke_sample: req.body.keystroke || {},
      timestamp: req.body.localTimestamp || new Date().toISOString(),
      device_id: req.body.deviceId || req.body.deviceFingerprint || null,
      user: {
        keystroke_baseline: user.keystrokeBaseline || null,
        location_history: user.locationHistory || [],
        known_devices: user.knownDevices || [],
        activity_hours: user.activityHours || { start: 8, end: 20, tz: 'Asia/Kolkata' },
        last_login_details: user.lastLoginDetails || null
      }
    };

    // Compute risk score using OPA
    let riskScore: number;
    let breakdown: any;
    
    try {
      console.log('[RBA] Calling OPA with input:', JSON.stringify(opaInput, null, 2));
      const opaResponse = await fetch(`${process.env.OPA_URL || 'http://localhost:8181'}/v1/data/rba_scoring`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: opaInput })
      });

      if (opaResponse.ok) {
        const opaData = await opaResponse.json() as { result: { risk_score: number; breakdown: any; action: string } };
        riskScore = opaData.result.risk_score || 0;
        breakdown = opaData.result.breakdown || {};
        console.log('[RBA] OPA Risk Assessment:', { riskScore, breakdown, action: opaData.result.action });
        console.log('[RBA] Full OPA response:', JSON.stringify(opaData, null, 2));
      } else {
        // Fallback to TypeScript scoring if OPA fails
        console.warn('[RBA] OPA unavailable (status:', opaResponse.status, '), using fallback scoring');
        const fallback = computeRisk(user, {
          failedCount: failedEventsCount,
          gps: req.body.gps || null,
          keystrokeSample: req.body.keystroke || {},
          timeOnPage: req.body.timeOnPage || 0,
          timestamp: req.body.localTimestamp || new Date().toISOString(),
          deviceId: req.body.deviceId || req.body.deviceFingerprint || null
        });
        riskScore = fallback.total;
        breakdown = fallback.breakdown;
        console.log('[RBA] Fallback scoring result:', { riskScore, breakdown });
      }
    } catch (opaError) {
      // Fallback to TypeScript scoring if OPA fails
      console.warn('[RBA] OPA error, using fallback scoring:', opaError);
      const fallback = computeRisk(user, {
        failedCount: failedEventsCount,
        gps: req.body.gps || null,
        keystrokeSample: req.body.keystroke || {},
        timeOnPage: req.body.timeOnPage || 0,
        timestamp: req.body.localTimestamp || new Date().toISOString(),
        deviceId: req.body.deviceId || req.body.deviceFingerprint || null
      });
      riskScore = fallback.total;
      breakdown = fallback.breakdown;
      console.log('[RBA] Fallback scoring result:', { riskScore, breakdown });
    }
    const action = riskScore >= 71 ? 'blocked' : (riskScore >= 41 ? 'mfa_required' : 'normal');

    // Log risk event
    await RiskEvent.create({
      userId: user._id,
      ip: req.ip || 'unknown',
      ua: req.headers['user-agent'] || '',
      gps: req.body.gps || null,
      deviceId: req.body.deviceId || req.body.deviceFingerprint,
      keystrokeSample: req.body.keystroke || {},
      computedRisk: riskScore,
      breakdown,
      action
    });

    // Handle risk bands
    if (riskScore >= 71) {
      // Block user
      user.isBlocked = true;
      user.lockReason = `risk:${riskScore}`;
      await user.save();

      await new AccessLog({
        userId: user._id,
        action: 'login',
        riskScore,
        location,
        allowed: false,
        reason: `Blocked due to high risk score: ${riskScore}`,
        userEmail: user.email,
        ipAddress: req.ip || 'unknown',
        userAgent: req.headers['user-agent'] || 'unknown',
        deviceFingerprint: deviceFingerprint || 'unknown',
        riskAssessment: {
          breakdown: breakdown || {
            failedAttempts: 0,
            gps: 0,
            typing: 0,
            timeOfDay: 0,
            velocity: 0,
            newDevice: 0
          }
        }
      }).save();

      return res.status(403).json({
        status: 'blocked',
        message: 'Account blocked due to suspicious activity. Contact admin to unblock.',
        risk: riskScore,
        breakdown
      });
    }

    if (riskScore >= 41) {
      // Check if user has any active MFA factors registered
      const hasActiveMFA = user.mfaFactors && user.mfaFactors.length > 0 && 
                          user.mfaFactors.some(factor => factor.isActive);
      
      if (!hasActiveMFA) {
        // No MFA registered - block user and require admin intervention
        user.isBlocked = true;
        user.lockReason = `No MFA registered (risk: ${riskScore})`;
        await user.save();

        await new AccessLog({
          userId: user._id,
          action: 'login',
          riskScore,
          location,
          allowed: false,
          reason: `Blocked: No MFA registered for authentication (risk score: ${riskScore})`,
          userEmail: user.email,
          ipAddress: req.ip || 'unknown',
          userAgent: req.headers['user-agent'] || 'unknown',
          deviceFingerprint: deviceFingerprint || 'unknown',
          riskAssessment: {
            breakdown: breakdown || {
              failedAttempts: 0,
              gps: 0,
              typing: 0,
              timeOfDay: 0,
              velocity: 0,
              newDevice: 0
            }
          }
        }).save();

        return res.status(403).json({
          status: 'blocked',
          message: 'Your account has been blocked because no MFA (Multi-Factor Authentication) is registered. Please contact the administrator to unblock your account.',
          risk: riskScore,
          breakdown,
          reason: 'no_mfa_registered'
        });
      }

      // Require MFA (biometric authentication)
      await new AccessLog({
        userId: user._id,
        action: 'login',
        riskScore,
        location,
        allowed: false,
        reason: `MFA required due to risk score: ${riskScore}`,
        userEmail: user.email,
        ipAddress: req.ip || 'unknown',
        userAgent: req.headers['user-agent'] || 'unknown',
        deviceFingerprint: deviceFingerprint || 'unknown',
        riskAssessment: {
          breakdown: breakdown || {
            failedAttempts: 0,
            gps: 0,
            typing: 0,
            timeOfDay: 0,
            velocity: 0,
            newDevice: 0
          }
        }
      }).save();

      return res.status(200).json({
        status: 'mfa_required',
        method: 'webauthn',
        risk: riskScore,
        breakdown,
        originalRiskScore: riskScore, // Preserve original risk score
        message: 'Please provide biometric authentication to continue',
        userId: user._id.toString(),
        currentDeviceFingerprint: deviceFingerprint // Send the current device fingerprint
      });
    }

    // Risk < 41: Normal access - continue with existing flow
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
        location: location,
        allowed: false,
        reason: `Device authentication failed: ${req.deviceInfo.riskFactors.join(', ')}`,
        userEmail: user.email
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
        location: location,
        allowed: false,
        reason: `High risk score (${totalRiskScore}): ${req.deviceInfo?.riskFactors.join(', ') || 'Multiple risk factors detected'}`,
        userEmail: user.email
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
    // Extract location name (string) from various sources
    const locationName = location?.name || 
                        (typeof req.deviceInfo?.location === 'string' ? req.deviceInfo.location : undefined) ||
                        'Unknown Location';
    user.lastKnownLocation = locationName;
    
    // Store GPS coordinates if available
    if (location) {
      user.gpsLocation = {
        type: 'Point',
        coordinates: location.coordinates
      };
    }
    
    // Update registered device/location if this is a trusted login
    if (req.deviceInfo?.isRecognized || totalRiskScore < 30) {
      if (location && !user.registeredGpsLocation) {
        user.registeredGpsLocation = {
          type: 'Point',
          coordinates: location.coordinates
        };
      }
    }

    // Update keystroke baseline (EMA - Exponential Moving Average)
    const keystroke = req.body.keystroke;
    if (keystroke && keystroke.meanIKI != null) {
      const base = user.keystrokeBaseline || { meanIKI: 0, stdIKI: 0, samples: 0 };
      const alpha = 0.2;
      const newSamples = base.samples + 1;
      base.meanIKI = (alpha * keystroke.meanIKI) + ((1 - alpha) * base.meanIKI);
      base.stdIKI = Math.sqrt(((1 - alpha) * base.stdIKI ** 2 + alpha * ((keystroke.stdIKI || 0) ** 2)));
      base.samples = newSamples;
      user.keystrokeBaseline = base;
    }

    // Update location history
    const gps = req.body.gps;
    if (gps && gps.lat != null && gps.lon != null) {
      if (!user.locationHistory) user.locationHistory = [];
      user.locationHistory.push({
        lat: gps.lat,
        lon: gps.lon,
        timestamp: new Date()
      });
      // Keep only last 10 locations
      if (user.locationHistory.length > 10) {
        user.locationHistory = user.locationHistory.slice(-10);
      }
    }

    // Update known devices
    const deviceId = req.body.deviceId || req.body.deviceFingerprint;
    if (deviceId) {
      if (!user.knownDevices) user.knownDevices = [];
      const existing = user.knownDevices.find(d => d.deviceIdHash === deviceId);
      if (!existing) {
        user.knownDevices.push({ deviceIdHash: deviceId, firstSeen: new Date(), lastSeen: new Date() });
      } else {
        existing.lastSeen = new Date();
      }
    }

    // Update lastLoginDetails for velocity calculation
    user.lastLoginDetails = {
      timestamp: new Date(),
      ip: req.ip,
      gps: gps || undefined
    };
    
    await user.save();

    // Extract session metrics from request body
    const timeOnPageSeconds = req.body.timeOnPage || 0;
    const keystrokeData = req.body.keystroke || {};
    const deleteKeyCount = keystrokeData.deleteCount || 0;
    
    console.log('[SESSION METRICS] Received from frontend:');
    console.log('  timeOnPage:', timeOnPageSeconds);
    console.log('  deleteCount:', deleteKeyCount);
    
    // Log successful login with enhanced device info and risk breakdown
    await new AccessLog({
      userId: user._id,
      action: 'login',
      riskScore: riskScore,
      allowed: true,
      userEmail: user.email,
      ipAddress: req.ip || 'unknown',
      // Session tracking - CRITICAL for risk calculation
      sessionDuration: timeOnPageSeconds,
      deleteKeyCount: deleteKeyCount,
      // Risk factors - used for access decision
      riskFactors: {
        failedLoginAttempts: failedEventsCount || 0,
        gpsDistanceKm: breakdown?.gpsDistance,
        timeOnPageSeconds: timeOnPageSeconds,
        unusualLocation: (breakdown?.gps || 0) > 0,
        newDevice: (breakdown?.newDevice || 0) > 0,
        suspiciousTyping: deleteKeyCount > 10
      },
      // Risk assessment breakdown
      riskAssessment: {
        breakdown: breakdown || {
          failedAttempts: 0,
          gps: 0,
          typing: 0,
          timeOnPage: 0,
          newDevice: 0
        }
      }
    }).save();
    
    console.log('[ACCESS LOG] ✅ Access log saved with session metrics');
    console.log('[ACCESS LOG] Session Duration:', timeOnPageSeconds);
    console.log('[ACCESS LOG] Delete Key Count:', deleteKeyCount);

    // Generate token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '24h' }
    );

    res.json({
      status: 'ok',
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
      risk: riskScore,
      breakdown,
      riskScore: totalRiskScore,
      zkpVerified: zkpVerified || (user.zkProofData?.verified || false),
      deviceInfo: req.deviceInfo ? {
        fingerprint: req.deviceInfo.fingerprint,
        location: req.deviceInfo.location,
        isRecognized: req.deviceInfo.isRecognized,
        riskScore: req.deviceInfo.riskScore,
        riskFactors: req.deviceInfo.riskFactors
      } : undefined,
      popup: { risk: riskScore, action: 'continue' }
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

// Test endpoint to verify backend is working
router.post('/test-mfa', async (req, res) => {
  console.log('🧪 Test MFA endpoint hit');
  res.json({ status: 'ok', message: 'Backend is working' });
});

// MFA Verification endpoint for biometric fingerprint authentication
router.post('/verify-mfa', async (req, res) => {
  console.log('🔐 === MFA VERIFICATION STARTED ===');
  console.log('Request body:', JSON.stringify(req.body, null, 2));
  try {
    const { userId, deviceFingerprint, biometricVerified, credentialId, location, originalRiskScore } = req.body;

    console.log('🔐 MFA Verification Request:', {
      userId,
      biometricVerified,
      hasCredentialId: !!credentialId,
      hasLocation: !!location
    });

    if (!userId) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        message: 'User ID is required'
      });
    }

    // Find user
    let user;
    try {
      user = await User.findById(userId);
    } catch (dbError) {
      console.error('❌ Database error finding user:', dbError);
      return res.status(500).json({ error: 'Database error', message: 'Failed to find user' });
    }

    if (!user) {
      console.log('❌ User not found:', userId);
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('👤 User found:', user.email);

    // Check if user is blocked
    if (user.isBlocked) {
      console.log('❌ User is blocked:', user.email);
      return res.status(403).json({ 
        error: 'Account blocked',
        message: 'Your account has been blocked. Please contact the administrator.'
      });
    }

    // Check if biometric verification was successful
    // If the browser returned a credential, it means the device's secure enclave verified the biometric
    if (!biometricVerified || !credentialId) {
      console.log('❌ Biometric verification failed: No credential provided');
      return res.status(403).json({
        error: 'Biometric verification required',
        message: 'Please complete biometric authentication (fingerprint/face recognition).'
      });
    }

    // ✅ Biometric verified by device - grant access immediately
    console.log('✅ Biometric MFA successful for user:', user.email);
    console.log('   Credential ID:', credentialId);
    console.log('   Device verified biometric - granting access');

    // MFA successful - generate token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '24h' }
    );

    // Update user data (non-blocking)
    user.lastLogin = new Date();
    if (location && location.coordinates) {
      user.lastKnownLocation = location.name || 'Unknown Location';
    }
    if (deviceFingerprint && !user.deviceFingerprint) {
      user.deviceFingerprint = deviceFingerprint;
    }
    
    user.save().catch(err => console.error('⚠️  Error saving user:', err));

    // Log successful MFA with original risk score preserved
    const finalRiskScore = 0; // MFA mitigates risk to 0
    try {
      await new AccessLog({
        userId: user._id,
        action: 'login',
        riskScore: finalRiskScore,
        location: location || undefined,
        allowed: true,
        reason: `MFA successful - Original risk: ${originalRiskScore || 'unknown'}, Mitigated to: ${finalRiskScore}`,
        userEmail: user.email,
        ipAddress: 'unknown',
        userAgent: 'unknown',
        deviceFingerprint: deviceFingerprint || 'unknown',
        riskAssessment: {
          breakdown: {
            failedAttempts: 0,
            gps: 0,
            typing: 0,
            timeOfDay: 0,
            velocity: 0,
            newDevice: 0
          },
          originalRiskScore: originalRiskScore || 0,
          mitigatedBy: 'biometric_mfa'
        }
      }).save();
      console.log('✅ Access log created - Original risk:', originalRiskScore, '→ Mitigated to:', finalRiskScore);
    } catch (logError) {
      console.error('⚠️  Error creating access log:', logError);
    }

    console.log('✅ MFA verification complete, sending response');

    res.json({
      status: 'ok',
      message: 'Biometric MFA verification successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        isAdmin: user.isAdmin,
        deviceFingerprint: user.deviceFingerprint
      },
      riskInfo: {
        originalRisk: originalRiskScore || 0,
        finalRisk: finalRiskScore,
        mitigatedBy: 'biometric_mfa'
      }
    });
  } catch (error: any) {
    console.error('❌ MFA verification error:', error);
    console.error('   Error name:', error.name);
    console.error('   Error message:', error.message);
    console.error('   Error stack:', error.stack);
    res.status(500).json({ 
      error: 'MFA verification failed',
      message: error.message || 'Unknown error occurred'
    });
  }
});

// Re-register biometric fingerprint endpoint
router.post('/reregister-fingerprint', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { credentialId, publicKey } = req.body;

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Remove old fingerprint MFA factors
    if (user.mfaFactors) {
      user.mfaFactors = user.mfaFactors.filter(factor => factor.type !== 'fingerprint');
    } else {
      user.mfaFactors = [];
    }

    // Add new fingerprint MFA factor
    user.mfaFactors.push({
      type: 'fingerprint',
      secretHash: credentialId || 'webauthn-credential',
      isActive: true,
      createdAt: new Date(),
      metadata: {
        publicKey: publicKey || null,
        reregistered: true,
        reregisteredAt: new Date()
      }
    });

    await user.save();

    // Log the re-registration
    await new AccessLog({
      userId: user._id,
      action: 'fingerprint_reregistration',
      riskScore: 0,
      allowed: true,
      reason: 'User re-registered biometric fingerprint',
      userEmail: user.email
    }).save();

    res.json({
      status: 'ok',
      message: 'Fingerprint re-registered successfully',
      mfaFactors: user.mfaFactors
    });
  } catch (error) {
    console.error('Fingerprint re-registration error:', error);
    res.status(500).json({ error: 'Failed to re-register fingerprint' });
  }
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
      location = {
        type: 'Point' as const,
        coordinates: [0, 0],
        name: 'Location Not Provided'
      };
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
      location: location,
      allowed: opaResult.allow,
      reason: opaResult.reasons.join('; '),
      zkpVerified: user.zkProofData?.verified || false,
      timestamp: new Date(),
      userEmail: user.email,
      ipAddress: req.ip || req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
      deviceFingerprint: req.body.deviceFingerprint || 'unknown',
      riskAssessment: {
        policy_results: opaResult.policy_results,
        weighted_scores: opaResult.weighted_scores,
        details: opaResult.details
      }
    }).save();

    // RBA Scoring: Only block if risk score > 70 (as per rba_scoring.rego)
    // Risk bands: 0-40 (Low/Normal), 41-70 (Medium/MFA), 71-100 (High/Blocked)
    // For now, we allow all access and just log the risk score
    // The risk analysis dashboard will show the breakdown
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