import mongoose, { Document, Schema } from 'mongoose';

export interface IAccessLog extends Document {
  // Required fields
  userId: mongoose.Types.ObjectId;
  action: 'upload' | 'download' | 'delete' | 'login' | 'register' | 'verifyZKP' | 'policy_evaluation' | 'admin_block_user' | 'admin_unblock_user' | 'admin_delete_user' | 'share' | 'logout' | 'mfa_failed' | 'fingerprint_reregistration';
  riskScore: number;
  allowed: boolean;
  timestamp: Date;
  // Important optional fields for session tracking
  userEmail?: string;
  ipAddress?: string;
  sessionDuration?: number;
  deleteKeyCount?: number;
  riskAssessment?: any;
  deviceInfo?: {
    browser?: string;
    os?: string;
    deviceType?: string;
  };
  geoLocation?: {
    country?: string;
    city?: string;
    region?: string;
    timezone?: string;
    isp?: string;
    isVPN?: boolean;
    isProxy?: boolean;
  };
  riskFactors?: {
    failedLoginAttempts?: number;
    gpsDistanceKm?: number;
    timeOnPageSeconds?: number;
    unusualLocation?: boolean;
    newDevice?: boolean;
    suspiciousTyping?: boolean;
    unusualTime?: boolean;
  };
}

const accessLogSchema = new Schema<IAccessLog>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    enum: ['upload', 'download', 'delete', 'login', 'register', 'verifyZKP', 'policy_evaluation', 'admin_block_user', 'admin_unblock_user', 'admin_delete_user', 'share', 'logout', 'mfa_failed', 'fingerprint_reregistration'],
    required: true
  },
  riskScore: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  allowed: {
    type: Boolean,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  userEmail: {
    type: String
  },
  ipAddress: {
    type: String
  },
  sessionDuration: {
    type: Number
  },
  deleteKeyCount: {
    type: Number,
    default: 0
  },
  riskAssessment: {
    type: Schema.Types.Mixed
  },
  deviceInfo: {
    browser: String,
    os: String,
    deviceType: String
  },
  geoLocation: {
    country: String,
    city: String,
    region: String,
    timezone: String,
    isp: String,
    isVPN: Boolean,
    isProxy: Boolean
  },
  riskFactors: {
    failedLoginAttempts: Number,
    gpsDistanceKm: Number,
    timeOnPageSeconds: Number,
    unusualLocation: Boolean,
    newDevice: Boolean,
    suspiciousTyping: Boolean,
    unusualTime: Boolean
  }
});

export const AccessLog = mongoose.model<IAccessLog>('AccessLog', accessLogSchema);