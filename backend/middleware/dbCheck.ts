import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';

export const checkDatabaseConnection = (req: Request, res: Response, next: NextFunction) => {
  // Skip database check for health endpoint
  if (req.path === '/health') {
    return next();
  }

  // Check if MongoDB is connected
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      error: 'Database temporarily unavailable',
      message: 'The service is currently experiencing database connectivity issues. Please try again later.',
      status: 'service_unavailable'
    });
  }

  next();
};

export const gracefulDatabaseError = (error: any, req: Request, res: Response, next: NextFunction) => {
  // Handle MongoDB connection errors gracefully
  if (error.name === 'MongooseError' || error.name === 'MongoError') {
    console.error('Database error:', error.message);
    return res.status(503).json({
      error: 'Database temporarily unavailable',
      message: 'The service is currently experiencing database connectivity issues. Please try again later.',
      status: 'service_unavailable'
    });
  }

  next(error);
};