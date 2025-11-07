
# ☁️ Risk-Adaptive Cloud Storage Platform (Final Enhanced Version)

---

## 🧩 Overview

A **secure, intelligent, privacy-preserving** cloud storage system that dynamically adapts access permissions based on **real-time risk**, **contextual awareness**, and **cryptographic identity verification**.
It unifies **Open Policy Agent (OPA)** for policy-as-code, **Zero-Knowledge Proofs (ZKP)** for privacy, and **Self-Sovereign Identity (SSI)** for decentralized identity — delivering both **security** and **user transparency** across **multi-cloud environments**.

---

## ⚙️ Core Features

### 🧠 Dynamic Risk-Adaptive Access Control (RAdAC)

* Integrates **Open Policy Agent (OPA)** for **fine-grained, programmable policy enforcement**.
* Continuously evaluates **device fingerprints**, **IP reputation**, **location**, and **behavior patterns**.
* Dynamically adjusts permissions — automatically tightens or relaxes access as risk fluctuates.
* Supports **multi-cloud unification** with consistent security enforcement across **AWS, Azure, and GCP**.
* Each OPA evaluation now returns a **transparent reason** when access is denied (e.g., *“Login from untrusted location”*).

---

### 🔒 Privacy-Preserving Identity Verification

* Integrates **Zero-Knowledge Proofs (ZKP)** for **confidential identity validation** — users can prove credentials (like “verified employee” or “age > 18”) **without revealing raw data**.
* Uses **Circom + SnarkJS** for browser-side proof generation and backend verification.
* Reduces the risk of credential exposure and enables **trust without disclosure**.
* Incorporates **Self-Sovereign Identity (SSI)** via **Decentralized Identifiers (DIDs)** for privacy-centric, federated authentication.
* ZKP verification directly lowers user’s dynamic risk score within the OPA engine.

---

### 📦 Intelligent File Management System

* Secure file storage supporting **PDF, image, text, and document** formats.
* Managed via **AWS S3**, with **AES256 server-side encryption** and **presigned access URLs**.
* Files are uploaded and retrieved only after **OPA policy approval**.
* **ZKP-based access gating:** Sensitive files require verified cryptographic proofs before download.
* **Rejection Transparency:** When a file action is denied, users see why (e.g., *“Device fingerprint mismatch”*).
* Metadata stored in **MongoDB**, including file info, access logs, and OPA decision history.

---

### 🧑‍💼 Advanced Admin Control Panel

* **Unified Admin Dashboard** for monitoring, analytics, and user control.
* Manage users, risk levels, and proof statuses (ZKP verified/unverified).
* **Audit Trails:** Complete logs of every OPA decision, ZKP verification, and user action.
* **OPA Policy Editor:** Modify, test, and visualize policy-as-code rules in real time.
* **Proof Analytics:** Charts showing proof verification trends, denials, and reasons.
* Supports **user rejection visibility**, allowing admins to review top failure causes (location mismatch, unverified device, etc.).

---

## 🧠 Transparency & Explainability Layer (New)

* Every OPA evaluation includes a **human-readable explanation** for allow/deny decisions.
* Stored in the **AccessLogs** collection and visible to both users and admins.
* Example:

  ```json
  {
    "action": "login",
    "decision": "deny",
    "reason": "Access denied: login from new region not registered during signup"
  }
  ```
* Empowers users with **clear visibility** into system decisions — enhancing **trust** and **accountability**.

---

## 🧰 Tech Stack

| Layer                  | Technologies                              |
| ---------------------- | ----------------------------------------- |
| **Frontend**           | React 19 + TypeScript + Vite              |
| **Backend**            | Express.js + TypeScript (Bun runtime)     |
| **Database**           | MongoDB (Mongoose ODM)                    |
| **Storage**            | AWS S3 (AES256 encrypted)                 |
| **Policy Engine**      | Open Policy Agent (OPA)                   |
| **Privacy Layer**      | Circom + SnarkJS (Zero-Knowledge Proofs)  |
| **Identity Layer**     | SSI (Decentralized Identifiers via DID)   |
| **Risk Contexting**    | Device, location, and behavioral analysis |
| **Transparency Layer** | Human-readable rejection reason system    |

---

## 🎯 Goal

Deliver **enterprise-grade, privacy-first cloud security** that is:

* **Adaptive:** Reacts to changing risk in real time
* **Confidential:** Protects identity using ZKPs and DIDs
* **Explainable:** Offers clear, actionable rejection reasons
* **Scalable:** Unified across multi-cloud environments
* **User-Centric:** Designed for transparency and control

---

## 📱 Advanced Device Authentication & Location Verification (New Feature)

### Device Fingerprinting System
* **Comprehensive Device Characteristics**: Browser fingerprinting using user agent, screen resolution, color depth, pixel ratio, timezone, platform, and language settings
* **Unique Device Signatures**: SHA-256 hash generation from combined device characteristics for persistent device identification
* **Automatic Registration**: First-time device registration during login with persistent recognition across sessions
* **Device Trust Scoring**: Risk assessment based on device recognition status and historical access patterns

### Location-Based Authentication
* **IP Geolocation**: Real-time location detection using IP address with city, country, and region identification
* **Location Consistency**: Validation against registered user location with anomaly detection for unusual access patterns
* **Geographic Risk Assessment**: Location-based risk scoring with higher risk for access from new countries or regions
* **Location History Tracking**: Comprehensive logging of access locations for security analysis and pattern recognition

