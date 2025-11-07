import mongoose, { Document, Schema } from 'mongoose';

export interface IMFASecret extends Document {
  userId: mongoose.Types.ObjectId;
  secretType: 'pin_hash' | 'biometric_hash' | 'pattern_hash' | 'voice_hash' | 'behavioral_hash';
  secretCommitment: string; // ZK commitment of the secret
  salt: string; // For additional security
  isActive: boolean;
  createdAt: Date;
  lastUsed?: Date;
  failedAttempts: number;
  lockedUntil?: Date;
  metadata?: {
    biometricType?: 'fingerprint' | 'face' | 'iris' | 'voice';
    deviceId?: string;
    strength?: 'weak' | 'medium' | 'strong';
  };
}

const mfaSecretSchema = new Schema<IMFASecret>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  secretType: {
    type: String,
    enum: ['pin_hash', 'biometric_hash', 'pattern_hash', 'voice_hash', 'behavioral_hash'],
    required: true
  },
  secretCommitment: {
    type: String,
    required: true
  },
  salt: {
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
  lastUsed: {
    type: Date
  },
  failedAttempts: {
    type: Number,
    default: 0
  },
  lockedUntil: {
    type: Date
  },
  metadata: {
    biometricType: {
      type: String,
      enum: ['fingerprint', 'face', 'iris', 'voice']
    },
    deviceId: String,
    strength: {
      type: String,
      enum: ['weak', 'medium', 'strong']
    }
  }
});

export const MFASecret = mongoose.model<IMFASecret>('MFASecret', mfaSecretSchema);