import mongoose, { Document, Schema } from 'mongoose';

export interface IAccessLog extends Document {
  userId: mongoose.Types.ObjectId;
  fileId?: mongoose.Types.ObjectId;
  action: 'upload' | 'download' | 'delete' | 'login' | 'register';
  riskScore: number;
  deviceFingerprint?: string;
  ipAddress: string;
  location?: string;
  userAgent?: string;
  timestamp: Date;
  allowed: boolean;
  reason?: string;
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
    enum: ['upload', 'download', 'delete', 'login', 'register'],
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
  }
});

export const AccessLog = mongoose.model<IAccessLog>('AccessLog', accessLogSchema);