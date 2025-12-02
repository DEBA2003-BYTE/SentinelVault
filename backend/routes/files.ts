import express from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import mongoose from 'mongoose';
import { authenticateToken, type AuthRequest } from '../middleware/auth';
import { assessRisk, enforceRiskPolicy,type RiskRequest } from '../middleware/riskAssessment';
import { File } from '../models/File';
import { User } from '../models/User';
import { AccessLog } from '../models/AccessLog';
import { uploadToS3, downloadFromS3, deleteFromS3, generatePresignedUrl } from '../utils/s3';

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow common file types
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/gif',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv'
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      // Return false instead of throwing error
      cb(null, false);
    }
  }
});

// Upload file
router.post('/upload', 
  authenticateToken, 
  assessRisk, 
  enforceRiskPolicy(60), // Lower risk threshold for uploads
  (req, res, next) => {
    upload.single('file')(req, res, (err) => {
      if (err) {
        if (err.message === 'File type not allowed') {
          return res.status(400).json({ error: 'File type not allowed. Please upload PDF, images, text files, or Office documents.' });
        }
        return res.status(400).json({ error: err.message });
      }
      next();
    });
  },
  async (req: RiskRequest, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file provided or file type not allowed' });
      }

      const userId = req.user!.id;
      const fileId = uuidv4();
      const s3Key = `${userId}/${fileId}-${req.file.originalname}`;

      // Upload to S3
      const uploadResult = await uploadToS3(
        req.file.buffer,
        s3Key,
        req.file.mimetype
      );

      // Save file metadata to database
      const file = new File({
        userId,
        filename: `${fileId}-${req.file.originalname}`,
        originalName: req.file.originalname,
        s3Key,
        size: req.file.size,
        mimeType: req.file.mimetype
      });

      await file.save();

      // Log the upload with user's GPS location
      const user = await User.findById(userId);
      await new AccessLog({
        userId,
        fileId: file._id,
        action: 'upload',
        riskScore: req.riskScore || 0,
        location: user?.gpsLocation || req.riskData?.location,
        allowed: true,
        userEmail: user?.email
      }).save();

      res.status(201).json({
        message: 'File uploaded successfully',
        file: {
          id: file._id,
          filename: file.originalName,
          size: file.size,
          mimeType: file.mimeType,
          uploadedAt: file.uploadedAt
        },
        riskScore: req.riskScore
      });
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ error: 'Upload failed' });
    }
  }
);

// Get user files
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    
    // Get user's email to check shared files
    // We need to get the user model to access email
    const User = mongoose.model('User');
    const currentUser = await User.findById(userId);
    const userEmail = currentUser?.email;
    
    // Get owned files
    const ownedFiles = await File.find({ userId }).select('-s3Key').sort({ uploadedAt: -1 });
    
    // Get files shared with this user
    const sharedFiles: any[] = [];
    if (userEmail) {
      const files = await File.find({
        $or: [
          { visibility: 'all' },
          { visibility: 'specific', sharedWith: userEmail }
        ],
        userId: { $ne: userId } // Exclude own files
      }).select('-s3Key').sort({ uploadedAt: -1 });
      sharedFiles.push(...files);
    }
    
    // Combine and mark files as owned or shared
    const allFiles = [
      ...ownedFiles.map(file => ({ ...file.toObject(), isOwned: true })),
      ...sharedFiles.map(file => ({ ...file.toObject(), isOwned: false }))
    ].sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
    
    res.json({
      files: allFiles.map(file => ({
        id: file._id,
        filename: file.originalName,
        size: file.size,
        mimeType: file.mimeType,
        uploadedAt: file.uploadedAt,
        accessCount: file.accessCount,
        visibility: file.visibility,
        sharedWith: file.sharedWith,
        isOwned: file.isOwned
      }))
    });
  } catch (error) {
    console.error('Get files error:', error);
    res.status(500).json({ error: 'Failed to get files' });
  }
});

// Download file (proxy endpoint to avoid CORS)
router.get('/:id/download', 
  authenticateToken, 
  async (req: AuthRequest, res) => {
    try {
      const fileId = req.params.id;
      const userId = req.user!.id;

      // Get user's email to check sharing permissions
      const User = mongoose.model('User');
      const currentUser = await User.findById(userId);
      const userEmail = currentUser?.email;

      // Find file (either owned or shared)
      const file = await File.findById(fileId);
      if (!file) {
        return res.status(404).json({ error: 'File not found' });
      }

      // Check if user has permission to download this file
      const isOwner = file.userId.toString() === userId;
      const canAccess = isOwner || 
        file.visibility === 'all' || 
        (file.visibility === 'specific' && userEmail && file.sharedWith.includes(userEmail));
      
      if (!canAccess) {
        return res.status(403).json({ error: 'You do not have permission to access this file' });
      }

      // Generate presigned URL for secure download
      const downloadUrl = generatePresignedUrl(file.s3Key, 300); // 5 minutes

      // Stream the file from S3 to the client
      try {
        const response = await fetch(downloadUrl);
        if (!response.ok) {
          throw new Error('Failed to fetch file from S3');
        }

        // Set appropriate headers
        res.setHeader('Content-Type', file.mimeType || 'application/octet-stream');
        res.setHeader('Content-Disposition', `attachment; filename="${file.originalName}"`);
        res.setHeader('Content-Length', file.size.toString());

        // Stream the file content
        const buffer = await response.arrayBuffer();
        res.send(Buffer.from(buffer));

        // Update access count
        file.accessCount += 1;
        await file.save();

        // Log the download with user's GPS location
        const user = await User.findById(userId);
        await new AccessLog({
          userId,
          fileId: file._id,
          action: 'download',
          riskScore: 0,
          location: user?.gpsLocation,
          allowed: true,
          userEmail: user?.email
        }).save();

      } catch (fetchError) {
        console.error('S3 fetch error:', fetchError);
        res.status(500).json({ error: 'Failed to download file' });
      }
    } catch (error) {
      console.error('Download proxy error:', error);
      res.status(500).json({ error: 'Download failed' });
    }
  }
);

