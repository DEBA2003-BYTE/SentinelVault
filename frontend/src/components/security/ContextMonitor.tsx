import React, { useEffect, useState } from 'react';
import { MapPin, Smartphone, Globe, Clock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const ContextMonitor: React.FC = () => {
  const { deviceContext, user, refreshDeviceContext } = useAuth();
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      refreshDeviceContext();
      setLastUpdate(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [refreshDeviceContext]);

  if (!deviceContext) {
    return (
      <div className="context-monitor loading">
        <h3>Security Context</h3>
        <p>Loading security context...</p>
      </div>
    );
  }

  const isLocationMatch = user?.registeredLocation === deviceContext.location;
  const isDeviceMatch = user?.deviceFingerprint === deviceContext.fingerprint;

  return (
    <div className="context-monitor">
      <div className="monitor-header">
        <h3>Security Context Monitor</h3>
        <div className="last-update">
          <Clock className="w-4 h-4" />
          <span>Updated: {lastUpdate.toLocaleTimeString()}</span>
        </div>
      </div>

      <div className="context-grid">
        <div className="context-item">
          <div className="context-header">
            <MapPin className="w-5 h-5" />
            <span>Location</span>
          </div>
          <div className="context-content">
            <div className="current-value">
              <span className="label">Current:</span>
              <span className="value">{deviceContext.location || 'Unknown'}</span>
            </div>
            {user?.registeredLocation && (
              <div className="registered-value">
                <span className="label">Registered:</span>
                <span className="value">{user.registeredLocation}</span>
              </div>
            )}
            <div className={`match-status ${isLocationMatch ? 'match' : 'mismatch'}`}>
              {isLocationMatch ? '✓ Location matches' : '⚠ Location differs'}
            </div>
          </div>
        </div>

        <div className="context-item">
          <div className="context-header">
            <Smartphone className="w-5 h-5" />
            <span>Device</span>
          </div>
          <div className="context-content">
            <div className="current-value">
              <span className="label">Fingerprint:</span>
              <span className="value fingerprint">
                {deviceContext.fingerprint.slice(0, 8)}...
              </span>
            </div>
            {user?.deviceFingerprint && (
              <div className="registered-value">
                <span className="label">Registered:</span>
                <span className="value fingerprint">
                  {user.deviceFingerprint.slice(0, 8)}...
                </span>
              </div>
            )}
            <div className={`match-status ${isDeviceMatch ? 'match' : 'mismatch'}`}>
              {isDeviceMatch ? '✓ Device recognized' : '⚠ New device detected'}
            </div>
          </div>
        </div>

        <div className="context-item">
          <div className="context-header">
            <Globe className="w-5 h-5" />
            <span>Browser</span>
          </div>
          <div className="context-content">
            <div className="current-value">
              <span className="label">User Agent:</span>
              <span className="value user-agent">
                {deviceContext.userAgent.split(' ')[0]}
              </span>
            </div>
            <div className="browser-info">
              <span className="label">Platform:</span>
              <span className="value">{navigator.platform}</span>
            </div>
            <div className="browser-info">
              <span className="label">Language:</span>
              <span className="value">{navigator.language}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="security-summary">
        <h4>Security Assessment</h4>
        <div className="assessment-items">
          <div className={`assessment-item ${isLocationMatch ? 'secure' : 'warning'}`}>
            <span>Location Verification</span>
            <span className="status">{isLocationMatch ? 'Verified' : 'Unverified'}</span>
          </div>
          <div className={`assessment-item ${isDeviceMatch ? 'secure' : 'warning'}`}>
            <span>Device Recognition</span>
            <span className="status">{isDeviceMatch ? 'Recognized' : 'New Device'}</span>
          </div>
          <div className={`assessment-item ${user?.zkpVerified ? 'secure' : 'info'}`}>
            <span>Identity Verification</span>
            <span className="status">{user?.zkpVerified ? 'Verified' : 'Pending'}</span>
          </div>
        </div>
      </div>

      <div className="monitor-actions">
        <button 
          onClick={refreshDeviceContext}
          className="btn btn-secondary btn-sm"
        >
          Refresh Context
        </button>
      </div>
    </div>
  );
};

export default ContextMonitor;