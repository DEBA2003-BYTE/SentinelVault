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
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;

    const user = await User.findById(decoded.userId);
    if (!user || user.isBlocked) {
      return res.status(403).json({ error: 'User blocked or not found' });
    }

    req.user = {
      id: (user._id as mongoose.Types.ObjectId).toString(),
      email: user.email,
      isAdmin: user.isAdmin,
      zkpVerified: user.zkProofData?.verified || false,
      deviceFingerprint: user.deviceFingerprint,
      registeredLocation: user.registeredLocation
    };

    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user?.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};