// Download file info (returns presigned URL)
router.get('/:id', 
  authenticateToken, 
  assessRisk, 
  enforceRiskPolicy(80), // Higher risk threshold for downloads
  async (req: RiskRequest, res) => {
    try {
      const fileId = req.params.id;
      const userId = req.user!.id;

      // Get user's email to check sharing permissions
      const User = mongoose.model('User');
      const currentUser = await User.findById(userId);
      const userEmail = currentUser?.email;

      // Find file (either owned or shared)
      const file = await File.findById(fileId);
      if (!file) {
        return res.status(404).json({ error: 'File not found' });
      }

      // Check if user has permission to download this file
      const isOwner = file.userId.toString() === userId;
      const canAccess = isOwner || 
        file.visibility === 'all' || 
        (file.visibility === 'specific' && userEmail && file.sharedWith.includes(userEmail));

      if (!canAccess) {
        return res.status(403).json({ error: 'You do not have permission to access this file' });
      }

      // Generate presigned URL for secure download
      const downloadUrl = generatePresignedUrl(file.s3Key, 300); // 5 minutes

      // Update access count
      file.accessCount += 1;
      await file.save();

      // Log the download with user's GPS location
      const downloadUser = await User.findById(userId);
      await new AccessLog({
        userId,
        fileId: file._id,
        action: 'download',
        riskScore: req.riskScore || 0,
        location: downloadUser?.gpsLocation || req.riskData?.location,
        allowed: true,
        userEmail: downloadUser?.email
      }).save();

      res.json({
        downloadUrl,
        filename: file.originalName,
        size: file.size,
        mimeType: file.mimeType,
        expiresIn: 300 // seconds
      });
    } catch (error) {
      console.error('Download error:', error);
      res.status(500).json({ error: 'Download failed' });
    }
  }
);

// Share file
router.put('/:id/share', 
  authenticateToken, 
  assessRisk, 
  enforceRiskPolicy(60),
  async (req: RiskRequest, res) => {
    try {
      const fileId = req.params.id;
      const userId = req.user!.id;
      const { visibility, sharedWith } = req.body;

      // Validate visibility
      if (!['all', 'specific', 'none'].includes(visibility)) {
        return res.status(400).json({ error: 'Invalid visibility option' });
      }

      // If sharing with specific users, validate emails
      if (visibility === 'specific' && (!sharedWith || !Array.isArray(sharedWith))) {
        return res.status(400).json({ error: 'sharedWith must be an array of emails when visibility is specific' });
      }

      // Find file
      const file = await File.findOne({ _id: fileId, userId });
      if (!file) {
        return res.status(404).json({ error: 'File not found' });
      }

      // Update sharing settings
      file.visibility = visibility;
      file.sharedWith = visibility === 'specific' ? sharedWith : [];

      await file.save();

      // Log the sharing action with user's GPS location
      const user = await User.findById(userId);
      await new AccessLog({
        userId,
        fileId: file._id,
        action: 'share',
        riskScore: req.riskScore || 0,
        location: user?.gpsLocation || req.riskData?.location,
        allowed: true,
        userEmail: user?.email
      }).save();

      res.json({
        message: 'File sharing settings updated successfully',
        visibility: file.visibility,
        sharedWith: file.sharedWith
      });
    } catch (error) {
      console.error('Share error:', error);
      res.status(500).json({ error: 'Share operation failed' });
    }
  }
);

// Delete file
router.delete('/:id', 
  authenticateToken, 
  assessRisk, 
  enforceRiskPolicy(70),
  async (req: RiskRequest, res) => {
    try {
      const fileId = req.params.id;
      const userId = req.user!.id;

      // Find file
      const file = await File.findOne({ _id: fileId, userId });
      if (!file) {
        return res.status(404).json({ error: 'File not found' });
      }

      // Delete from S3
      await deleteFromS3(file.s3Key);

      // Delete from database
      await File.findByIdAndDelete(fileId);

      // Log the deletion with user's GPS location
      const deleteUser = await User.findById(userId);
      await new AccessLog({
        userId,
        fileId: file._id,
        action: 'delete',
        riskScore: req.riskScore || 0,
        location: deleteUser?.gpsLocation || req.riskData?.location,
        allowed: true,
        userEmail: deleteUser?.email
      }).save();

      res.json({ message: 'File deleted successfully' });
    } catch (error) {
      console.error('Delete error:', error);
      res.status(500).json({ error: 'Delete failed' });
    }
  }
);

export default router;