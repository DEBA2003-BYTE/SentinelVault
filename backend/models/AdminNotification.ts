import mongoose, { Document, Schema } from 'mongoose';

export interface IAdminNotification extends Document {
  type: 'account_blocked' | 'security_alert' | 'system_alert';
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  userId?: mongoose.Types.ObjectId;
  userEmail?: string;
  metadata?: {
    failedAttempts?: number;
    ipAddress?: string;
    location?: string;
    riskScore?: number;
    blockReason?: string;
  };
  isRead: boolean;
  createdAt: Date;
  readAt?: Date;
}

const adminNotificationSchema = new Schema<IAdminNotification>({
  type: {
    type: String,
    enum: ['account_blocked', 'security_alert', 'system_alert'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    required: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  userEmail: {
    type: String
  },
  metadata: {
    failedAttempts: Number,
    ipAddress: String,
    location: String,
    riskScore: Number,
    blockReason: String
  },
  isRead: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  readAt: {
    type: Date
  }
});

// Index for efficient queries
adminNotificationSchema.index({ createdAt: -1 });
adminNotificationSchema.index({ isRead: 1, createdAt: -1 });
adminNotificationSchema.index({ type: 1, createdAt: -1 });

export const AdminNotification = mongoose.model<IAdminNotification>('AdminNotification', adminNotificationSchema);