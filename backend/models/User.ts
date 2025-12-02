import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  email: string;
  passwordHash: string;
  isBlocked: boolean;
  isAdmin: boolean;
  lockReason?: string;
  zkProofData?: {
    proof: string;
    publicSignals: string[];
    verified: boolean;
    verifiedAt?: Date;
  };
  mfaFactors?: {
    type: string;
    secretHash: string;
    isActive: boolean;
    createdAt: Date;
    lastUsed?: Date;
    metadata?: any;
  }[];
  did?: string;
  deviceFingerprint?: string;
  registeredLocation?: string;
  lastKnownLocation?: string;
  gpsLocation?: {
    type: 'Point';
    coordinates: [number, number];
    name?: string;
  };
  registeredGpsLocation?: {
    type: 'Point';
    coordinates: [number, number];
    name?: string;
  };
  lastDeviceFingerprint?: string;
  rejectionReasons?: string[];
  // RBA fields
  keystrokeBaseline?: {
    meanIKI: number;
    stdIKI: number;
    samples: number;
  };
  locationHistory?: Array<{
    lat: number;
    lon: number;
    timestamp: Date;
  }>;
  knownDevices?: Array<{
    deviceIdHash: string;
    firstSeen: Date;
    lastSeen: Date;
  }>;
  activityHours?: {
    start: number;
    end: number;
    tz: string;
  };
  lastLoginDetails?: {
    timestamp: Date;
    ip?: string;
    gps?: {
      lat: number;
      lon: number;
    };
  };
  createdAt: Date;
  lastLogin?: Date;
}

const userSchema = new Schema<IUser>({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  isBlocked: {
    type: Boolean,
    default: false
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  lockReason: {
    type: String
  },
  zkProofData: {
    proof: String,
    publicSignals: [String],
    verified: {
      type: Boolean,
      default: false
    },
    verifiedAt: Date
  },
  mfaFactors: [{
    type: {
      type: String,
      required: true
    },
    secretHash: {
      type: String,
      required: true
    },
    isActive: {
      type: Boolean,
      default: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    lastUsed: Date,
    metadata: Schema.Types.Mixed
  }],
  did: {
    type: String
  },
  deviceFingerprint: {
    type: String
  },
  registeredLocation: {
    type: String
  },
  lastKnownLocation: {
    type: String
  },
  gpsLocation: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      default: [0, 0]
    },
    name: String
  },
  registeredGpsLocation: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      default: [0, 0]
    },
    name: String
  },
  lastDeviceFingerprint: {
    type: String
  },
  rejectionReasons: [{
    type: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date
  },
  // RBA fields
  keystrokeBaseline: {
    meanIKI: { type: Number, default: 0 },
    stdIKI: { type: Number, default: 0 },
    samples: { type: Number, default: 0 }
  },
  locationHistory: [{
    lat: Number,
    lon: Number,
    timestamp: Date
  }],
  knownDevices: [{
    deviceIdHash: String,
    firstSeen: Date,
    lastSeen: Date
  }],
  activityHours: {
    start: { type: Number, default: 8 },
    end: { type: Number, default: 20 },
    tz: { type: String, default: 'Asia/Kolkata' }
  },
  lastLoginDetails: {
    timestamp: Date,
    ip: String,
    gps: {
      lat: Number,
      lon: Number
    }
  }
});

export const User = mongoose.model<IUser>('User', userSchema);