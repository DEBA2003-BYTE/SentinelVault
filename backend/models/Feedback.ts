import mongoose, { Document, Schema } from 'mongoose';

export interface IFeedback extends Document {
  email: string;
  complaint: string;
  rating?: number;
  status: 'open' | 'in_progress' | 'resolved';
  priority: 'low' | 'medium' | 'high';
  createdAt: Date;
  resolvedAt?: Date;
  adminNotes?: string;
}

const feedbackSchema = new Schema<IFeedback>({
  email: {
    type: String,
    required: true,
    trim: true
  },
  complaint: {
    type: String,
    required: true,
    minlength: 10,
    maxlength: 1000
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    default: 5
  },
  status: {
    type: String,
    enum: ['open', 'in_progress', 'resolved'],
    default: 'open'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  resolvedAt: {
    type: Date
  },
  adminNotes: {
    type: String,
    maxlength: 500
  }
});

export const Feedback = mongoose.model<IFeedback>('Feedback', feedbackSchema);