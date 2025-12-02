import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { User, type IUser } from '../models/User';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    isAdmin: boolean;
    zkpVerified?: boolean;
    deviceFingerprint?: string;
    registeredLocation?: string;
  };
}

export const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader?.split(' ')[1];

    if (!token) {
      console.log('No token provided in request');
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'No authentication token provided'
      });
    }

    console.log('Verifying token...');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as { userId: string };
    
    if (!decoded?.userId) {
      console.error('Invalid token payload:', { decoded });
      return res.status(403).json({ 
        error: 'Invalid token',
        message: 'Token payload is invalid'
      });
    }

    console.log('Fetching user from database:', { userId: decoded.userId });
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      console.error('User not found for token:', { userId: decoded.userId });
      return res.status(403).json({ 
        error: 'User not found',
        message: 'The user associated with this token was not found'
      });
    }

    if (user.isBlocked) {
      console.warn('Blocked user attempted access:', { 
        userId: user._id, 
        email: user.email 
      });
      return res.status(403).json({ 
        error: 'Account suspended',
        message: 'This account has been suspended. Please contact support.'
      });
    }

    // Attach user to request
    req.user = {
      id: user._id.toString(),
      email: user.email,
      isAdmin: user.isAdmin,
      zkpVerified: user.zkProofData?.verified || false,
      deviceFingerprint: user.deviceFingerprint,
      registeredLocation: user.registeredLocation
    };

    console.log('User authenticated successfully:', { 
      userId: req.user.id, 
      email: req.user.email,
      isAdmin: req.user.isAdmin 
    });
    
    next();
  } catch (error: unknown) {
    console.error('Authentication error:', error);
    
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ 
        error: 'Token expired',
        message: 'Your session has expired. Please log in again.'
      });
    }
    
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(403).json({ 
        error: 'Invalid token',
        message: 'The provided token is invalid or malformed'
      });
    }
    
    // For any other errors
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ 
      error: 'Authentication failed',
      message: 'An error occurred during authentication',
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    });
  }
};

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    console.error('requireAdmin called without authenticated user');
    return res.status(401).json({ 
      error: 'Authentication required',
      message: 'You must be logged in to access this resource'
    });
  }

  if (!req.user.isAdmin) {
    console.warn('Non-admin user attempted admin access:', { 
      userId: req.user.id, 
      email: req.user.email 
    });
    return res.status(403).json({ 
      error: 'Access denied',
      message: 'You do not have permission to access this resource'
    });
  }

  console.log('Admin access granted:', { 
    userId: req.user.id, 
    email: req.user.email 
  });
  next();
};