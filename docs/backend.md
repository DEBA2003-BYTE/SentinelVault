🧠 Backend Implementation – Risk-Adaptive Cloud Storage (Final Enhanced Version)
🎯 Objectives

Dynamic Risk-Adaptive Access Control System (RAdAC)
Integrate Open Policy Agent (OPA) for real-time policy-as-code enforcement, evaluating contextual data (device, location, user behavior, and risk) for adaptive authorization decisions across multi-cloud storage.

Privacy-Preserving Identity Verification
Implement Zero-Knowledge Proofs (ZKP) to securely validate user attributes (e.g., identity, trust level) without revealing sensitive data, ensuring confidential and compliant authentication.

Transparent User Experience
Introduce a Rejection Reason System to provide users with human-readable explanations when access is denied — e.g.,
“Your login location differs from your registration region” or “Device fingerprint mismatch.”

Unified, Scalable, and Auditable Architecture
Enable policy consistency across users, files, and operations, with full audit trails and adaptive, explainable security decisions.

🧰 Tech Stack
Category	Technology
Runtime	Bun
Framework	Express.js + TypeScript
Database	MongoDB (Mongoose ODM)
Storage	AWS S3
Authentication	JWT + bcrypt
Validation	Zod
Upload Handling	Multer
Policy Engine (New)	Open Policy Agent (OPA)
Privacy Layer (New)	Zero-Knowledge Proofs (Circom + SnarkJS)
Identity (New)	Self-Sovereign Identity (SSI) using DIDs
Transparency (New)	Rejection Reason Logging System
Risk Analytics (New)	Real-time device, geo, and behavior scoring
Device Authentication (New)	Advanced device fingerprinting and location validation
🧩 Implemented API Endpoints
🔐 Authentication (/api/auth)

POST /api/auth/register – Register with fingerprint and risk baseline.

POST /api/auth/login – Login with ZKP-enhanced authentication + risk evaluation.

GET /api/auth/me – Retrieve authenticated user info.

POST /api/auth/logout – Logout and invalidate token.

➕ New Enhancements

ZKP-Enhanced Authentication: Proof required for sensitive accounts.

SSI (DID) Integration: Decentralized identifier support.

OPA Context Enforcement: Every login event is checked against active OPA policy.

Rejection Reason System: Returns descriptive cause of denial (e.g., fingerprint mismatch, risky location).

Device Authentication: Comprehensive device fingerprinting with browser characteristics, screen resolution, timezone, and hardware details.

Location Verification: IP-based geolocation with automatic device registration and location anomaly detection.

📁 File Management (/api/files)

POST /api/files/upload – Upload file to S3 after OPA risk evaluation.

GET /api/files – Fetch files with metadata.

GET /api/files/:id – Retrieve presigned download URL.

DELETE /api/files/:id – Delete file from S3 and DB.

➕ New Enhancements

OPA File Policies: Validate access via OPA before upload/download/delete.

ZKP Access Tokens: File access gated by verified proofs.

Adaptive Encryption: Each file’s metadata is encrypted with user’s ZKP-derived key.

Transparent Rejection Reasons: If upload denied, return detailed policy explanation (e.g., “High risk: unverified device”).

⚖️ Risk Assessment (/api/risk)

POST /api/risk/evaluate – Calculate real-time risk score.

GET /api/risk/policies – Retrieve system policy thresholds.

➕ New Enhancements

Device + location correlation checks.

Behavioral deviation detection (anomalies).

OPA-assisted policy validation.

ZKP validation reduces user’s risk weight automatically.

🧩 Policy Engine (/api/policy) – New

POST /api/policy/evaluate – Evaluate any contextual request via OPA.

GET /api/policy/rules – Fetch and manage Rego-based policies.

Example Rego Policy
package accesscontrol

default allow = false

allow {
  input.user.verified == true
  input.riskScore < 50
}

deny_reason["High risk score"] {
  input.riskScore >= 50
}

deny_reason["Fingerprint mismatch"] {
  input.deviceFingerprint != input.registeredFingerprint
}

deny_reason["Location anomaly"] {
  input.location != input.registeredLocation
}


➡️ OPA response includes both allow and reason fields for full user transparency.

🔐 Zero-Knowledge Proof (/api/zkp) – New

POST /api/zkp/generate – Generate cryptographic proof.

POST /api/zkp/verify – Verify ZKP validity and mark user verified.

GET /api/zkp/status – Retrieve user’s proof status.

Flow:

Frontend generates ZKP proof.

Backend verifies it using Circom/SnarkJS verifier.

Verified status stored in Users.zkProofData.

Future OPA checks treat user as low-risk verified.

🔐 Multi-Factor Authentication (/api/zk-mfa) – New

GET /api/zk-mfa/factor-types – Get available biometric factor types.

GET /api/zk-mfa/factors – Get user's registered MFA factors.

POST /api/zk-mfa/register-secret – Register new biometric factor (fingerprint/face).

POST /api/zk-mfa/verify – Verify MFA factor during authentication.

DELETE /api/zk-mfa/factors/:factorType – Remove MFA factor.

Biometric Types:
- **Fingerprint Authentication**: Secure biometric authentication using fingerprint
- **Face Recognition**: Advanced facial recognition for secure access

Flow:

User captures biometric data (face/fingerprint) locally.

System generates cryptographic hash of biometric data.

Hash stored in user's mfaFactors array (never raw biometric data).

During authentication, biometric is re-captured and verified against stored hash.

🧑‍💼 Admin (/api/admin)

GET /api/admin/users – Fetch user list with proof & risk states.

POST /api/admin/users/:id/block – Block or unblock users.

GET /api/admin/audit – Retrieve full audit log with denial reasons.

GET /api/admin/stats – Risk + proof + OPA stats overview.

➕ New Enhancements

View ZKP verification history.

Inspect OPA policy decisions.

View top denial reasons (e.g., fingerprint mismatch rate).

Policy and rule visualization (admin-only editor).

🗃️ Database Schema (Mongoose Models)
🧑 Users Collection
{
  _id: ObjectId,
  email: string,
  passwordHash: string,
  isBlocked: boolean,
  isAdmin: boolean,
  zkProofData?: {
    proof: string,
    publicSignals: string[],
    verified: boolean,
    verifiedAt?: Date
  },
  mfaFactors?: [{
    type: string,
    secretHash: string,
    isActive: boolean,
    createdAt: Date,
    lastUsed?: Date,
    metadata?: any
  }],
  did?: string,
  deviceFingerprint?: string,
  registeredLocation?: string,
  lastKnownLocation?: string,
  lastDeviceFingerprint?: string,
  rejectionReasons?: string[],
  createdAt: Date,
  lastLogin?: Date
}

📦 Files Collection
{
  _id: ObjectId,
  userId: ObjectId,
  filename: string,
  originalName: string,
  s3Key: string,
  size: number,
  mimeType: string,
  uploadedAt: Date,
  accessCount: number,
  riskLevel?: 'low' | 'medium' | 'high',
  opaDecision?: 'allow' | 'deny',
  rejectionReason?: string
}

🧾 AccessLogs Collection
{
  _id: ObjectId,
  userId: ObjectId,
  fileId?: ObjectId,
  action: 'upload' | 'download' | 'delete' | 'login' | 'register' | 'verifyZKP' | 'policy_evaluation',
  riskScore: number,
  deviceFingerprint?: string,
  ipAddress: string,
  location?: string,
  userAgent?: string,
  timestamp: Date,
  allowed: boolean,
  reason?: string,          // Human-readable denial reason
  opaDecision?: 'allow' | 'deny'
}

🧮 Policies Collection (New)
{
  _id: ObjectId,
  name: string,
  description: string,
  policyCode: string,
  createdAt: Date,
  updatedAt: Date
}

🔎 Risk & Policy System
Risk Factors
Factor	Impact
IP Reputation	+30
Failed Logins	+5 each
Device Mismatch	+15
Location Mismatch	+15
Behavioral Deviation	+10–25
ZKP Failure	+40
Max Score	100
Risk Thresholds
Action	Max Allowed
Login	80
Upload	60
Download	80
Delete	70
OPA Enforcement	≥ 50
� Devuice Authentication System (New)

Device Fingerprinting Components
Component	Details
User Agent	Browser and OS identification
Screen Resolution	Display characteristics (width x height)
Color Depth	Display color capabilities
Pixel Ratio	Device pixel density
Timezone	User's timezone setting
Platform	Operating system platform
Language	Browser language preference
Accept Headers	Browser capability headers

Device Authentication Flow
1. Extract device characteristics from request headers and client info
2. Generate SHA-256 hash fingerprint from combined characteristics
3. Compare against registered device fingerprint in user profile
4. Calculate risk score based on device recognition status
5. Validate location consistency using IP geolocation
6. Log device access attempts with detailed context
7. Update user's device registration for trusted logins

