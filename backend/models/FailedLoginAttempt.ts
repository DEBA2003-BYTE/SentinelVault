import mongoose, { Document, Schema } from 'mongoose';

export interface IFailedLoginAttempt extends Document {
  email: string;
  ipAddress: string;
  userAgent?: string;
  deviceFingerprint?: string;
  location?: string;
  timestamp: Date;
  reason: string;
  riskScore?: number;
}

const failedLoginAttemptSchema = new Schema<IFailedLoginAttempt>({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  ipAddress: {
    type: String,
    required: true
  },
  userAgent: {
    type: String
  },
  deviceFingerprint: {
    type: String
  },
  location: {
    type: String
  },
  timestamp: {
    type: Date,
    default: Date.now,
    expires: 86400 // Expire after 24 hours
  },
  reason: {
    type: String,
    required: true
  },
  riskScore: {
    type: Number,
    default: 0
  }
});

// Index for efficient queries
failedLoginAttemptSchema.index({ email: 1, timestamp: -1 });
failedLoginAttemptSchema.index({ ipAddress: 1, timestamp: -1 });

export const FailedLoginAttempt = mongoose.model<IFailedLoginAttempt>('FailedLoginAttempt', failedLoginAttemptSchema);