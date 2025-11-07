import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  email: string;
  passwordHash: string;
  isBlocked: boolean;
  isAdmin: boolean;
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
  lastDeviceFingerprint?: string;
  rejectionReasons?: string[];
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
    type: String,
    secretHash: String,
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
  }
});

export const User = mongoose.model<IUser>('User', userSchema);