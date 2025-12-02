import mongoose, { Document, Schema } from 'mongoose';

export interface IFile extends Document {
  userId: mongoose.Types.ObjectId;
  filename: string;
  originalName: string;
  s3Key: string;
  size: number;
  mimeType: string;
  uploadedAt: Date;
  accessCount: number;
  riskLevel?: 'low' | 'medium' | 'high';
  opaDecision?: 'allow' | 'deny';
  rejectionReason?: string;
  visibility: 'all' | 'specific' | 'none';
  sharedWith: string[];
}

const fileSchema = new Schema<IFile>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  filename: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  s3Key: {
    type: String,
    required: true,
    unique: true
  },
  size: {
    type: Number,
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  },
  accessCount: {
    type: Number,
    default: 0
  },
  riskLevel: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'low'
  },
  opaDecision: {
    type: String,
    enum: ['allow', 'deny']
  },
  rejectionReason: {
    type: String
  },
  visibility: {
    type: String,
    enum: ['all', 'specific', 'none'],
    default: 'none'
  },
  sharedWith: {
    type: [String],
    default: []
  }
});

export const File = mongoose.model<IFile>('File', fileSchema);