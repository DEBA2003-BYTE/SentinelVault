# Backend Implementation - Risk-Adaptive Cloud Storage

## Tech Stack
- **Runtime**: Bun
- **Framework**: Express.js + TypeScript
- **Database**: MongoDB with Mongoose
- **Storage**: AWS S3
- **Auth**: JWT tokens + bcrypt password hashing
- **Validation**: Zod schemas
- **File Upload**: Multer middleware

## Implemented API Endpoints

### Authentication (`/api/auth`)
- `POST /api/auth/register` - User registration with risk assessment
- `POST /api/auth/login` - User login with risk scoring
- `GET /api/auth/me` - Get current user information
- `POST /api/auth/logout` - User logout

### File Management (`/api/files`)
- `POST /api/files/upload` - Upload file to S3 with risk check (max 100MB)
- `GET /api/files` - List user's files with metadata
- `GET /api/files/:id` - Get presigned download URL
- `DELETE /api/files/:id` - Delete file from S3 and database

### Risk Assessment (`/api/risk`)
- `POST /api/risk/evaluate` - Get current risk score and factors
- `GET /api/risk/policies` - View risk thresholds and policies

### Admin (`/api/admin`)
- `GET /api/admin/users` - List all users with statistics
- `POST /api/admin/users/:id/block` - Block/unblock user
- `GET /api/admin/audit` - View audit logs with filtering
- `GET /api/admin/stats` - System statistics and metrics

### Health Check
- `GET /health` - Server health status

## Database Schema (Mongoose Models)

### Users Collection
```typescript
{
  _id: ObjectId,
  email: string,           // Unique, lowercase, trimmed
  passwordHash: string,    // bcrypt hashed password
  isBlocked: boolean,      // Default: false
  isAdmin: boolean,        // Default: false
  zkProofData?: object,    // Optional, for future ZK implementation
  createdAt: Date,         // Auto-generated
  lastLogin?: Date         // Updated on successful login
}
```

### Files Collection
```typescript
{
  _id: ObjectId,
  userId: ObjectId,        // Reference to User
  filename: string,        // Generated filename with UUID
  originalName: string,    // User's original filename
  s3Key: string,          // Unique S3 object key
  size: number,           // File size in bytes
  mimeType: string,       // File MIME type
  uploadedAt: Date,       // Auto-generated
  accessCount: number     // Download counter, default: 0
}
```

### AccessLogs Collection
```typescript
{
  _id: ObjectId,
  userId: ObjectId,           // Reference to User
  fileId?: ObjectId,          // Reference to File (optional)
  action: 'upload' | 'download' | 'delete' | 'login' | 'register',
  riskScore: number,          // 0-100 risk score
  deviceFingerprint?: string, // Browser fingerprint
  ipAddress: string,          // Client IP address
  location?: string,          // Geographic location
  userAgent?: string,         // Browser user agent
  timestamp: Date,            // Auto-generated
  allowed: boolean,           // Whether action was permitted
  reason?: string             // Reason for denial (if applicable)
}
```

## Risk Assessment System

### Risk Factors
- **IP Address Analysis**: Detects Tor/proxy usage (+30 points)
- **Failed Attempts**: Recent failures (+5 points each)
- **User Agent**: Non-standard browsers (+10 points)
- **Location**: VPN/Unknown locations (+15 points)
- **Maximum Score**: Capped at 100 points

### Risk Thresholds
- **Login**: 80 points maximum
- **File Upload**: 60 points maximum  
- **File Download**: 80 points maximum
- **File Delete**: 70 points maximum

### Supported File Types
- PDF documents
- Images (JPEG, PNG, GIF)
- Text files
- Microsoft Word documents
- Maximum file size: 100MB

## Security Features

### Authentication & Authorization
- JWT tokens with 24-hour expiration
- bcrypt password hashing (12 rounds)
- Admin-only endpoint protection
- Automatic user blocking system

### File Security
- Server-side encryption (AES256) on S3
- Presigned URLs for secure downloads (5-minute expiry)
- File type validation and size limits
- User-isolated storage paths

### Audit & Monitoring
- Comprehensive access logging
- Risk score tracking for all actions
- Failed attempt monitoring
- Admin audit trail with pagination

## Development Setup

### Prerequisites
- Bun runtime
- MongoDB instance
- AWS S3 bucket with proper IAM permissions

### Installation
```bash
cd backend
bun install
cp .env.example .env
# Edit .env with your configuration
bun run dev
```

### Create Admin User
```bash
bun run create-admin
```

## Environment Variables
```bash
# Server Configuration
PORT=3000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/cloud-storage

# JWT Authentication
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Admin User (first user with this email becomes admin)
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=admin123456  # For create-admin script

# AWS S3 Configuration
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-s3-bucket-name
```

## API Response Examples

### Successful Login
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "isAdmin": false
  },
  "riskScore": 25
}
```

### File Upload Response
```json
{
  "message": "File uploaded successfully",
  "file": {
    "id": "507f1f77bcf86cd799439012",
    "filename": "document.pdf",
    "size": 1024000,
    "mimeType": "application/pdf",
    "uploadedAt": "2024-01-15T10:30:00.000Z"
  },
  "riskScore": 15
}
```

### Risk Assessment Response
```json
{
  "riskScore": 35,
  "riskLevel": "medium",
  "factors": {
    "ipAddress": "192.168.1.1",
    "location": "US",
    "deviceFingerprint": "abc123...",
    "recentFailures": 2
  },
  "recentActivity": [
    {
      "action": "login",
      "timestamp": "2024-01-15T10:00:00.000Z",
      "allowed": true,
      "riskScore": 30
    }
  ]
}
```