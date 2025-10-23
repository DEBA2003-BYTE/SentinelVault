# Risk-Adaptive Cloud Storage Backend

A secure backend API built with Bun, Express.js, and MongoDB that provides risk-based access control for cloud file storage.

## Features

- **Risk-based Authentication**: Dynamic access control based on user behavior, device fingerprints, and location
- **Secure File Storage**: AWS S3 integration with encrypted uploads and presigned download URLs
- **Admin Dashboard**: User management, audit logs, and system monitoring
- **Zero-trust Architecture**: Every request is evaluated for risk before granting access

## Tech Stack

- **Runtime**: Bun
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Storage**: AWS S3
- **Authentication**: JWT tokens
- **Validation**: Zod schemas

## Quick Start

1. **Install dependencies**:
   ```bash
   bun install
   ```

2. **Setup environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your actual values
   ```

3. **Start MongoDB** (if running locally):
   ```bash
   mongod
   ```

4. **Run the server**:
   ```bash
   bun run dev
   ```

The server will start on `http://localhost:3000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login with risk assessment
- `GET /api/auth/me` - Get current user info
- `POST /api/auth/logout` - User logout

### File Management
- `POST /api/files/upload` - Upload file to S3
- `GET /api/files` - List user files
- `GET /api/files/:id` - Download file (presigned URL)
- `DELETE /api/files/:id` - Delete file

### Risk Assessment
- `POST /api/risk/evaluate` - Get current risk score
- `GET /api/risk/policies` - View risk policies

### Admin (Admin users only)
- `GET /api/admin/users` - List all users
- `POST /api/admin/users/:id/block` - Block/unblock user
- `GET /api/admin/audit` - View audit logs
- `GET /api/admin/stats` - System statistics

## Risk Scoring

The system evaluates risk based on:
- IP address reputation
- Device fingerprinting
- Geographic location
- Recent failed attempts
- User agent analysis

Risk thresholds:
- **Login**: Max 80 points
- **File Upload**: Max 60 points
- **File Download**: Max 80 points
- **File Delete**: Max 70 points

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 3000 |
| `MONGODB_URI` | MongoDB connection string | mongodb://localhost:27017/cloud-storage |
| `JWT_SECRET` | JWT signing secret | Required |
| `ADMIN_EMAIL` | First admin user email | Required |
| `AWS_ACCESS_KEY_ID` | AWS access key | Required |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key | Required |
| `AWS_REGION` | AWS region | us-east-1 |
| `AWS_S3_BUCKET` | S3 bucket name | Required |

## Development

- `bun run dev` - Start with hot reload
- `bun run start` - Start production server
- `bun run build` - Build for production

## Security Features

- Password hashing with bcrypt
- JWT token authentication
- Request rate limiting via risk scores
- Encrypted file storage on S3
- Comprehensive audit logging
- Admin-only endpoints protection

## Database Schema

### Users
- Email, password hash, admin status
- Block status and login tracking
- Zero-knowledge proof data (future)

### Files
- User ownership, S3 keys, metadata
- Access count tracking
- MIME type validation

### Access Logs
- All user actions with risk scores
- IP addresses, device fingerprints
- Success/failure tracking with reasons