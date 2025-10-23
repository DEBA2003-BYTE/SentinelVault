import express from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { authenticateToken, type AuthRequest } from '../middleware/auth';
import { assessRisk, enforceRiskPolicy,type RiskRequest } from '../middleware/riskAssessment';
import { File } from '../models/File';
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
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('File type not allowed'));
    }
  }
});

// Upload file
router.post('/upload', 
  authenticateToken, 
  assessRisk, 
  enforceRiskPolicy(60), // Lower risk threshold for uploads
  upload.single('file'), 
  async (req: RiskRequest, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file provided' });
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

      // Log the upload
      await new AccessLog({
        userId,
        fileId: file._id,
        action: 'upload',
        riskScore: req.riskScore || 0,
        ipAddress: req.riskData?.ipAddress || 'unknown',
        userAgent: req.riskData?.userAgent,
        deviceFingerprint: req.riskData?.deviceFingerprint,
        location: req.riskData?.location,
        allowed: true
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
    const files = await File.find({ userId }).select('-s3Key').sort({ uploadedAt: -1 });

    res.json({
      files: files.map(file => ({
        id: file._id,
        filename: file.originalName,
        size: file.size,
        mimeType: file.mimeType,
        uploadedAt: file.uploadedAt,
        accessCount: file.accessCount
      }))
    });
  } catch (error) {
    console.error('Get files error:', error);
    res.status(500).json({ error: 'Failed to get files' });
  }
});

// Download file
router.get('/:id', 
  authenticateToken, 
  assessRisk, 
  enforceRiskPolicy(80), // Higher risk threshold for downloads
  async (req: RiskRequest, res) => {
    try {
      const fileId = req.params.id;
      const userId = req.user!.id;

      // Find file
      const file = await File.findOne({ _id: fileId, userId });
      if (!file) {
        return res.status(404).json({ error: 'File not found' });
      }

      // Generate presigned URL for secure download
      const downloadUrl = generatePresignedUrl(file.s3Key, 300); // 5 minutes

      // Update access count
      file.accessCount += 1;
      await file.save();

      // Log the download
      await new AccessLog({
        userId,
        fileId: file._id,
        action: 'download',
        riskScore: req.riskScore || 0,
        ipAddress: req.riskData?.ipAddress || 'unknown',
        userAgent: req.riskData?.userAgent,
        deviceFingerprint: req.riskData?.deviceFingerprint,
        location: req.riskData?.location,
        allowed: true
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

      // Log the deletion
      await new AccessLog({
        userId,
        fileId: file._id,
        action: 'delete',
        riskScore: req.riskScore || 0,
        ipAddress: req.riskData?.ipAddress || 'unknown',
        userAgent: req.riskData?.userAgent,
        deviceFingerprint: req.riskData?.deviceFingerprint,
        location: req.riskData?.location,
        allowed: true
      }).save();

      res.json({ message: 'File deleted successfully' });
    } catch (error) {
      console.error('Delete error:', error);
      res.status(500).json({ error: 'Delete failed' });
    }
  }
);

export default router;