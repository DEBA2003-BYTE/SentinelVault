import mongoose, { Document, Schema } from 'mongoose';

export interface IAccessLog extends Document {
  userId: mongoose.Types.ObjectId;
  fileId?: mongoose.Types.ObjectId;
  action: 'upload' | 'download' | 'delete' | 'login' | 'register' | 'verifyZKP' | 'policy_evaluation' | 'admin_block_user' | 'admin_unblock_user' | 'admin_delete_user' | 'share';
  riskScore: number;
  location?: {
    type: string;
    coordinates: [number, number];
    name?: string;
  };
  timestamp: Date;
  allowed: boolean;
  reason?: string;
  opaDecision?: 'allow' | 'deny';
  zkpVerified?: boolean;
  userEmail?: string;
  ipAddress?: string;
  userAgent?: string;
  riskAssessment?: {
    policy_results?: Record<string, any>;
    weighted_scores?: Record<string, number>;
    details?: Record<string, any>;
  };
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
    enum: ['upload', 'download', 'delete', 'login', 'register', 'verifyZKP', 'policy_evaluation', 'admin_block_user', 'admin_unblock_user', 'admin_delete_user', 'share'],
    required: true
  },
  riskScore: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: false
    },
    name: String
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
  },
  userEmail: {
    type: String
  },
  riskAssessment: {
    type: Schema.Types.Mixed,
    required: false
  }
});

export const AccessLog = mongoose.model<IAccessLog>('AccessLog', accessLogSchema);