export interface User {
  id: string;
  email: string;
  isAdmin: boolean;
  isBlocked?: boolean;
  createdAt?: string;
  lastLogin?: string;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
  riskScore?: number;
}

export interface FileItem {
  id: string;
  filename: string;
  size: number;
  mimeType: string;
  uploadedAt: string;
  accessCount: number;
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
}