Location Verification Process
1. Extract client IP address from request headers
2. Perform IP geolocation lookup (city, country, region)
3. Compare current location with registered location
4. Calculate location-based risk score
5. Flag location anomalies for security review
6. Update user's location history for analysis

Device Risk Scoring
Risk Factor	Score Impact	Description
Device Match	0 points	Recognized device fingerprint
Device Mismatch	+25 points	Unrecognized device characteristics
Location Match	0 points	Login from registered location
Location Anomaly	+20 points	Login from different country/region
New Device	+15 points	First-time device registration
Suspicious UA	+10 points	Unusual or modified user agent
VPN Detection	+20 points	VPN or proxy usage detected
Recent Failures	+5 per attempt	Recent failed login attempts

🔐 Security & Privacy Features
Authentication & Identity

JWT with 24h expiration

bcrypt password hashing

Advanced device fingerprinting with multi-factor validation

Location-based authentication with IP geolocation

ZKP verification to bypass password exposure

SSI (DID) for decentralized authentication

OPA policy enforcement for each route

Rejection reason returned when access denied

File Security

AES256 encryption on S3

Presigned URL (5-min validity)

OPA-enforced actions

Proof-required download for high-risk files

Transparency Layer (New)

rejectionReason field returned in API responses.

Stored in AccessLogs and visible to users in frontend.

Explains why an action was blocked:
Example:

{ 
  "message": "Access denied", 
  "reason": "Location mismatch – registered in Bangalore, accessed from Delhi"
}

⚙️ Development Setup
Prerequisites

Bun runtime

MongoDB

AWS S3 bucket

OPA agent (Docker or binary)

Circom + SnarkJS setup

Installation
cd backend
bun install
cp .env.example .env
bun run dev

## 👑 Admin Setup

### Creating Admin User
The system supports a fixed admin user configured via environment variables:

1. Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` in your `.env` file
2. Run the admin creation script:
```bash
bun run create-admin
```

### Admin Authentication
- **Registration**: Users can register with the admin email only if they provide the correct `ADMIN_PASSWORD`
- **Login**: Admin users can login with either:
  - Their hashed password (if they changed it after creation)
  - The fixed `ADMIN_PASSWORD` from environment variables

### Admin Features
- Access to admin dashboard and user management
- Policy management and OPA rule editing
- System analytics and audit logs
- Higher risk tolerance (70 vs 50 for regular users)

🔑 Environment Variables
PORT=3000
MONGODB_URI=mongodb://localhost:27017/cloud-storage
JWT_SECRET=super-secret
OPA_ENDPOINT=http://localhost:8181/v1/data/policy/evaluate
ZKP_CIRCUIT_PATH=zkp/circuits
ZKP_VERIFIER_KEY=zkp/verifier_key.json
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_S3_BUCKET=your-s3-bucket
SSI_PROVIDER=did:web

# Admin Configuration
ADMIN_EMAIL=admin@gmail.com
ADMIN_PASSWORD=SecureAdmin123!

🧩 API Response Examples
✅ Login (OPA + ZKP + Reason Transparency)
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "zkpVerified": true
  },
  "riskScore": 25,
  "opaDecision": "allow"
}

❌ Login Denied Example
{
  "message": "Access denied",
  "opaDecision": "deny",
  "reason": "Device fingerprint mismatch – unrecognized device used",
  "riskScore": 88
}

✅ File Upload (OPA + Risk Evaluation)
{
  "message": "File uploaded successfully",
  "file": {
    "id": "507f1f77bcf86cd799439012",
    "filename": "report.pdf",
    "size": 1048576
  },
  "riskScore": 15,
  "opaDecision": "allow"
}

✅ ZKP Verification Response
{
  "message": "ZKP verified successfully",
  "verified": true,
  "timestamp": "2025-11-01T10:00:00.000Z"
}

✅ Summary of Enhancements
Feature	Description
OPA Integration	Real-time policy evaluation for all endpoints
ZKP Verification	Secure, privacy-preserving authentication
SSI Support	Decentralized identity (DID-based)
Rejection Reason System	Human-readable denial explanations
Adaptive Risk Scoring	Context-aware analytics with behavioral signals
Full Audit Trail	Tracks OPA, ZKP, and risk outcomes
Backward Compatibility	Original APIs preserved, extended via middleware