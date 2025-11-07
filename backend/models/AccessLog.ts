import mongoose, { Document, Schema } from 'mongoose';

export interface IAccessLog extends Document {
  userId: mongoose.Types.ObjectId;
  fileId?: mongoose.Types.ObjectId;
  action: 'upload' | 'download' | 'delete' | 'login' | 'register' | 'verifyZKP' | 'policy_evaluation' | 'admin_block_user' | 'admin_unblock_user' | 'admin_delete_user';
  riskScore: number;
  deviceFingerprint?: string;
  ipAddress: string;
  location?: string;
  userAgent?: string;
  timestamp: Date;
  allowed: boolean;
  reason?: string;
  opaDecision?: 'allow' | 'deny';
  zkpVerified?: boolean;
}

const accessLogSchema = new Schema<IAccessLog>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fileId: {
    type: Schema.Types.ObjectId,
    ref: 'File'
  },
  action: {
    type: String,
    enum: ['upload', 'download', 'delete', 'login', 'register', 'verifyZKP', 'policy_evaluation', 'admin_block_user', 'admin_unblock_user', 'admin_delete_user'],
    required: true
  },
  riskScore: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  deviceFingerprint: {
    type: String
  },
  ipAddress: {
    type: String,
    required: true
  },
  location: {
    type: String
  },
  userAgent: {
    type: String
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  allowed: {
    type: Boolean,
    required: true
  },
  reason: {
    type: String
  },
  opaDecision: {
    type: String,
    enum: ['allow', 'deny']
  },
  zkpVerified: {
    type: Boolean,
    default: false
  }
});

export const AccessLog = mongoose.model<IAccessLog>('AccessLog', accessLogSchema);