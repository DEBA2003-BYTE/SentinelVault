import React from 'react';
import { Smartphone, MapPin, Shield, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface DeviceAuthStatusProps {
  deviceInfo?: {
    fingerprint: string;
    location?: string;
    isRecognized: boolean;
    riskScore: number;
    riskFactors?: string[];
  };
  showDetails?: boolean;
}

const DeviceAuthStatus: React.FC<DeviceAuthStatusProps> = ({ 
  deviceInfo, 
  showDetails = true 
}) => {
  const { user, deviceContext } = useAuth();

  // Use provided deviceInfo or current context
  const currentDevice = deviceInfo || {
    fingerprint: deviceContext?.fingerprint || 'unknown',
    location: deviceContext?.location,
    isRecognized: user?.deviceFingerprint === deviceContext?.fingerprint,
    riskScore: 0,
    riskFactors: []
  };

  const getStatusColor = (isRecognized: boolean, riskScore: number) => {
    if (isRecognized && riskScore < 20) return 'text-green-600';
    if (riskScore < 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusIcon = (isRecognized: boolean, riskScore: number) => {
    if (isRecognized && riskScore < 20) return <CheckCircle className="w-5 h-5 text-green-500" />;
    if (riskScore < 50) return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
    return <XCircle className="w-5 h-5 text-red-500" />;
  };

  const getStatusText = (isRecognized: boolean, riskScore: number) => {
    if (isRecognized && riskScore < 20) return 'Device Recognized';
    if (isRecognized) return 'Device Recognized (Elevated Risk)';
    if (riskScore < 50) return 'Login Failed: Device Mismatch';
    return 'Login Failed: High Risk Device';
  };

  return (
    <div className="device-auth-status">
      <div className="status-header">
        <div className="status-icon">
          {getStatusIcon(currentDevice.isRecognized, currentDevice.riskScore)}
        </div>
        <div className="status-info">
          <h4 className={getStatusColor(currentDevice.isRecognized, currentDevice.riskScore)}>
            {getStatusText(currentDevice.isRecognized, currentDevice.riskScore)}
          </h4>
          {currentDevice.riskScore > 0 && (
            <p className="risk-score">Risk Score: {currentDevice.riskScore}/100</p>
          )}
        </div>
      </div>

      {showDetails && (
        <div className="device-details">
          <div className="detail-item">
            <Smartphone className="w-4 h-4" />
            <div>
              <span className="label">Device ID:</span>
              <span className="value">{currentDevice.fingerprint.slice(0, 12)}...</span>
            </div>
          </div>

          {currentDevice.location && (
            <div className="detail-item">
              <MapPin className="w-4 h-4" />
              <div>
                <span className="label">Location:</span>
                <span className="value">{currentDevice.location}</span>
              </div>
            </div>
          )}

          {user?.registeredLocation && (
            <div className="detail-item">
              <Shield className="w-4 h-4" />
              <div>
                <span className="label">Registered Location:</span>
                <span className="value">{user.registeredLocation}</span>
              </div>
            </div>
          )}

          {currentDevice.riskFactors && currentDevice.riskFactors.length > 0 && (
            <div className="risk-factors">
              <h5>Risk Factors:</h5>
              <ul>
                {currentDevice.riskFactors.map((factor, index) => (
                  <li key={index} className="risk-factor">
                    {factor.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {!currentDevice.isRecognized && (
        <div className="security-notice">
          <AlertTriangle className="w-4 h-4" />
          <div>
            <h5>Authentication Failed</h5>
            <p>
              The email and password you entered do not match with the device you registered with. 
              Please use the same device you used during registration, or register a new account on this device.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeviceAuthStatus;