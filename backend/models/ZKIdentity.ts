import mongoose, { Document, Schema } from 'mongoose';

export interface IZKIdentity extends Document {
  userId: mongoose.Types.ObjectId;
  identityCommitment: string; // Hash of identity credentials
  credentialType: 'verified_human' | 'age_verified' | 'government_id' | 'email_verified' | 'phone_verified';
  issuer: string; // Identity provider (e.g., 'polygon_id', 'world_id', 'self_sovereign')
  proofSchema: string; // Schema used for the credential
  issuedAt: Date;
  expiresAt?: Date;
  revoked: boolean;
  verificationCount: number;
  lastVerified?: Date;
  metadata?: {
    ageThreshold?: number;
    countryCode?: string;
    verificationLevel?: 'basic' | 'enhanced' | 'premium';
  };
}

const zkIdentitySchema = new Schema<IZKIdentity>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  identityCommitment: {
    type: String,
    required: true,
    unique: true
  },
  credentialType: {
    type: String,
    enum: ['verified_human', 'age_verified', 'government_id', 'email_verified', 'phone_verified'],
    required: true
  },
  issuer: {
    type: String,
    required: true
  },
  proofSchema: {
    type: String,
    required: true
  },
  issuedAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date
  },
  revoked: {
    type: Boolean,
    default: false
  },
  verificationCount: {
    type: Number,
    default: 0
  },
  lastVerified: {
    type: Date
  },
  metadata: {
    ageThreshold: Number,
    countryCode: String,
    verificationLevel: {
      type: String,
      enum: ['basic', 'enhanced', 'premium']
    }
  }
});

export const ZKIdentity = mongoose.model<IZKIdentity>('ZKIdentity', zkIdentitySchema);