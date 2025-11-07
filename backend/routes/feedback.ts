import express from 'express';
import { z } from 'zod';
import { authenticateToken, requireAdmin, type AuthRequest } from '../middleware/auth';
import { Feedback } from '../models/Feedback';

const router = express.Router();

// Validation schema
const feedbackSchema = z.object({
  email: z.string().email(),
  complaint: z.string().min(10).max(1000),
  rating: z.number().min(1).max(5).optional()
});

const updateFeedbackSchema = z.object({
  status: z.enum(['open', 'in_progress', 'resolved']).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  adminNotes: z.string().max(500).optional()
});

// Submit feedback (public endpoint - no auth required)
router.post('/submit', async (req, res) => {
  try {
    const { email, complaint, rating } = feedbackSchema.parse(req.body);

    const feedback = new Feedback({
      email,
      complaint,
      rating: rating || 5
    });

    await feedback.save();

    res.status(201).json({
      message: 'Feedback submitted successfully',
      id: feedback._id
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: error.issues 
      });
    }
    console.error('Submit feedback error:', error);
    res.status(500).json({ error: 'Failed to submit feedback' });
  }
});

// Get all feedback (admin only)
router.get('/all', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string;
    const priority = req.query.priority as string;
    const skip = (page - 1) * limit;

    // Build filter
    const filter: any = {};
    if (status) filter.status = status;
    if (priority) filter.priority = priority;

    const feedback = await Feedback.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Feedback.countDocuments(filter);

    // Get stats
    const stats = await Promise.all([
      Feedback.countDocuments({ status: 'open' }),
      Feedback.countDocuments({ status: 'in_progress' }),
      Feedback.countDocuments({ status: 'resolved' }),
      Feedback.countDocuments({ priority: 'high' })
    ]);

    res.json({
      feedback: feedback.map(f => ({
        id: f._id,
        email: f.email,
        complaint: f.complaint,
        rating: f.rating || 5,
        status: f.status,
        priority: f.priority,
        createdAt: f.createdAt,
        resolvedAt: f.resolvedAt,
        adminNotes: f.adminNotes
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      stats: {
        open: stats[0],
        inProgress: stats[1],
        resolved: stats[2],
        highPriority: stats[3]
      }
    });
  } catch (error) {
    console.error('Get feedback error:', error);
    res.status(500).json({ error: 'Failed to get feedback' });
  }
});

// Update feedback (admin only)
router.put('/:id', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const feedbackId = req.params.id;
    const updates = updateFeedbackSchema.parse(req.body);

    const feedback = await Feedback.findById(feedbackId);
    if (!feedback) {
      return res.status(404).json({ error: 'Feedback not found' });
    }

    // Update fields
    if (updates.status) feedback.status = updates.status;
    if (updates.priority) feedback.priority = updates.priority;
    if (updates.adminNotes !== undefined) feedback.adminNotes = updates.adminNotes;

    // Set resolved date if status changed to resolved
    if (updates.status === 'resolved' && feedback.status !== 'resolved') {
      feedback.resolvedAt = new Date();
    }

    await feedback.save();

    res.json({
      message: 'Feedback updated successfully',
      feedback: {
        id: feedback._id,
        email: feedback.email,
        complaint: feedback.complaint,
        rating: feedback.rating || 5,
        status: feedback.status,
        priority: feedback.priority,
        createdAt: feedback.createdAt,
        resolvedAt: feedback.resolvedAt,
        adminNotes: feedback.adminNotes
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: error.issues 
      });
    }
    console.error('Update feedback error:', error);
    res.status(500).json({ error: 'Failed to update feedback' });
  }
});

// Delete feedback (admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const feedbackId = req.params.id;

    const feedback = await Feedback.findByIdAndDelete(feedbackId);
    if (!feedback) {
      return res.status(404).json({ error: 'Feedback not found' });
    }

    res.json({
      message: 'Feedback deleted successfully',
      deletedFeedback: {
        id: feedback._id,
        email: feedback.email
      }
    });
  } catch (error) {
    console.error('Delete feedback error:', error);
    res.status(500).json({ error: 'Failed to delete feedback' });
  }
});

export default router;