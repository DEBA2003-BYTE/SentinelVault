export interface User {
  id: string;
  email: string;
  isAdmin: boolean;
  isBlocked?: boolean;
  createdAt?: string;
  lastLogin?: string;
  zkpVerified?: boolean;
  deviceFingerprint?: string;
  registeredLocation?: string;
  did?: string;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
  riskScore?: number;
  zkpVerified?: boolean;
  opaDecision?: 'allow' | 'deny';
  deviceInfo?: {
    fingerprint: string;
    location?: string;
    isRecognized: boolean;
    riskScore: number;
    riskFactors?: string[];
  };
}

export interface FileItem {
  id: string;
  filename: string;
  size: number;
  mimeType: string;
  uploadedAt: string;
  accessCount: number;
  visibility?: 'all' | 'specific' | 'none';
  sharedWith?: string[];
  isOwned?: boolean;
}

export interface UploadResponse {
  message: string;
  file: FileItem;
  riskScore: number;
}

export interface RiskAssessment {
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  factors: {
    ipAddress: string;
    location?: string;
    deviceFingerprint?: string;
    recentFailures: number;
  };
  recentActivity: Array<{
    action: string;
    timestamp: string;
    allowed: boolean;
    riskScore: number;
  }>;
}

export interface AdminUser extends User {
  fileCount: number;
  recentLogins: number;
}

export interface AuditLog {
  id: string;
  user: string;
  file?: string;
  action: string;
  riskScore: number;
  ipAddress: string;
  location?: string;
  timestamp: string;
  allowed: boolean;
  reason?: string;
}

export interface SystemStats {
  users: {
    total: number;
    blocked: number;
    active: number;
    zkpVerified: number;
  };
  files: {
    total: number;
    totalSizeBytes: number;
  };
  activity: {
    recentLogins: number;
    recentUploads: number;
    highRiskAttempts: number;
  };
  security: {
    opaDenials: number;
    zkpVerifications: number;
    zkpVerificationRate: string;
  };
}

// ZKP Types
export interface ZKPProof {
  proof: string;
  publicSignals: string[];
}

export interface ZKPStatus {
  verified: boolean;
  hasProof: boolean;
  verifiedAt?: string;
  publicSignals?: string[];
}

export interface ZKPResponse {
  message: string;
  verified: boolean;
  timestamp: string;
  riskScore?: number;
}

// OPA Types
export interface OPADecision {
  decision: 'allow' | 'deny';
  allow: boolean;
  reason?: string;
  riskScore: number;
  factors?: string[];
  timestamp: string;
}

export interface PolicyRule {
  id: string;
  name: string;
  description: string;
  policyCode: string;
  createdAt: string;
  updatedAt?: string;
}

// Enhanced types
export interface RejectionReason {
  details: string;
  policy?: {
    description: string;
  };
  riskScore: number;
  factors?: {
    location?: string;
    registeredLocation?: string;
    fingerprintMatch?: boolean;
    deviceFingerprint?: string;
  };
}

export interface GPSLocation {
  type: 'Point';
  coordinates: [number, number];
  name?: string;
  lat: number;
  lon: number;
}

export interface DeviceContext {
  fingerprint: string;
  location?: GPSLocation | null;
  gps?: { lat: number; lon: number } | null;
  deviceId?: string;
  localTimestamp?: string;
  userAgent: string;
  ipAddress?: string;
  timestamp: string;
  clientInfo?: {
    screenResolution: string;
    colorDepth: number;
    pixelRatio: number;
    timezone: string;
    platform: string;
    language: string;
    cookieEnabled: boolean;
    doNotTrack: string | null;
  };
}