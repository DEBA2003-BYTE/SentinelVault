import mongoose, { Document, Schema } from 'mongoose';

export interface IRiskEvent extends Document {
  userId: mongoose.Types.ObjectId;
  ip?: string;
  ua?: string;
  gps?: {
    lat: number;
    lon: number;
  };
  deviceId?: string;
  keystrokeSample?: {
    meanIKI: number;
    stdIKI: number;
    samples: number;
    length?: number;
  };
  computedRisk: number;
  breakdown: {
    failedAttempts?: number;
    gps?: number;
    typing?: number;
    timeOfDay?: number;
    velocity?: number;
    newDevice?: number;
    otherTotal?: number;
  };
  action: string;
  timestamp: Date;
}

const riskEventSchema = new Schema<IRiskEvent>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  ip: String,
  ua: String,
  gps: {
    lat: Number,
    lon: Number
  },
  deviceId: String,
  keystrokeSample: {
    meanIKI: Number,
    stdIKI: Number,
    samples: Number,
    length: Number
  },
  computedRisk: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  breakdown: {
    failedAttempts: Number,
    gps: Number,
    typing: Number,
    timeOfDay: Number,
    velocity: Number,
    newDevice: Number,
    otherTotal: Number
  },
  action: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient queries
riskEventSchema.index({ userId: 1, timestamp: -1 });
riskEventSchema.index({ action: 1, timestamp: -1 });

export const RiskEvent = mongoose.model<IRiskEvent>('RiskEvent', riskEventSchema);
