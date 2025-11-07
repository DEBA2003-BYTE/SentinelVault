import React from 'react';
import { X, AlertTriangle, Shield, MapPin, Smartphone } from 'lucide-react';
import type { RejectionReason } from '../../types';
import { useRejectionReason } from '../../contexts/ReasonContext';

interface RejectionReasonModalProps {
  reason?: RejectionReason | null;
  onClose?: () => void;
}

const RejectionReasonModal: React.FC<RejectionReasonModalProps> = ({ 
  reason: propReason, 
  onClose: propOnClose 
}) => {
  const { reason: contextReason, clearReason } = useRejectionReason();
  
  const reason = propReason || contextReason;
  const onClose = propOnClose || clearReason;

  if (!reason) return null;

  const getRiskLevelColor = (score: number) => {
    if (score >= 80) return 'text-red-600';
    if (score >= 60) return 'text-orange-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getRiskLevelText = (score: number) => {
    if (score >= 80) return 'Critical';
    if (score >= 60) return 'High';
    if (score >= 40) return 'Medium';
    return 'Low';
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content rejection-modal">
        <div className="modal-header">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-red-500" />
            <h2>Access Denied</h2>
          </div>
          <button onClick={onClose} className="modal-close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="modal-body">
          <div className="rejection-summary">
            <p className="rejection-message">{reason.details}</p>
          </div>

          <div className="rejection-details">
            {reason.policy && (
              <div className="detail-section">
                <div className="detail-header">
                  <Shield className="w-4 h-4" />
                  <span>Policy Information</span>
                </div>
                <p className="detail-value">{reason.policy.description}</p>
              </div>
            )}

            <div className="detail-section">
              <div className="detail-header">
                <AlertTriangle className="w-4 h-4" />
                <span>Risk Assessment</span>
              </div>
              <div className="risk-info">
                <span className="risk-score">
                  Score: <span className={getRiskLevelColor(reason.riskScore)}>
                    {reason.riskScore}/100 ({getRiskLevelText(reason.riskScore)})
                  </span>
                </span>
              </div>
            </div>

            {reason.factors && (
              <>
                {(reason.factors.location || reason.factors.registeredLocation) && (
                  <div className="detail-section">
                    <div className="detail-header">
                      <MapPin className="w-4 h-4" />
                      <span>Location Information</span>
                    </div>
                    <div className="location-info">
                      {reason.factors.registeredLocation && (
                        <p><strong>Registered:</strong> {reason.factors.registeredLocation}</p>
                      )}
                      {reason.factors.location && (
                        <p><strong>Current:</strong> {reason.factors.location}</p>
                      )}
                    </div>
                  </div>
                )}

                {reason.factors.deviceFingerprint !== undefined && (
                  <div className="detail-section">
                    <div className="detail-header">
                      <Smartphone className="w-4 h-4" />
                      <span>Device Verification</span>
                    </div>
                    <p className="detail-value">
                      Device Match: <span className={reason.factors.fingerprintMatch ? 'text-green-600' : 'text-red-600'}>
                        {reason.factors.fingerprintMatch ? 'Yes' : 'No'}
                      </span>
                    </p>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="rejection-actions">
            <div className="security-tips">
              <h4>Security Recommendations:</h4>
              <ul>
                <li>Ensure you're logging in from a recognized device</li>
                <li>Verify your location matches your registered location</li>
                <li>Consider completing identity verification if available</li>
                <li>Contact support if you believe this is an error</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="btn btn-primary">
            Understood
          </button>
        </div>
      </div>
    </div>
  );
};

export default RejectionReasonModal;