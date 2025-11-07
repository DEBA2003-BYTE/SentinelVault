import mongoose, { Document, Schema } from 'mongoose';

export interface IPolicy extends Document {
  name: string;
  description: string;
  policyCode: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const policySchema = new Schema<IPolicy>({
  name: {
    type: String,
    required: true,
    unique: true
  },
  description: {
    type: String,
    required: true
  },
  policyCode: {
    type: String,
    required: true
  },
  active: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

policySchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export const Policy = mongoose.model<IPolicy>('Policy', policySchema);