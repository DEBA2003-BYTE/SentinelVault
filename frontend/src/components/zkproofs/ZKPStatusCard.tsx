import React from 'react';
import { Shield, CheckCircle, XCircle, Clock, Smartphone, MapPin } from 'lucide-react';
import { useZKP } from '../../contexts/ZKPContext';
import { useAuth } from '../../contexts/AuthContext';

const ZKPStatusCard: React.FC = () => {
  const { status, loading } = useZKP();
  const { user, deviceContext } = useAuth();

  if (loading) {
    return (
      <div className="zkp-status-card loading">
        <div className="status-header">
          <Shield className="w-5 h-5" />
          <span>Device & Identity Status</span>
        </div>
        <div className="status-content">
          <div className="loading-spinner"></div>
          <span>Loading verification status...</span>
        </div>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="zkp-status-card error">
        <div className="status-header">
          <Shield className="w-5 h-5" />
          <span>Device & Identity Status</span>
        </div>
        <div className="status-content">
          <XCircle className="w-8 h-8 text-red-500" />
          <span>Unable to load verification status</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`zkp-status-card ${status.verified ? 'verified' : 'unverified'}`}>
      <div className="status-header">
        <Shield className="w-5 h-5" />
        <span>Device & Identity Status</span>
      </div>
      
      <div className="status-content">
        {/* Device Information - Always Show */}
        <div className="verification-details" style={{ marginBottom: 'var(--space-4)' }}>
          <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-3)' }}>
            Registered Device
          </h4>
          <div className="detail-item">
            <Smartphone className="w-4 h-4" />
            <div>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-gray-500)' }}>Device Fingerprint:</span>
              <span style={{ fontSize: 'var(--text-sm)', fontFamily: 'monospace', display: 'block' }}>
                {user?.deviceFingerprint ? user.deviceFingerprint.slice(0, 16) + '...' : deviceContext?.fingerprint.slice(0, 16) + '...'}
              </span>
            </div>
          </div>
          <div className="detail-item">
            <MapPin className="w-4 h-4" />
            <div>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-gray-500)' }}>Location:</span>
              <span style={{ fontSize: 'var(--text-sm)', display: 'block' }}>
                {user?.registeredLocation || deviceContext?.location || 'Unknown'}
              </span>
            </div>
          </div>
        </div>

        {/* ZKP Verification Status */}
        <div className="verification-status">
          {status.verified ? (
            <CheckCircle className="w-8 h-8 text-green-500" />
          ) : (
            <XCircle className="w-8 h-8 text-gray-400" />
          )}
          <div className="status-text">
            <h3>{status.verified ? 'ZKP Identity Verified' : 'ZKP Not Verified'}</h3>
            <p>
              {status.verified 
                ? 'Your identity has been cryptographically verified'
                : 'Optional: Complete ZKP verification for enhanced security'
              }
            </p>
          </div>
        </div>

        {status.verified && status.verifiedAt && (
          <div className="verification-details" style={{ marginTop: 'var(--space-4)' }}>
            <div className="detail-item">
              <Clock className="w-4 h-4" />
              <span>Verified: {new Date(status.verifiedAt).toLocaleString()}</span>
            </div>
            {status.publicSignals && status.publicSignals.length > 0 && (
              <div className="detail-item">
                <Shield className="w-4 h-4" />
                <span>Proof Signals: {status.publicSignals.length}</span>
              </div>
            )}
          </div>
        )}

        {!status.verified && (
          <div className="verification-prompt">
            <p>Complete ZKP verification to:</p>
            <ul>
              <li>Reduce your risk score</li>
              <li>Access enhanced features</li>
              <li>Improve security rating</li>
            </ul>
            <button 
              onClick={() => window.location.href = '/proofs'}
              style={{
                marginTop: 'var(--space-3)',
                padding: 'var(--space-2) var(--space-4)',
                backgroundColor: 'var(--color-blue-600)',
                color: 'white',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                fontSize: 'var(--text-sm)',
                fontWeight: 'var(--font-medium)'
              }}
            >
              Complete Verification
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ZKPStatusCard;