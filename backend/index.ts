import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import authRoutes from './routes/auth';
import fileRoutes from './routes/files';
import riskRoutes from './routes/risk';
import adminRoutes from './routes/admin';
import policyRoutes from './routes/policy';
import zkpRoutes from './routes/zkp';
import feedbackRoutes from './routes/feedback';
import zkLoginRoutes from './routes/zkLogin';
import zkMFARoutes from './routes/zkMFA';
import riskEvaluationRoutes from './routes/riskEvaluation';
import { opaService } from './utils/opa';
import { checkDatabaseConnection, gracefulDatabaseError } from './middleware/dbCheck';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Database connection check middleware
app.use(checkDatabaseConnection);

// Enhanced MongoDB connection with better error handling
const connectToMongoDB = async (retries = 3) => {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/cloud-storage';
  
  // Enhanced connection options (compatible with Mongoose 8.x)
  const connectionOptions = {
    serverSelectionTimeoutMS: 15000, // 15 seconds for Atlas
    socketTimeoutMS: 45000,
    family: 4, // Use IPv4, skip trying IPv6
    maxPoolSize: 10,
    minPoolSize: 2,
    maxIdleTimeMS: 30000,
    bufferCommands: false, // Disable buffering to fail fast
  };

  for (let i = 0; i < retries; i++) {
    try {
      console.log(`Attempting MongoDB connection (${i + 1}/${retries})...`);
      await mongoose.connect(mongoUri, connectionOptions);
      console.log('✅ Connected to MongoDB successfully');
      
      // Test the connection
      if (mongoose.connection.db) {
        await mongoose.connection.db.admin().ping();
        console.log('✅ MongoDB ping successful');
      }
      
      // Initialize OPA policies (non-blocking)
      initializeOPA();
      return;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`❌ MongoDB connection attempt ${i + 1} failed:`, errorMessage);
      
      if (i === retries - 1) {
        console.error(`💥 Failed to connect to MongoDB after ${retries} attempts`);
        console.log('🔄 Server will continue without database - some features may be limited');
        console.log('💡 Check your MongoDB Atlas connection string and IP whitelist');
      } else {
        const waitTime = Math.min((i + 1) * 2000, 10000); // Max 10 seconds
        console.log(`⏳ Retrying in ${waitTime/1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }
};

// Separate OPA initialization function
const initializeOPA = async () => {
  try {
    console.log('🔄 Initializing OPA policies...');
    await opaService.createDefaultPolicies();
    console.log('✅ OPA policies initialized successfully');
  } catch (error) {
    console.log('⚠️  OPA initialization failed - continuing without policy enforcement');
    console.log('💡 To enable OPA: docker run -p 8181:8181 openpolicyagent/opa:latest run --server');
  }
};

connectToMongoDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/risk', riskRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/policy', policyRoutes);
app.use('/api/zkp', zkpRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/zk-login', zkLoginRoutes);
app.use('/api/zk-mfa', zkMFARoutes);
app.use('/api/risk-evaluation', riskEvaluationRoutes);

// Enhanced health check
app.get('/health', async (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  
  // Check OPA health
  let opaStatus = 'unavailable';
  try {
    const opaHealthy = await opaService.isOPAHealthy();
    opaStatus = opaHealthy ? 'healthy' : 'unhealthy';
  } catch (error) {
    opaStatus = 'error';
  }
  
  const healthData = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    services: {
      api: 'running',
      mongodb: {
        status: dbStatus,
        readyState: mongoose.connection.readyState,
        host: mongoose.connection.host || 'unknown'
      },
      opa: {
        status: opaStatus,
        url: process.env.OPA_URL || 'http://localhost:8181',
        required: false
      }
    },
    environment: process.env.NODE_ENV || 'development'
  };
  
  // Set appropriate status code
  const overallHealthy = dbStatus === 'connected';
  res.status(overallHealthy ? 200 : 503).json(healthData);
});

// Database error handling middleware
app.use(gracefulDatabaseError);

// General error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});