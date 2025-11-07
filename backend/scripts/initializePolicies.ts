import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { Policy } from '../models/Policy';
import { opaService } from '../utils/opa';

dotenv.config();

const defaultPolicies = [
  {
    name: 'Basic Access Control',
    description: 'Risk-based access control policy - Lower risk scores are better',
    policyCode: `
package accesscontrol

default allow = true

# DENY if risk score is TOO HIGH (lower risk scores are better)
deny {
  input.riskScore > 80
  not input.user.isAdmin
}

# DENY if risk score is high for non-ZKP users
deny {
  input.riskScore > 60
  not input.user.zkpVerified
  not input.user.isAdmin
}

# ALLOW if user is verified (default is allow)
allow {
  input.user.verified == true
}

# ALLOW admin users even with higher risk
allow {
  input.user.isAdmin == true
  input.riskScore <= 90
}

# ALLOW ZKP verified users with better risk tolerance
allow {
  input.user.zkpVerified == true
  input.riskScore <= 70
}

# ALLOW low risk users (0-50 is low risk, should always be allowed)
allow {
  input.riskScore <= 50
}

# Deny reasons for transparency
deny_reason["High risk score detected"] {
  input.riskScore > 80
  not input.user.isAdmin
}

deny_reason["Elevated risk for unverified user"] {
  input.riskScore > 60
  not input.user.zkpVerified
  not input.user.isAdmin
}

deny_reason["Device fingerprint mismatch"] {
  input.deviceFingerprint != input.registeredFingerprint
  input.registeredFingerprint != null
  input.registeredFingerprint != ""
}

deny_reason["Location anomaly detected"] {
  input.location != input.registeredLocation
  input.registeredLocation != null
  input.registeredLocation != ""
  input.action == "login"
}

deny_reason["Unverified user account"] {
  input.user.verified == false
}

# Risk factors for analysis
risk_factors["suspicious_location"] {
  input.location != input.registeredLocation
  input.registeredLocation != null
}

risk_factors["device_mismatch"] {
  input.deviceFingerprint != input.registeredFingerprint
  input.registeredFingerprint != null
}

risk_factors["elevated_risk_score"] {
  input.riskScore > 50
}

risk_factors["high_risk_score"] {
  input.riskScore > 70
}
`
  },
  {
    name: 'File Access Policy',
    description: 'Policy for file upload/download operations',
    policyCode: `
package fileaccess

default allow = false

# Allow file operations for verified users with low risk
allow {
  input.user.verified == true
  input.riskScore < 60
  input.action in ["upload", "download", "delete"]
}

# Stricter policy for file deletion
allow {
  input.user.verified == true
  input.riskScore < 40
  input.action == "delete"
}

# ZKP verified users get more lenient file access
allow {
  input.user.zkpVerified == true
  input.riskScore < 70
  input.action in ["upload", "download"]
}

deny_reason["High risk for file operation"] {
  input.riskScore >= 60
  input.action in ["upload", "download"]
}

deny_reason["Very high risk for file deletion"] {
  input.riskScore >= 40
  input.action == "delete"
}
`
  }
];

async function initializePolicies() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cloud-storage');
    console.log('Connected to MongoDB');

    // Initialize OPA policies
    await opaService.createDefaultPolicies();
    console.log('OPA policies initialized');

    // Create database policies
    for (const policyData of defaultPolicies) {
      const existingPolicy = await Policy.findOne({ name: policyData.name });
      if (!existingPolicy) {
        const policy = new Policy(policyData);
        await policy.save();
        console.log(`Created policy: ${policyData.name}`);
      } else {
        console.log(`Policy already exists: ${policyData.name}`);
      }
    }

    console.log('Policy initialization completed');
    process.exit(0);
  } catch (error) {
    console.error('Policy initialization failed:', error);
    process.exit(1);
  }
}

initializePolicies();