### Enhanced Security Features
* **Real-time Risk Calculation**: Combined device and location risk scoring with adaptive thresholds
* **Visual Security Feedback**: User-friendly display of device recognition status and location verification
* **Transparent Security Notices**: Clear explanations when devices are unrecognized or locations are anomalous
* **Security Recommendations**: Personalized guidance for improving account security based on device and location patterns
* **Audit Trail Integration**: Complete logging of device and location data in access logs for security monitoring

### Risk Scoring Matrix
| Factor | Risk Impact | Description |
|--------|-------------|-------------|
| Device Match | 0 points | Recognized device fingerprint |
| Device Mismatch | +25 points | Unrecognized device characteristics |
| Location Match | 0 points | Access from registered location |
| Location Anomaly | +20 points | Access from different country/region |
| New Device | +15 points | First-time device registration |
| VPN Detection | +20 points | VPN or proxy usage detected |

This enhanced device authentication system provides an additional layer of security while maintaining user transparency and ease of use.
---

## 
🔐 Multi-Factor Biometric Authentication System (Latest Addition)

### Overview
The system now includes a comprehensive Multi-Factor Authentication (MFA) system focused on biometric authentication methods for enhanced security while maintaining user privacy.

### Biometric Authentication Methods

#### 🫱 Face Recognition Authentication
* **Live Camera Capture**: Real-time video preview using WebRTC for face positioning and capture
* **Local Processing**: Facial features processed entirely on user device for maximum privacy
* **Cryptographic Hashing**: Only secure hashes of facial data stored, never raw biometric information
* **One-Click Setup**: Simple capture process with visual feedback and confirmation
* **High Security Rating**: Maximum security level with tamper-proof verification

#### 👆 Fingerprint Authentication
* **Simulated Scanner Interface**: Animated fingerprint scanning with pulse effects and visual feedback
* **Biometric Capture**: Mock fingerprint scanning ready for integration with actual hardware sensors
* **Hash Generation**: Secure cryptographic hash generation from biometric data
* **Quick Registration**: Fast setup process with immediate factor activation
* **Future-Ready**: Prepared for WebAuthn integration and actual fingerprint sensor connectivity

### Privacy & Security Features

#### 🔒 Privacy Protection
* **Local Processing Only**: All biometric data processed on user's device
* **Hash-Only Storage**: Server stores only cryptographic hashes, never raw biometric data
* **GDPR Compliant**: No personal biometric data transmission or storage
* **User Control**: Users can remove biometric factors at any time
* **Zero Data Leakage**: Impossible to reverse-engineer biometric data from stored hashes

#### 🛡️ Security Benefits
* **High Security Rating**: Both methods provide maximum security classification
* **Risk Score Reduction**: Verified biometric factors reduce user's overall risk score
* **Non-Repudiation**: Cryptographic proof of identity for audit trails
* **Tamper-Proof**: Hashes cannot be forged or modified without detection
* **Multi-Factor Support**: Users can register both face and fingerprint for redundancy

### Technical Implementation

#### Backend API Endpoints
* `GET /api/zk-mfa/factor-types` - Available biometric factor types
* `GET /api/zk-mfa/factors` - User's registered MFA factors
* `POST /api/zk-mfa/register-secret` - Register new biometric factor
* `POST /api/zk-mfa/verify` - Verify MFA factor during authentication
* `DELETE /api/zk-mfa/factors/:type` - Remove MFA factor

#### Frontend Components
* **ZKAuth Page** (`/zkauth`) - Main MFA setup and management interface
* **ZKMFASetup Component** - Complete biometric factor registration
* **BiometricCapture Component** - Camera and sensor interfaces
* **QuickZKPVerify Component** - Dashboard quick verification widget

#### Database Schema
```javascript
// User Model Enhancement
mfaFactors: [{
  type: 'fingerprint_hash' | 'face_recognition_hash',
  secretHash: String,        // Cryptographic hash of biometric
  isActive: Boolean,         // Factor status
  createdAt: Date,          // Registration timestamp
  lastUsed: Date,           // Last authentication timestamp
  metadata: {               // Security information
    strength: 'strong'
  }
}]
```

### User Experience

#### Setup Process
1. **Navigate to MFA**: Access `/zkauth` page (requires authentication)
2. **Choose Method**: Select fingerprint or face recognition
3. **Biometric Capture**: Follow guided capture process with real-time feedback
4. **Confirmation**: Visual confirmation of successful registration
5. **Immediate Activation**: Factor becomes active instantly for enhanced security

#### Visual Feedback
* **Real-Time Camera Preview**: Live video feed for face recognition setup
* **Animated Scanner**: Pulse animation and scanning effects for fingerprint
* **Status Indicators**: Clear active/inactive status display for all factors
* **Success Confirmation**: Visual confirmation of successful biometric capture
* **Error Handling**: Clear error messages and recovery options

### Integration with Existing Systems

#### Risk Assessment Integration
* **Automatic Risk Reduction**: Verified biometric factors reduce user risk scores
* **OPA Policy Integration**: MFA status considered in policy evaluations
* **Audit Trail Enhancement**: All MFA activities logged for security monitoring
* **Admin Visibility**: Admin dashboard shows user MFA status and activity

#### ZKP System Integration
* **Enhanced Verification**: MFA factors can be combined with ZKP proofs
* **Layered Security**: Multiple verification methods for high-security operations
* **Privacy Preservation**: Biometric MFA maintains zero-knowledge principles
* **Unified Authentication**: Seamless integration with existing auth flows

This Multi-Factor Authentication system represents the latest enhancement to the SentinelVault platform, providing enterprise-grade biometric security while maintaining the system's core principles of privacy, transparency, and user control.