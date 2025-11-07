# 🚀 Enhanced Backend Setup Guide

## Prerequisites

1. **Bun Runtime**: Install from [bun.sh](https://bun.sh)
2. **MongoDB**: Either local installation or MongoDB Atlas
3. **AWS S3**: Bucket and IAM credentials
4. **OPA (Optional)**: For policy enforcement

## Quick Start

### 1. Install Dependencies
```bash
cd backend
bun install
```

### 2. Environment Configuration
Copy and configure your environment variables:
```bash
cp .env.example .env
```

Update `.env` with your actual values:
```env
# Server
PORT=3000
NODE_ENV=development

# Database - Use your MongoDB connection string
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/cloud-storage

# JWT Secret - Generate a secure secret
JWT_SECRET=your-super-secure-jwt-secret-here

# Admin User
ADMIN_EMAIL=your-admin@email.com
ADMIN_PASSWORD=SecureAdmin123!

# AWS S3 - Your AWS credentials and bucket
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=your-aws-region
AWS_S3_BUCKET=your-s3-bucket-name

# OPA (Optional - for policy enforcement)
OPA_URL=http://localhost:8181

# ZKP (Future expansion)
ZKP_CIRCUIT_PATH=zkp/circuits
ZKP_VERIFIER_KEY=zkp/verifier_key.json

# SSI (Future expansion)
SSI_PROVIDER=did:web
```

### 3. Start OPA (Optional but Recommended)
```bash
# Start OPA with Docker
docker-compose -f docker-compose.opa.yml up -d

# Or install OPA binary and run
opa run --server --addr=0.0.0.0:8181
```

### 4. Create Admin User
```bash
bun run create-admin
```

### 5. Initialize Policies
```bash
bun run init-policies
```

### 6. Start the Backend
```bash
bun run dev
```

## 🧪 Testing the New Features

### Test ZKP Endpoints
```bash
# Generate a proof
curl -X POST http://localhost:3000/api/zkp/generate \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"secret": "test-secret", "publicValue": "test-public"}'

# Verify a proof
curl -X POST http://localhost:3000/api/zkp/verify \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"proof": "PROOF_STRING", "publicSignals": ["signal1", "signal2"]}'
```

### Test Policy Endpoints
```bash
# Evaluate a policy
curl -X POST http://localhost:3000/api/policy/evaluate \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action": "login", "context": {"location": "New York"}}'

# Get policy rules (admin only)
curl -X GET http://localhost:3000/api/policy/rules \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"
```

### Enhanced Authentication
```bash
# Register with ZKP proof and device fingerprinting
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securepassword",
    "deviceFingerprint": "device123",
    "location": "New York, US",
    "zkpProof": {
      "proof": "proof-string",
      "publicSignals": ["signal1"]
    }
  }'

# Login with enhanced context
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securepassword",
    "deviceFingerprint": "device123",
    "location": "New York, US"
  }'
```

## 🔧 Troubleshooting

### MongoDB Connection Issues
- Ensure your MongoDB URI is correct
- Check network connectivity
- Verify MongoDB Atlas IP whitelist (if using Atlas)

### AWS S3 Permission Issues
- Verify IAM user has S3 permissions
- Check bucket policy
- Ensure correct region configuration

### OPA Not Running
- The backend works without OPA (fail-safe mode)
- Start OPA with Docker: `docker-compose -f docker-compose.opa.yml up -d`
- Check OPA logs: `docker logs opa-container`

## 📊 New Features Available

### ✅ Implemented
- **Zero-Knowledge Proofs**: Basic proof generation and verification
- **Open Policy Agent**: Policy-as-code enforcement
- **Enhanced Risk Assessment**: Device and location tracking
- **Transparent Rejections**: Human-readable denial reasons
- **Admin Analytics**: ZKP and OPA statistics

### 🔄 Enhanced Endpoints
- All existing endpoints now include OPA policy checks
- Authentication includes ZKP verification
- File operations have enhanced security
- Admin dashboard shows new metrics

### 📈 Monitoring
- Check `/api/admin/stats` for security metrics
- View `/api/admin/audit` for detailed logs with OPA decisions
- Monitor ZKP verification rates and policy denials

## 🚀 Production Deployment

1. **Set NODE_ENV=production**
2. **Use strong JWT secrets**
3. **Configure proper MongoDB replica set**
4. **Set up OPA in high-availability mode**
5. **Implement proper AWS IAM roles**
6. **Enable MongoDB and application logging**
7. **Set up monitoring and alerting**

The enhanced backend is now ready with enterprise-grade security features!